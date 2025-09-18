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
  if (!blob || blob.size === 0) {
    console.warn('⚠️ No audio blob to upload or blob is empty');
    return;
  }
  
  console.log('🎵 === STARTING AUDIO UPLOAD ===');
  console.log('📊 Audio blob details:', {
    size: blob.size,
    type: blob.type,
    lastModified: blob.lastModified || 'unknown'
  });
  
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
  console.log('📦 Created FormData with filename:', filename);

  try {
    setStatusText('Processing audio...');
    console.log('🚀 Sending POST request to:', TRANSCRIBE_URL);
    
    const startTime = Date.now();
    const response = await fetch(TRANSCRIBE_URL, {
      method: 'POST',
      body: formData,
    });
    const requestTime = Date.now() - startTime;

    console.log('📡 Response received:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      requestTime: requestTime + 'ms'
    });

    if (!response.ok) {
      console.error('❌ Request failed with status:', response.status);
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error response data:', errorData);
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    console.log('✅ Request successful, parsing JSON...');
    const data = await response.json();
    console.log('📋 Response data:', data);
    
    if (data.text) {
      console.log('✅ Transcription successful! Text:', data.text);
      console.log('📝 Appending to transcript area...');
      appendTranscript(data.text);
      console.log('🎵 === AUDIO UPLOAD COMPLETED SUCCESSFULLY ===');
    } else {
      console.warn('⚠️ No text field in response data');
    }
    
    setStatusText(isRecording ? 'Recording' : 'Idle');
  } catch (error) {
    console.error('❌ === AUDIO UPLOAD FAILED ===');
    console.error('❌ Error details:', error);
    setStatusText(`Error: ${error.message}`);
  }
}

async function recordChunk() {
  if (!isRecording || !mediaStream) {
    console.warn('⚠️ Cannot record: isRecording =', isRecording, ', mediaStream =', !!mediaStream);
    return;
  }
  
  console.log('🎙️ === STARTING NEW RECORDING CHUNK ===');
  
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
      console.log('✅ Using supported format:', format);
      break;
    }
  }
  
  if (!options.mimeType) {
    console.log('⚠️ No specific format supported, using default');
  }
  
  // Create a fresh MediaRecorder for each chunk
  mediaRecorder = new MediaRecorder(mediaStream, options);
  
  const chunks = [];
  
  mediaRecorder.ondataavailable = (event) => {
    console.log('📊 Data available event, size:', event.data.size, 'bytes');
    if (event.data.size > 0) {
      chunks.push(event.data);
      console.log('✅ Added chunk, total chunks:', chunks.length);
    } else {
      console.warn('⚠️ Received empty data chunk');
    }
  };
  
  mediaRecorder.onstop = () => {
    console.log('🛑 MediaRecorder stopped, chunks count:', chunks.length);
    if (chunks.length > 0) {
      // Use the same type as the MediaRecorder
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      console.log('📦 Created blob:', {
        size: blob.size,
        type: blob.type,
        mimeType: mediaRecorder.mimeType
      });
      uploadAudio(blob);
    } else {
      console.warn('⚠️ No chunks to upload - recording may have failed');
    }
    
    // Clear the reference to help with cleanup
    mediaRecorder = null;
  };
  
  mediaRecorder.onerror = (event) => {
    console.error('MediaRecorder error:', event.error);
  };
  
  // Record for exactly 3 seconds (faster transcription)
  console.log('▶️ Starting MediaRecorder...');
  mediaRecorder.start();
  console.log('⏱️ Recording will stop automatically after 3 seconds');
  
  setTimeout(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('⏰ 3 seconds elapsed, stopping recording...');
      mediaRecorder.stop();
    } else {
      console.warn('⚠️ MediaRecorder not in recording state after 3 seconds:', mediaRecorder?.state);
    }
  }, 3000);
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
  
  // Then record a new chunk every 4 seconds (1 second gap for cleanup)
  recordingInterval = setInterval(() => {
    // Add a small delay to ensure previous MediaRecorder is fully cleaned up
    setTimeout(recordChunk, 1000);
  }, 4000);
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
