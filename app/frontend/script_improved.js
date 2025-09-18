const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const transcriptEl = document.getElementById('transcription');

const urlConfig = new URL(window.location.href);
const apiBaseOverride = urlConfig.searchParams.get('api');
const DEFAULT_API_BASE = 'http://localhost:8000';
const API_BASE = apiBaseOverride || DEFAULT_API_BASE;
const TRANSCRIBE_URL = `${API_BASE.replace(/\/$/, '')}/transcribe`;
const TRANSCRIBE_EDUCATIONAL_URL = `${API_BASE.replace(/\/$/, '')}/transcribe-educational`;

let mediaRecorder = null;
let mediaStream = null;
let isRecording = false;
let audioChunks = [];

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
  audioChunks = [];
}

async function uploadAudio(blob, useEducationalEndpoint = false) {
  if (!blob || blob.size === 0) {
    console.warn('⚠️ No audio blob to upload or blob is empty');
    setStatusText('Error: No audio recorded');
    return;
  }
  
  console.log('🎵 === STARTING AUDIO UPLOAD ===');
  console.log('📊 Audio blob details:', {
    size: blob.size,
    type: blob.type,
    duration: blob.size / (16000 * 2), // Approximate duration for 16kHz 16-bit mono
    endpoint: useEducationalEndpoint ? 'educational' : 'standard'
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

  const url = useEducationalEndpoint ? TRANSCRIBE_EDUCATIONAL_URL : TRANSCRIBE_URL;
  const endpointType = useEducationalEndpoint ? 'educational (fair use)' : 'standard';

  try {
    setStatusText(`Processing audio (${endpointType})...`);
    console.log('🚀 Sending POST request to:', url);
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    const requestTime = Date.now() - startTime;

    console.log('📡 Response received:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      requestTime: requestTime + 'ms',
      endpoint: endpointType
    });

    if (!response.ok) {
      console.error('❌ Request failed with status:', response.status);
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error response data:', errorData);
      
      // Check if this is a copyright issue and we haven't tried educational endpoint yet
      if (response.status === 422 && !useEducationalEndpoint && 
          errorData.detail && errorData.detail.includes('copyrighted material')) {
        console.log('🎓 Trying educational endpoint for fair use...');
        setStatusText('Copyright detected, trying educational endpoint...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
        return await uploadAudio(blob, true); // Retry with educational endpoint
      }
      
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    console.log('✅ Request successful, parsing JSON...');
    const data = await response.json();
    console.log('📋 Response data:', data);
    
    if (data.text) {
      console.log('✅ Transcription successful! Text:', data.text);
      console.log('📝 Appending to transcript area...');
      appendTranscript(data.text);
      if (useEducationalEndpoint) {
        appendTranscript('\n[Transcribed using educational fair-use endpoint]');
      }
      console.log('🎵 === AUDIO UPLOAD COMPLETED SUCCESSFULLY ===');
    } else {
      console.warn('⚠️ No text field in response data');
    }
    
    setStatusText('Transcription completed');
  } catch (error) {
    console.error('❌ === AUDIO UPLOAD FAILED ===');
    console.error('❌ Error details:', error);
    
    // Provide specific guidance for copyright issues
    if (error.message.includes('copyrighted material')) {
      setStatusText('Copyright detected. Try: 1) Record your own voice, 2) Use shorter segments, 3) Paraphrase content');
    } else {
      setStatusText(`Error: ${error.message}`);
    }
  }
}

async function startRecording() {
  if (isRecording) return;
  
  setStatusText('Requesting microphone...');
  
  try {
    // Request high-quality audio stream
    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        channelCount: 1,
        sampleRate: 48000, // Higher sample rate for better quality
        sampleSize: 16,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true // Add automatic gain control
      }
    });
  } catch (err) {
    console.error('Microphone access denied:', err);
    setStatusText('Error: Microphone access denied');
    return;
  }

  // Try different audio formats for maximum compatibility and quality
  let options = {};
  const formats = [
    'audio/wav',           // Highest quality, best for transcription
    'audio/mp4',          // Good quality, widely supported
    'audio/mpeg',         // Good compression
    'audio/webm;codecs=opus', // Good for web
    'audio/webm'          // Fallback
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

  // Create MediaRecorder for continuous recording
  mediaRecorder = new MediaRecorder(mediaStream, options);
  audioChunks = [];
  
  mediaRecorder.ondataavailable = (event) => {
    console.log('📊 Data available event, size:', event.data.size, 'bytes');
    if (event.data.size > 0) {
      audioChunks.push(event.data);
      console.log('✅ Added chunk, total chunks:', audioChunks.length);
    } else {
      console.warn('⚠️ Received empty data chunk');
    }
  };
  
  mediaRecorder.onstop = () => {
    console.log('🛑 MediaRecorder stopped, chunks count:', audioChunks.length);
    if (audioChunks.length > 0) {
      // Create one complete blob from all chunks
      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
      console.log('📦 Created complete recording blob:', {
        size: blob.size,
        type: blob.type,
        mimeType: mediaRecorder.mimeType,
        estimatedDuration: (blob.size / (48000 * 2)).toFixed(2) + 's' // Rough estimate
      });
      uploadAudio(blob);
    } else {
      console.warn('⚠️ No chunks to upload - recording may have failed');
      setStatusText('Error: No audio recorded');
    }
  };
  
  mediaRecorder.onerror = (event) => {
    console.error('❌ MediaRecorder error:', event.error);
    setStatusText(`Recording error: ${event.error.message}`);
  };

  isRecording = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  setStatusText('Recording continuously...');
  
  console.log('🎙️ === STARTING CONTINUOUS RECORDING ===');
  console.log('▶️ Starting MediaRecorder for continuous capture...');
  
  // Start continuous recording
  // Request data every 1 second to ensure we don't lose data if something goes wrong
  mediaRecorder.start(1000); 
  
  console.log('✅ Continuous recording started. Press Stop when finished speaking.');
}

function stopRecording() {
  if (!isRecording) return;
  
  console.log('🛑 === STOPPING CONTINUOUS RECORDING ===');
  
  isRecording = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  setStatusText('Finalizing recording...');
  
  // Stop the MediaRecorder
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    console.log('⏹️ Stopping MediaRecorder...');
    mediaRecorder.stop(); // This will trigger onstop and upload the complete audio
  }
  
  // Stop all media tracks
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => {
      track.stop();
      console.log('🔇 Stopped media track:', track.kind);
    });
  }
  
  // Note: We don't reset state here because onstop will handle the upload
  // The state will be reset after successful upload or error
  setTimeout(() => {
    if (!isRecording) { // Only reset if we're still not recording
      resetState();
      if (statusEl.textContent === 'Finalizing recording...') {
        setStatusText('Idle');
      }
    }
  }, 5000); // Give 5 seconds for upload to complete
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
  setStatusText('Ready for continuous recording');
}

// Show supported formats for debugging
console.log('🎵 Supported audio formats:');
const testFormats = [
  'audio/wav',
  'audio/mp4', 
  'audio/mpeg',
  'audio/webm;codecs=opus',
  'audio/webm'
];

testFormats.forEach(format => {
  const supported = MediaRecorder.isTypeSupported(format);
  console.log(`  ${format}: ${supported ? '✅' : '❌'}`);
});
