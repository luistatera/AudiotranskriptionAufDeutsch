const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const transcriptEl = document.getElementById('transcription');

const urlConfig = new URL(window.location.href);
const apiBaseOverride = urlConfig.searchParams.get('api');
const DEFAULT_API_BASE = 'http://localhost:8000';
const API_BASE = apiBaseOverride || DEFAULT_API_BASE;
const TRANSCRIBE_URL = `${API_BASE.replace(/\/$/, '')}/transcribe`;

let mediaRecorder = null;
let mediaStream = null;
let uploadAbortController = null;
let isRecording = false;
let activeUploads = 0;
let chunkTimer = null;
let audioBuffer = [];

function setStatusText(text) {
  statusEl.textContent = text;
}

function refreshStatus() {
  if (!isRecording) {
    setStatusText('Idle');
    return;
  }

  if (activeUploads > 0) {
    setStatusText('Uploading…');
  } else {
    setStatusText('Recording');
  }
}

function appendTranscript(text) {
  if (!text) {
    return;
  }

  const current = transcriptEl.value.trim();
  transcriptEl.value = current ? `${current} ${text.trim()}` : text.trim();
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

function resetState() {
  if (mediaRecorder) {
    mediaRecorder.ondataavailable = null;
    mediaRecorder.onerror = null;
  }
  mediaRecorder = null;
  mediaStream = null;
  uploadAbortController = null;
  activeUploads = 0;
  isRecording = false;
  audioBuffer = [];
  if (chunkTimer) {
    clearInterval(chunkTimer);
    chunkTimer = null;
  }
}

function stopRecording({ dueToError = false, message = '' } = {}) {
  // Flush any remaining buffered audio before stopping
  if (audioBuffer.length > 0) {
    console.log('Flushing buffer on stop:', audioBuffer.length, 'chunks');
    combineAndUploadBuffer();
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop();
    } catch (err) {
      console.error('Failed to stop recorder cleanly', err);
    }
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
  }

  if (uploadAbortController && !uploadAbortController.signal.aborted) {
    uploadAbortController.abort();
  }

  resetState();
  startBtn.disabled = false;
  stopBtn.disabled = true;

  if (dueToError) {
    setStatusText(`Error: ${message}`);
  } else {
    refreshStatus();
  }
}

async function combineAndUploadBuffer() {
  if (audioBuffer.length === 0) {
    return;
  }

  try {
    // Combine all buffered chunks into one blob
    const combinedBlob = new Blob(audioBuffer, { type: audioBuffer[0].type });
    console.log('Combined', audioBuffer.length, 'chunks into', combinedBlob.size, 'bytes');
    
    // Clear buffer
    audioBuffer = [];
    
    // Upload the combined chunk
    await uploadChunk(combinedBlob);
  } catch (error) {
    console.error('Failed to combine buffer:', error);
    audioBuffer = [];
  }
}

async function uploadChunk(blob) {
  if (!blob || blob.size === 0) {
    return;
  }

  console.log('Uploading chunk:', blob.size, 'bytes, type:', blob.type);

  if (!uploadAbortController || uploadAbortController.signal.aborted) {
    return;
  }

  const formData = new FormData();
  // Use appropriate file extension based on blob type
  let filename = 'chunk.webm';
  if (blob.type.includes('mp4')) {
    filename = 'chunk.mp4';
  } else if (blob.type.includes('mpeg')) {
    filename = 'chunk.mp3';
  } else if (blob.type.includes('wav')) {
    filename = 'chunk.wav';
  }
  formData.append('audio', blob, filename);

  activeUploads += 1;
  refreshStatus();

  try {
    const response = await fetch(TRANSCRIBE_URL, {
      method: 'POST',
      body: formData,
      signal: uploadAbortController.signal,
    });

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.detail) {
          detail = errorBody.detail;
        }
      } catch (err) {
        // ignore parse failure
      }
      throw new Error(detail || 'Transcription failed');
    }

    const data = await response.json();
    appendTranscript(data.text || '');
  } catch (error) {
    if (uploadAbortController && uploadAbortController.signal.aborted) {
      return;
    }
    console.error('Upload failed', error);
    // Do not stop recording on transient upload errors; surface error and continue
    setStatusText(`Error: ${error.message || 'Upload failed'}`);
  } finally {
    activeUploads = Math.max(0, activeUploads - 1);
    refreshStatus();
  }
}

function createRecorder(stream) {
  // Try more compatible formats first
  const formats = [
    'audio/mp4',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mpeg',
    'audio/wav',
    'audio/webm;codecs=opus',
    'audio/webm'
  ];
  
  let options = {};

  if (window.MediaRecorder) {
    // Find the first supported format
    for (const format of formats) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(format)) {
        options = { mimeType: format };
        console.log('Using audio format:', format);
        break;
      }
    }
    
    if (!options.mimeType) {
      console.log('Using default MediaRecorder format');
    }
  } else {
    throw new Error('MediaRecorder wird nicht unterstützt. Bitte einen modernen Browser verwenden.');
  }

  return options.mimeType ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
}

async function startRecording() {
  if (isRecording) {
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    console.error('Microphone access denied', err);
    setStatusText('Error: Mikrofonzugriff verweigert');
    stopRecording({ dueToError: true, message: 'Mikrofonzugriff verweigert' });
    return;
  }

  try {
    mediaRecorder = createRecorder(mediaStream);
  } catch (err) {
    console.error('MediaRecorder error', err);
    stopRecording({ dueToError: true, message: err.message || 'Recorder nicht verfügbar' });
    return;
  }

  startBtn.disabled = true;
  stopBtn.disabled = false;
  uploadAbortController = new AbortController();
  isRecording = true;
  refreshStatus();

  mediaRecorder.addEventListener('dataavailable', (event) => {
    if (!isRecording) {
      return;
    }
    console.log('DataAvailable event - chunk size:', event.data.size, 'bytes');
    
    // Buffer small chunks instead of uploading immediately
    if (event.data.size < 5000) {
      console.log('Buffering small chunk:', event.data.size, 'bytes');
      audioBuffer.push(event.data);
      
      // Check if buffer has enough data
      const totalBufferSize = audioBuffer.reduce((sum, chunk) => sum + chunk.size, 0);
      if (totalBufferSize >= 50000) { // 50KB threshold
        console.log('Buffer reached threshold, combining', audioBuffer.length, 'chunks, total:', totalBufferSize, 'bytes');
        combineAndUploadBuffer();
      }
    } else {
      // Large chunk, upload directly
      uploadChunk(event.data);
    }
  });

  mediaRecorder.addEventListener('error', (event) => {
    const message = event?.error?.message || 'Recorder-Fehler';
    console.error('Recorder error event', event);
    stopRecording({ dueToError: true, message });
  });

  const canRequestData = typeof mediaRecorder.requestData === 'function';

  try {
    // Start strategy:
    // - If requestData is supported, start without timeslice and manually request chunks.
    // - Otherwise, pass a longer timeslice (15s) to ensure complete chunks.
    if (canRequestData) {
      mediaRecorder.start();
    } else {
      mediaRecorder.start(15000); // 15 seconds for complete chunks
    }
  } catch (err) {
    console.error('Failed to start recorder', err);
    stopRecording({ dueToError: true, message: err.message || 'Recorder konnte nicht gestartet werden' });
    return;
  }

  if (canRequestData) {
    // Use requestData() for browsers that support it
    chunkTimer = window.setInterval(() => {
      if (!isRecording || !mediaRecorder || mediaRecorder.state !== 'recording') {
        return;
      }
      try {
        mediaRecorder.requestData();
      } catch (err) {
        console.error('requestData failed', err);
      }
    }, 15000); // 15 seconds for more complete chunks
  }

  // Also set up a timer to flush the buffer periodically
  const bufferFlushTimer = window.setInterval(() => {
    if (!isRecording) {
      clearInterval(bufferFlushTimer);
      return;
    }
    if (audioBuffer.length > 0) {
      console.log('Timer flush: buffer has', audioBuffer.length, 'chunks');
      combineAndUploadBuffer();
    }
  }, 20000); // Flush buffer every 20 seconds
}

startBtn.addEventListener('click', () => {
  setStatusText('Initialisiere…');
  startRecording();
});

stopBtn.addEventListener('click', () => {
  stopRecording();
});

if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  setStatusText('Error: Audioaufnahme wird nicht unterstützt');
  startBtn.disabled = true;
  stopBtn.disabled = true;
} else {
  refreshStatus();
}
