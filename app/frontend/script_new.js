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
  formData.append('audio', blob, 'recording.webm');

  try {
    setStatusText('Uploading...');
    
    const response = await fetch(TRANSCRIBE_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.text) {
      appendTranscript(data.text);
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
  
  // Create a fresh MediaRecorder for each chunk
  mediaRecorder = new MediaRecorder(mediaStream, {
    mimeType: 'audio/webm;codecs=opus'
  });
  
  const chunks = [];
  
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };
  
  mediaRecorder.onstop = () => {
    if (chunks.length > 0) {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      uploadAudio(blob);
    }
  };
  
  mediaRecorder.onerror = (event) => {
    console.error('MediaRecorder error:', event.error);
  };
  
  // Record for exactly 10 seconds
  mediaRecorder.start();
  
  setTimeout(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }, 10000);
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
  
  // Then record a new chunk every 10 seconds
  recordingInterval = setInterval(recordChunk, 10000);
}

function stopRecording() {
  isRecording = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  
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


