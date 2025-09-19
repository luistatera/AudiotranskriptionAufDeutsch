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
  const questionButtons = document.querySelectorAll('.speaking__answer-btn');

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
  const TIMESTAMP_SOURCE = 'timestamps.json';

  let mediaRecorder = null;
  let mediaStream = null;
  let isRecording = false;
  let audioChunks = [];
  let activeQuestionContext = null;

  function setStatusText(text) {
    if (statusEl) {
      statusEl.textContent = text;
    }
  }

  function formatStatusMessage(baseText, context = activeQuestionContext) {
    if (context && context.question) {
      return `${baseText} – ${context.question}`;
    }
    return baseText;
  }

  function toggleIndicator(active) {
    if (!recordingIndicator) return;
    recordingIndicator.classList.toggle('is-active', active);
    recordingIndicator.setAttribute('aria-hidden', active ? 'false' : 'true');
  }

  function appendTranscript(text, context = null) {
    if (!transcriptEl || !text) return;
    const normalized = text.trim();
    if (!normalized) return;

    const question = context && context.question ? context.question : '';
    const formatted = question
      ? `Frage: ${question}\nAntwort: ${normalized}`
      : normalized;

    const current = transcriptEl.value.trim();
    transcriptEl.value = current ? `${current}\n\n${formatted}` : formatted;
    transcriptEl.scrollTop = transcriptEl.scrollHeight;
  }

  function setActiveQuestion(button) {
    if (!button) {
      clearActiveQuestion();
      return;
    }

    clearActiveQuestion();

    const questionText = button.dataset.question || button.textContent?.trim() || '';
    activeQuestionContext = {
      button,
      question: questionText,
    };

    button.classList.add('is-recording');
  }

  function clearActiveQuestion(context) {
    const targetContext = context || activeQuestionContext;
    if (!targetContext) {
      return;
    }

    const { button } = targetContext;
    if (button) {
      button.classList.remove('is-recording');
      button.disabled = false;
    }

    if (!context || (activeQuestionContext && button === activeQuestionContext.button)) {
      activeQuestionContext = null;
    }
  }

  function setQuestionButtonsDisabled(disabled) {
    questionButtons.forEach((button) => {
      button.disabled = disabled;
      if (disabled) {
        button.classList.remove('is-recording');
      }
    });

    if (disabled) {
      activeQuestionContext = null;
    }
  }

  function resetState() {
    mediaRecorder = null;
    mediaStream = null;
    isRecording = false;
    audioChunks = [];
    toggleIndicator(false);
  }

  async function uploadAudio(blob, useEducationalEndpoint = false, contextOverride = null) {
    if (!blob || blob.size === 0) {
      console.warn('No audio blob to upload or blob is empty');
      setStatusText('Fehler: Keine Aufnahme erkannt');
      return;
    }

    const questionContext = contextOverride || activeQuestionContext;
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
      const processingMessage = questionContext
        ? `Antwort wird transkribiert (${endpointType})...`
        : `Audio wird verarbeitet (${endpointType})...`;
      setStatusText(formatStatusMessage(processingMessage, questionContext));
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
          setStatusText(
            formatStatusMessage(
              'Urheberrecht erkannt, wechsle zum Educational-Endpunkt...',
              questionContext,
            ),
          );
          await new Promise((resolve) => setTimeout(resolve, 800));
          return uploadAudio(blob, true, questionContext);
        }

        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.text) {
        let transcriptionText = data.text;
        if (useEducationalEndpoint) {
          transcriptionText = `${transcriptionText}\n[Transkription über Educational-Endpunkt]`;
        }
        appendTranscript(transcriptionText, questionContext);
        setStatusText(formatStatusMessage('Transkription abgeschlossen', questionContext));
      } else {
        setStatusText(formatStatusMessage('Keine Transkription erhalten', questionContext));
      }
    } catch (error) {
      console.error('Audio-Upload fehlgeschlagen:', error);
      if (error.message && error.message.includes('copyrighted material')) {
        setStatusText(
          formatStatusMessage(
            'Urheberrechtshinweis. Bitte eigene Stimme nutzen.',
            questionContext,
          ),
        );
      } else {
        setStatusText(formatStatusMessage(`Fehler: ${error.message}`, questionContext));
      }
    } finally {
      clearActiveQuestion(questionContext);
    }
  }

  async function startRecording() {
    if (isRecording) return false;

    setStatusText(formatStatusMessage('Mikrofonzugriff wird angefordert...'));

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
      setStatusText(formatStatusMessage('Fehler: Mikrofonzugriff verweigert'));
      clearActiveQuestion();
      return false;
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
        const contextForUpload = activeQuestionContext;
        uploadAudio(blob, false, contextForUpload);
      } else {
        setStatusText(formatStatusMessage('Fehler: Keine Aufnahme gefunden'));
        clearActiveQuestion();
      }

      setTimeout(() => {
        if (!isRecording) {
          resetState();
          if (statusEl && statusEl.textContent.startsWith('Aufnahme wird beendet')) {
            setStatusText('Bereit');
          }
        }
      }, 3000);
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder-Fehler:', event.error);
      setStatusText(formatStatusMessage(`Aufnahmefehler: ${event.error.message}`));
      clearActiveQuestion();
    };

    isRecording = true;
    if (answerBtn) {
      answerBtn.disabled = true;
    }
    if (stopBtn) {
      stopBtn.disabled = false;
    }
    toggleIndicator(true);
    setStatusText(formatStatusMessage('Aufnahme läuft...'));
    mediaRecorder.start(1000);
    return true;
  }

  function stopRecording() {
    if (!isRecording) return;

    isRecording = false;
    if (answerBtn) {
      answerBtn.disabled = false;
    }
    if (stopBtn) {
      stopBtn.disabled = true;
    }
    toggleIndicator(false);
    setStatusText(formatStatusMessage('Aufnahme wird beendet...'));

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

  async function initTimedTranscript() {
    const container = document.querySelector('.dialogue');
    if (!container || !lessonAudio) {
      return;
    }

    try {
      const response = await fetch(TIMESTAMP_SOURCE);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawFragments = Array.isArray(data.fragments) ? data.fragments : [];
      if (!rawFragments.length) {
        return;
      }

      const skippedTokens = new Set(['Mann', 'Frau']);
      const cleaned = [];
      let removedDuration = 0;

      rawFragments.forEach((fragment) => {
        const text = fragment.lines.join(' ').trim();
        if (!text) {
          return;
        }

        const start = Number.parseFloat(fragment.begin);
        const end = Number.parseFloat(fragment.end);
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
          return;
        }

        const duration = Math.max(0, end - start);

        if (skippedTokens.has(text)) {
          removedDuration += duration;
          return;
        }

        const adjustedStart = Math.max(0, start - removedDuration);
        let adjustedEnd = Math.max(adjustedStart, end - removedDuration);
        if (!(adjustedEnd > adjustedStart) && duration > 0) {
          adjustedEnd = adjustedStart + duration;
        }

        cleaned.push({
          text,
          start: adjustedStart,
          end: adjustedEnd,
        });
      });

      for (let index = 0; index < cleaned.length; index += 1) {
        const current = cleaned[index];
        const next = cleaned[index + 1];
        if (!(current.end > current.start) && next) {
          current.end = next.start;
        }
        if (!(current.end > current.start) && !next) {
          current.end = current.start + 0.4;
        }
      }

      const paragraphs = Array.from(container.querySelectorAll('p'));
      let fragmentIndex = 0;

      const tokenPattern = /[\p{L}\p{M}\d\-']+|[^\p{L}\p{M}\d\s]+/gu;

      const isWordToken = (value) => /^[\p{L}\p{M}\d\-']+$/u.test(value);

      paragraphs.forEach((paragraph) => {
        const strong = paragraph.querySelector('strong');
        const fragment = document.createDocumentFragment();
        if (strong) {
          fragment.appendChild(strong.cloneNode(true));
          const rawParagraphText = paragraph.textContent || '';
          if (rawParagraphText.replace(strong.textContent, '').trim().length) {
            fragment.appendChild(document.createTextNode(' '));
          }
        }

        const speakerText = strong ? strong.textContent : '';
        const rawText = paragraph.textContent || '';
        let content = speakerText ? rawText.replace(speakerText, '') : rawText;
        content = content.replace(/^\s*:\s*/, '').trimStart();

        const parts = content.match(/(\s+|[^\s]+)/g) || [];

        parts.forEach((part) => {
          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(part));
            return;
          }

          const subTokens = part.match(tokenPattern) || [part];
          subTokens.forEach((token) => {
            if (isWordToken(token)) {
              const timing = cleaned[fragmentIndex];
              fragmentIndex += 1;
              if (!timing) {
                fragment.appendChild(document.createTextNode(token));
                return;
              }

              const span = document.createElement('span');
              span.className = 'dialogue__word';
              span.dataset.start = timing.start.toString();
              span.dataset.end = timing.end.toString();
              span.textContent = token;
              fragment.appendChild(span);
            } else {
              fragment.appendChild(document.createTextNode(token));
            }
          });
        });

        paragraph.replaceChildren(fragment);
      });

      const wordSpans = Array.from(container.querySelectorAll('.dialogue__word'));
      const timings = wordSpans.map((span) => ({
        start: Number.parseFloat(span.dataset.start),
        end: Number.parseFloat(span.dataset.end),
      }));

      let timeScale = 1;
      const transcriptDuration = timings.length ? timings[timings.length - 1].end : 0;

      const updateTimeScale = () => {
        const audioDuration = lessonAudio.duration;
        if (
          Number.isFinite(audioDuration) &&
          audioDuration > 0 &&
          Number.isFinite(transcriptDuration) &&
          transcriptDuration > 0
        ) {
          timeScale = transcriptDuration / audioDuration;
        }
      };

      if (Number.isFinite(lessonAudio.duration)) {
        updateTimeScale();
      }

      lessonAudio.addEventListener('loadedmetadata', updateTimeScale);

      let activeIndex = -1;

      const activateWord = (index) => {
        if (activeIndex === index) {
          return;
        }
        if (activeIndex >= 0) {
          wordSpans[activeIndex].classList.remove('is-active');
        }
        activeIndex = index;
        if (activeIndex >= 0 && wordSpans[activeIndex]) {
          wordSpans[activeIndex].classList.add('is-active');
        }
      };

      const syncHighlight = () => {
        if (!wordSpans.length) {
          return;
        }

        const time = lessonAudio.currentTime * timeScale;
        let nextIndex = -1;

        for (let i = 0; i < timings.length; i += 1) {
          const start = timings[i].start;
          const explicitEnd = timings[i].end;
          const nextStart = i < timings.length - 1 ? timings[i + 1].start : explicitEnd;
          const end = explicitEnd > start ? explicitEnd : Math.max(nextStart, start + 0.1);
          if (time >= start && time < end) {
            nextIndex = i;
            break;
          }
        }

        activateWord(nextIndex);
      };

      lessonAudio.addEventListener('timeupdate', syncHighlight);
      lessonAudio.addEventListener('seeked', syncHighlight);
      lessonAudio.addEventListener('play', syncHighlight);
      lessonAudio.addEventListener('ended', () => activateWord(-1));

      syncHighlight();

      if (fragmentIndex !== cleaned.length) {
        console.warn(
          'Mismatch between transcript tokens and rendered words:',
          'used',
          fragmentIndex,
          'available',
          cleaned.length,
        );
      }
    } catch (error) {
      console.error('Zeitmarken konnten nicht geladen werden:', error);
    }
  }

  initTimedTranscript();

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

  if (questionButtons.length) {
    questionButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (isRecording) {
          setStatusText(
            formatStatusMessage(
              'Bitte beende zuerst die aktuelle Aufnahme.',
              activeQuestionContext,
            ),
          );
          return;
        }

        setActiveQuestion(button);
        button.disabled = true;

        Promise.resolve(startRecording()).then((started) => {
          if (!started) {
            clearActiveQuestion();
            return;
          }

          if (stopBtn) {
            stopBtn.focus();
          }
        });
      });
    });
  }

  if (answerBtn && stopBtn) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatusText('Auf diesem Gerät ist keine Aufnahme möglich.');
      answerBtn.disabled = true;
      stopBtn.disabled = true;
      setQuestionButtonsDisabled(true);
    } else if (!window.MediaRecorder) {
      setStatusText('MediaRecorder wird nicht unterstützt.');
      answerBtn.disabled = true;
      stopBtn.disabled = true;
      setQuestionButtonsDisabled(true);
    } else {
      setStatusText('Bereit');
      setQuestionButtonsDisabled(false);
      answerBtn.addEventListener('click', startRecording);
      stopBtn.addEventListener('click', stopRecording);
    }
  } else {
    setQuestionButtonsDisabled(true);
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
