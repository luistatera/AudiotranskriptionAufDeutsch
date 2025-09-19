(function () {
  const playButton = document.getElementById('playButton');
  const lessonAudio = document.getElementById('lessonAudio');
  const quizItems = document.querySelectorAll('[data-question]');
  const answerBtn = document.getElementById('answerBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusEl = document.getElementById('status');
  const transcriptEl = document.getElementById('transcription');
  const clearBtn = document.getElementById('clearBtn');
  const recordingIndicator = document.getElementById('recordingIndicator');

  if (!playButton || !lessonAudio) {
    console.warn('Lesson audio controls missing; aborting lesson.js');
    return;
  }

  const urlConfig = new URL(window.location.href);
  const apiBaseOverride = urlConfig.searchParams.get('api');
  const DEFAULT_API_BASE = 'http://localhost:8000';
  const API_BASE = (apiBaseOverride || DEFAULT_API_BASE).replace(/\/$/, '');
  const TRANSCRIBE_URL = `${API_BASE}/transcribe`;
  const TRANSCRIBE_EDUCATIONAL_URL = `${API_BASE}/transcribe-educational`;

  let mediaRecorder = null;
  let mediaStream = null;
  let isRecording = false;
  let audioChunks = [];

  function setStatusText(text) {
    if (statusEl) {
      statusEl.textContent = text;
    }
  }

  function toggleIndicator(active) {
    if (!recordingIndicator) return;
    recordingIndicator.classList.toggle('is-active', active);
    recordingIndicator.setAttribute('aria-hidden', active ? 'false' : 'true');
  }

  function appendTranscript(text) {
    if (!transcriptEl || !text) return;
    const current = transcriptEl.value.trim();
    transcriptEl.value = current ? `${current}\n${text.trim()}` : text.trim();
    transcriptEl.scrollTop = transcriptEl.scrollHeight;
  }

  function resetState() {
    mediaRecorder = null;
    mediaStream = null;
    isRecording = false;
    audioChunks = [];
    toggleIndicator(false);
  }

  async function uploadAudio(blob, useEducationalEndpoint = false) {
    if (!blob || blob.size === 0) {
      console.warn('No audio blob to upload or blob is empty');
      setStatusText('Fehler: Keine Aufnahme erkannt');
      return;
    }

    const formData = new FormData();

    let filename = 'recording.webm';
    if (blob.type.includes('mp4')) {
      filename = 'recording.mp4';
    } else if (blob.type.includes('mpeg')) {
      filename = 'recording.mp3';
    } else if (blob.type.includes('wav')) {
      filename = 'recording.wav';
    }

    formData.append('audio', blob, filename);

    const url = useEducationalEndpoint ? TRANSCRIBE_EDUCATIONAL_URL : TRANSCRIBE_URL;
    const endpointType = useEducationalEndpoint ? 'educational (fair use)' : 'standard';

    try {
      setStatusText(`Audio wird verarbeitet (${endpointType})...`);
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (
          response.status === 422 &&
          !useEducationalEndpoint &&
          errorData.detail &&
          typeof errorData.detail === 'string' &&
          errorData.detail.includes('copyrighted material')
        ) {
          setStatusText('Urheberrecht erkannt, wechsle zum Educational-Endpunkt...');
          await new Promise((resolve) => setTimeout(resolve, 800));
          return uploadAudio(blob, true);
        }

        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.text) {
        appendTranscript(data.text);
        if (useEducationalEndpoint) {
          appendTranscript('[Transkription über Educational-Endpunkt]');
        }
        setStatusText('Transkription abgeschlossen');
      } else {
        setStatusText('Keine Transkription erhalten');
      }
    } catch (error) {
      console.error('Audio-Upload fehlgeschlagen:', error);
      if (error.message && error.message.includes('copyrighted material')) {
        setStatusText('Urheberrechtshinweis. Bitte eigene Stimme nutzen.');
      } else {
        setStatusText(`Fehler: ${error.message}`);
      }
    }
  }

  async function startRecording() {
    if (isRecording) return;

    setStatusText('Mikrofonzugriff wird angefordert...');

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      console.error('Mikrofonzugriff verweigert:', err);
      setStatusText('Fehler: Mikrofonzugriff verweigert');
      return;
    }

    let options = {};
    const formats = [
      'audio/wav',
      'audio/mp4',
      'audio/mpeg',
      'audio/webm;codecs=opus',
      'audio/webm',
    ];

    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format)) {
        options = { mimeType: format };
        break;
      }
    }

    mediaRecorder = new MediaRecorder(mediaStream, options);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      if (audioChunks.length > 0) {
        const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
        uploadAudio(blob);
      } else {
        setStatusText('Fehler: Keine Aufnahme gefunden');
      }

      setTimeout(() => {
        if (!isRecording) {
          resetState();
          if (statusEl && statusEl.textContent === 'Aufnahme wird beendet...') {
            setStatusText('Bereit');
          }
        }
      }, 3000);
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder-Fehler:', event.error);
      setStatusText(`Aufnahmefehler: ${event.error.message}`);
    };

    isRecording = true;
    answerBtn.disabled = true;
    stopBtn.disabled = false;
    toggleIndicator(true);
    setStatusText('Aufnahme läuft...');
    mediaRecorder.start(1000);
  }

  function stopRecording() {
    if (!isRecording) return;

    isRecording = false;
    answerBtn.disabled = false;
    stopBtn.disabled = true;
    toggleIndicator(false);
    setStatusText('Aufnahme wird beendet...');

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
  }

  playButton.addEventListener('click', () => {
    if (lessonAudio.paused) {
      lessonAudio.play();
    } else {
      lessonAudio.pause();
    }
  });

  lessonAudio.addEventListener('play', () => {
    playButton.textContent = 'Pause';
  });

  lessonAudio.addEventListener('pause', () => {
    playButton.textContent = 'Play';
  });

  lessonAudio.addEventListener('ended', () => {
    playButton.textContent = 'Play';
  });

  quizItems.forEach((item) => {
    const feedback = item.querySelector('.quiz__feedback');
    const labels = item.querySelectorAll('.quiz__option');
    labels.forEach((label) => {
      const input = label.querySelector('input[type="radio"]');
      if (!input) return;
      input.addEventListener('change', () => {
        labels.forEach((lbl) => lbl.classList.remove('is-correct', 'is-incorrect'));
        feedback.classList.remove('quiz__feedback--correct', 'quiz__feedback--incorrect');

        const isCorrect = label.hasAttribute('data-correct');
        label.classList.add(isCorrect ? 'is-correct' : 'is-incorrect');
        if (feedback) {
          if (isCorrect) {
            feedback.textContent = 'Richtig! Gut gemacht.';
            feedback.classList.add('quiz__feedback--correct');
          } else {
            feedback.textContent = 'Nicht ganz. Versuche es noch einmal.';
            feedback.classList.add('quiz__feedback--incorrect');
          }
        }
      });
    });
  });

  if (answerBtn && stopBtn) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatusText('Auf diesem Gerät ist keine Aufnahme möglich.');
      answerBtn.disabled = true;
      stopBtn.disabled = true;
    } else if (!window.MediaRecorder) {
      setStatusText('MediaRecorder wird nicht unterstützt.');
      answerBtn.disabled = true;
      stopBtn.disabled = true;
    } else {
      setStatusText('Bereit');
      answerBtn.addEventListener('click', startRecording);
      stopBtn.addEventListener('click', stopRecording);
    }
  }

  if (clearBtn && transcriptEl) {
    clearBtn.addEventListener('click', () => {
      transcriptEl.value = '';
      transcriptEl.scrollTop = 0;
      if (!isRecording) {
        setStatusText('Bereit');
      }
    });
  }
})();
