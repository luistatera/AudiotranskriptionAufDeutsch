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
let isRecording = false;
let recordingInterval = null;

function setStatusText(text) {
  statusEl.textContent = text;
}

function appendTranscript(text) {
  if (!text) return;
  
  const current = transcriptEl.value.trim();
  transcriptEl.value = current ? `${current} ${text.trim()}` : text.trim();
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

function resetState() {
  mediaRecorder = null;
  mediaStream = null;
  isRecording = false;
  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }
}

async function uploadAudio(blob) {
  if (!blob || blob.size === 0) return;
  
  console.log('Uploading audio blob:', blob.size, 'bytes, type:', blob.type);
  
  const formData = new FormData();
  
  // Use appropriate filename based on blob type
  let filename = 'recording.webm';
  if (blob.type.includes('mp4')) {
    filename = 'recording.mp4';
  } else if (blob.type.includes('mpeg')) {
    filename = 'recording.mp3';
  } else if (blob.type.includes('wav')) {
    filename = 'recording.wav';
  }
  
  formData.append('audio', blob, filename);

  try {
    setStatusText('Uploading...');
    
    const response = await fetch(TRANSCRIBE_URL, {
      method: 'POST',
      body: formData,
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Response error data:', errorData);
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.text) {
      console.log('Appending text to transcript:', data.text);
      appendTranscript(data.text);
    } else {
      console.log('No text in response');
    }
    
    setStatusText(isRecording ? 'Recording' : 'Idle');
  } catch (error) {
    console.error('Upload failed:', error);
    setStatusText(`Error: ${error.message}`);
  }
}

async function recordChunk() {
  if (!isRecording || !mediaStream) return;
  
  console.log('Starting new recording chunk...');
  
  // Try different audio formats for better compatibility
  let options = {};
  const formats = [
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'audio/webm;codecs=opus',
    'audio/webm'
  ];
  
  for (const format of formats) {
    if (MediaRecorder.isTypeSupported(format)) {
      options = { mimeType: format };
      console.log('Using format:', format);
      break;
    }
  }
  
  if (!options.mimeType) {
    console.log('Using default format');
  }
  
  // Create a fresh MediaRecorder for each chunk
  mediaRecorder = new MediaRecorder(mediaStream, options);
  
  const chunks = [];
  
  mediaRecorder.ondataavailable = (event) => {
    console.log('Data available event, size:', event.data.size);
    if (event.data.size > 0) {
      chunks.push(event.data);
      console.log('Added chunk, total chunks:', chunks.length);
    }
  };
  
  mediaRecorder.onstop = () => {
    console.log('MediaRecorder stopped, chunks count:', chunks.length);
    if (chunks.length > 0) {
      // Use the same type as the MediaRecorder
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      console.log('Created blob:', blob.size, 'bytes, type:', blob.type);
      uploadAudio(blob);
    } else {
      console.log('No chunks to upload');
    }
    
    // Clear the reference to help with cleanup
    mediaRecorder = null;
  };
  
  mediaRecorder.onerror = (event) => {
    console.error('MediaRecorder error:', event.error);
  };
  
  // Record for exactly 15 seconds (longer chunks are more reliable)
  mediaRecorder.start();
  
  setTimeout(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('Stopping recording after 15 seconds');
      mediaRecorder.stop();
    }
  }, 15000);
}

async function startRecording() {
  if (isRecording) return;
  
  setStatusText('Requesting microphone...');
  
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true
      }
    });
  } catch (err) {
    console.error('Microphone access denied:', err);
    setStatusText('Error: Microphone access denied');
    return;
  }

  isRecording = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  setStatusText('Recording');
  
  // Record first chunk immediately
  recordChunk();
  
  // Then record a new chunk every 16 seconds (1 second gap for cleanup)
  recordingInterval = setInterval(() => {
    // Add a small delay to ensure previous MediaRecorder is fully cleaned up
    setTimeout(recordChunk, 1000);
  }, 16000);
}

function stopRecording() {
  console.log('Stop recording requested');
  
  // First, capture any current recording before stopping
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    console.log('Stopping current recording to capture final chunk');
    mediaRecorder.stop(); // This will trigger onstop and upload the final chunk
    
    // Give it a moment to process the final chunk
    setTimeout(() => {
      finishStopRecording();
    }, 500);
  } else {
    finishStopRecording();
  }
}

function finishStopRecording() {
  console.log('Finishing stop recording process');
  isRecording = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }
  
  resetState();
  setStatusText('Idle');
}

// Event listeners
startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);

// Check browser support
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  setStatusText('Error: Audio recording not supported');
  startBtn.disabled = true;
} else if (!window.MediaRecorder) {
  setStatusText('Error: MediaRecorder not supported');
  startBtn.disabled = true;
} else {
  setStatusText('Ready');
}
