(function () {
  const playButton = document.getElementById('playButton');
  const lessonAudio = document.getElementById('lessonAudio');
  const quizItems = document.querySelectorAll('[data-question]');
  const statusEl = document.getElementById('status');
  const recordingIndicator = document.getElementById('recordingIndicator');
  const questionButtons = document.querySelectorAll('.speaking__answer-btn');


  if (!playButton || !lessonAudio) {
    console.warn('Lesson audio controls missing; aborting lesson.js');
    console.log('playButton found:', !!playButton);
    console.log('lessonAudio found:', !!lessonAudio);
    return;
  }

  console.log('Audio controls initialized successfully');
  console.log('Audio source:', lessonAudio.src);
  console.log('Play button text:', playButton.textContent);
  
  // Add detailed audio event listeners for debugging
  lessonAudio.addEventListener('loadstart', () => console.log('Audio: loadstart'));
  lessonAudio.addEventListener('loadeddata', () => console.log('Audio: loadeddata'));
  lessonAudio.addEventListener('loadedmetadata', () => console.log('Audio: loadedmetadata'));
  lessonAudio.addEventListener('canplay', () => console.log('Audio: canplay'));
  lessonAudio.addEventListener('canplaythrough', () => console.log('Audio: canplaythrough'));
  lessonAudio.addEventListener('error', (e) => {
    console.error('Audio error event:', e);
    console.error('Audio error details:', lessonAudio.error);
    if (lessonAudio.error) {
      console.error('Error code:', lessonAudio.error.code);
      console.error('Error message:', lessonAudio.error.message);
    }
  });
  
  // Try to load metadata immediately
  lessonAudio.load();

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
  let activeQuestionContext = null;
  let pendingUploadContext = null;

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

  function resolveTranscriptionTarget(context) {
    if (!context) return null;

    if (context.transcriptionEl && document.body.contains(context.transcriptionEl)) {
      return context.transcriptionEl;
    }

    const questionItem = context.button?.closest('.speaking__question');
    if (!questionItem) return null;

    const transcriptionEl = questionItem.querySelector('.speaking__transcription');
    if (transcriptionEl) {
      context.transcriptionEl = transcriptionEl;
    }
    return transcriptionEl;
  }

  function appendTranscript(text, context = null) {
    const normalized = text ? text.trim() : '';
    if (!normalized) return;

    const targetContext = context || activeQuestionContext;
    const transcriptionEl = resolveTranscriptionTarget(targetContext);

    if (!transcriptionEl) {
      console.warn('Keine Transkriptionsausgabe gefunden für den Kontext.');
      return;
    }

    transcriptionEl.textContent = normalized;
  }

  function setActiveQuestion(button) {
    if (!button) {
      clearActiveQuestion();
      return;
    }

    clearActiveQuestion();

    const questionText = button.dataset.question || button.textContent?.trim() || '';
    const transcriptionEl = button.closest('.speaking__question')?.querySelector('.speaking__transcription') || null;
    const originalLabel = button.dataset.originalLabel || button.textContent?.trim() || 'Antwort';
    button.dataset.originalLabel = originalLabel;
    button.textContent = 'Stopp';
    button.setAttribute('aria-pressed', 'true');
    activeQuestionContext = {
      button,
      question: questionText,
      transcriptionEl,
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
      const originalLabel = button.dataset.originalLabel || 'Antwort';
      button.textContent = originalLabel;
      button.setAttribute('aria-pressed', 'false');
    }

    if (!context || (activeQuestionContext && button === activeQuestionContext.button)) {
      activeQuestionContext = null;
    }
  }

  function setQuestionButtonsDisabled(disabled) {
    questionButtons.forEach((button) => {
      button.disabled = disabled;
      button.setAttribute('aria-pressed', 'false');
      if (disabled) {
        button.classList.remove('is-recording');
        const originalLabel = button.dataset.originalLabel || 'Antwort';
        button.textContent = originalLabel;
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
    pendingUploadContext = null;
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
      pendingUploadContext = null;
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
        const contextForUpload = pendingUploadContext || activeQuestionContext;
        pendingUploadContext = null;
        uploadAudio(blob, false, contextForUpload);
      } else {
        setStatusText(formatStatusMessage('Fehler: Keine Aufnahme gefunden'));
        clearActiveQuestion();
        pendingUploadContext = null;
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
      pendingUploadContext = null;
    };

    isRecording = true;
    toggleIndicator(true);
    setStatusText(formatStatusMessage('Aufnahme läuft...'));
    mediaRecorder.start(1000);
    return true;
  }

  function stopRecording() {
    if (!isRecording) return;

    isRecording = false;
    const questionContext = activeQuestionContext;
    if (questionContext && questionContext.button) {
      pendingUploadContext = questionContext;
      clearActiveQuestion(questionContext);
    } else {
      pendingUploadContext = null;
    }
    toggleIndicator(false);
    setStatusText(formatStatusMessage('Aufnahme wird beendet...', questionContext));

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
  }

  /**
   * Get translated text for audio controls
   */
  function getAudioControlText(germanKey) {
    if (window.translationMenu && window.translationMenu.getCurrentLanguage() && window.TRANSLATIONS) {
      const currentLang = window.translationMenu.getCurrentLanguage();
      const translation = window.TRANSLATIONS[germanKey];
      if (translation && translation[currentLang]) {
        return translation[currentLang];
      }
    }
    return germanKey; // Fallback to German
  }

  /**
   * Update play button text based on audio state
   */
  function updatePlayButtonText() {
    if (lessonAudio.paused) {
      playButton.textContent = getAudioControlText('Abspielen');
    } else {
      playButton.textContent = getAudioControlText('Pausieren');
    }
  }

  playButton.addEventListener('click', () => {
    console.log('Play button clicked, audio paused:', lessonAudio.paused);
    
    if (lessonAudio.paused) {
      // Try to play the audio
      const playPromise = lessonAudio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio started playing successfully');
          })
          .catch(error => {
            console.error('Error playing audio:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Audio ready state:', lessonAudio.readyState);
            console.error('Audio network state:', lessonAudio.networkState);
            console.error('Audio current src:', lessonAudio.currentSrc);
            
            // Reset button text on error
            playButton.textContent = getAudioControlText('Abspielen');
            
            // Show user-friendly error message based on error type
            if (error.name === 'NotAllowedError') {
              alert('Bitte erlauben Sie die Audiowiedergabe in Ihrem Browser.');
            } else if (error.name === 'NotSupportedError') {
              alert('Dieses Audioformat wird von Ihrem Browser nicht unterstützt.');
            } else if (error.name === 'AbortError') {
              alert('Audiowiedergabe wurde abgebrochen.');
            } else {
              alert(`Fehler beim Abspielen der Audiodatei: ${error.message || error.name || 'Unbekannter Fehler'}`);
            }
          });
      }
    } else {
      lessonAudio.pause();
      console.log('Audio paused');
    }
  });

  lessonAudio.addEventListener('play', () => {
    playButton.textContent = getAudioControlText('Pausieren');
  });

  lessonAudio.addEventListener('pause', () => {
    playButton.textContent = getAudioControlText('Abspielen');
  });

  lessonAudio.addEventListener('ended', () => {
    playButton.textContent = getAudioControlText('Abspielen');
  });

  // Update button text when language changes
  document.addEventListener('languageChanged', () => {
    updatePlayButtonText();
  });

  // Initialize button text on page load
  document.addEventListener('DOMContentLoaded', () => {
    updatePlayButtonText();
  });

  // If already loaded, update immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    updatePlayButtonText();
  }

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
          if (activeQuestionContext && activeQuestionContext.button === button) {
            stopRecording();
          } else {
            setStatusText(
              formatStatusMessage(
                'Bitte beende zuerst die aktuelle Aufnahme.',
                activeQuestionContext,
              ),
            );
          }
          return;
        }

        setActiveQuestion(button);

        Promise.resolve(startRecording()).then((started) => {
          if (!started) {
            clearActiveQuestion();
            return;
          }
        });
      });
    });
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatusText('Auf diesem Gerät ist keine Aufnahme möglich.');
    setQuestionButtonsDisabled(true);
  } else if (!window.MediaRecorder) {
    setStatusText('MediaRecorder wird nicht unterstützt.');
    setQuestionButtonsDisabled(true);
  } else {
    setStatusText('Bereit');
    setQuestionButtonsDisabled(false);
  }

  // Translation and Burger Menu Functionality
  const burgerMenuBtn = document.getElementById('burgerMenuBtn');
  const translationPanel = document.getElementById('translationPanel');
  const menuOverlay = document.getElementById('menuOverlay');
  const closePanelBtn = document.getElementById('closePanelBtn');
  const languageSelect = document.getElementById('languageSelect');

  let currentLanguage = '';
  let isMenuOpen = false;

  // Load saved language preference
  function loadLanguagePreference() {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && languageSelect) {
      languageSelect.value = savedLanguage;
      currentLanguage = savedLanguage;
      if (savedLanguage) {
        showTranslations(savedLanguage);
      }
    }
  }

  // Save language preference
  function saveLanguagePreference(language) {
    localStorage.setItem('selectedLanguage', language);
  }

  // Toggle burger menu
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    
    if (burgerMenuBtn) {
      burgerMenuBtn.classList.toggle('open', isMenuOpen);
    }
    
    if (translationPanel) {
      translationPanel.classList.toggle('open', isMenuOpen);
    }
    
    if (menuOverlay) {
      menuOverlay.classList.toggle('active', isMenuOpen);
    }

    // Prevent body scroll when menu is open
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
  }

  // Close menu
  function closeMenu() {
    if (isMenuOpen) {
      toggleMenu();
    }
  }

  // Get translatable elements
  function getTranslatableElements() {
    const elements = [];
    
    // Title and subtitle
    const title = document.querySelector('.lesson__title');
    const subtitle = document.querySelector('.lesson__subtitle');
    if (title) elements.push({ element: title, text: title.textContent.trim() });
    if (subtitle) elements.push({ element: subtitle, text: subtitle.textContent.trim() });

    // Figure caption
    const caption = document.querySelector('.lesson__caption');
    if (caption) elements.push({ element: caption, text: caption.textContent.trim() });

    // Section titles (excluding perfekt title to avoid duplication)
    const sectionTitles = document.querySelectorAll('.section-title:not(#perfekt-title)');
    sectionTitles.forEach(title => {
      elements.push({ element: title, text: title.textContent.trim() });
    });

    // Dialogue paragraphs
    const dialogueParagraphs = document.querySelectorAll('.dialogue p');
    dialogueParagraphs.forEach(p => {
      const fullText = p.textContent.trim();
      const strongElement = p.querySelector('strong');
      if (strongElement) {
        // Extract just the dialogue text without the speaker name
        const speakerText = strongElement.textContent;
        const dialogueText = fullText.replace(speakerText, '').trim();
        if (dialogueText) {
          elements.push({ element: p, text: dialogueText, hasStrong: true });
        }
      } else {
        elements.push({ element: p, text: fullText });
      }
    });

    // Quiz prompts
    const quizPrompts = document.querySelectorAll('.quiz__prompt');
    quizPrompts.forEach(prompt => {
      elements.push({ element: prompt, text: prompt.textContent.trim() });
    });

    // Quiz options
    const quizOptions = document.querySelectorAll('.quiz__option');
    quizOptions.forEach(option => {
      const input = option.querySelector('input');
      if (input) {
        const text = option.textContent.replace(input.value, '').trim();
        if (text) {
          elements.push({ element: option, text: text });
        }
      }
    });

    // Speaking section
    const speakingIntro = document.querySelector('.speaking__intro');
    if (speakingIntro) {
      elements.push({ element: speakingIntro, text: speakingIntro.textContent.trim() });
    }

    // Speaking questions
    const speakingQuestions = document.querySelectorAll('.speaking__question-text');
    speakingQuestions.forEach(question => {
      elements.push({ element: question, text: question.textContent.trim() });
    });

    // Perfekt exercise elements
    const perfektTitle = document.querySelector('#perfekt-title');
    if (perfektTitle) {
      elements.push({ element: perfektTitle, text: perfektTitle.textContent.trim() });
    }

    const perfektAudioText = document.querySelector('.perfekt-audio-text');
    if (perfektAudioText) {
      elements.push({ element: perfektAudioText, text: perfektAudioText.textContent.trim() });
    }

    const perfektInstructionText = document.querySelector('.perfekt-instruction-text');
    if (perfektInstructionText) {
      elements.push({ element: perfektInstructionText, text: perfektInstructionText.textContent.trim() });
    }

    const perfektColInfinitive = document.querySelector('.perfekt-col-infinitive');
    if (perfektColInfinitive) {
      elements.push({ element: perfektColInfinitive, text: perfektColInfinitive.textContent.trim() });
    }

    const perfektColPerfect = document.querySelector('.perfekt-col-perfect');
    if (perfektColPerfect) {
      elements.push({ element: perfektColPerfect, text: perfektColPerfect.textContent.trim() });
    }

    const wordBankTitle = document.querySelector('.word-bank-title');
    if (wordBankTitle) {
      elements.push({ element: wordBankTitle, text: wordBankTitle.textContent.trim() });
    }

    // Other elements
    const transriptionLabel = document.querySelector('.textarea-label');
    if (transriptionLabel) {
      elements.push({ element: transriptionLabel, text: transriptionLabel.textContent.trim() });
    }

    const placeholder = document.querySelector('.transcription');
    if (placeholder && placeholder.placeholder) {
      elements.push({ element: placeholder, text: placeholder.placeholder, isPlaceholder: true });
    }

    return elements;
  }

  // Show translations for selected language
  function showTranslations(language) {
    // Remove existing translations
    document.querySelectorAll('.translation').forEach(t => t.remove());

    if (!language || !window.TRANSLATIONS) return;

    const elements = getTranslatableElements();
    
    elements.forEach(({ element, text, hasStrong, isPlaceholder }) => {
      const translation = window.TRANSLATIONS[text];
      if (translation && translation[language]) {
        const translationElement = document.createElement('div');
        translationElement.className = 'translation';
        translationElement.textContent = translation[language];

        if (isPlaceholder) {
          // For placeholder text, update the placeholder attribute
          element.placeholder = element.placeholder + ' / ' + translation[language];
        } else if (hasStrong) {
          // For dialogue with speaker names, insert after the paragraph
          element.parentNode.insertBefore(translationElement, element.nextSibling);
        } else {
          // For regular elements, append after
          element.appendChild(translationElement);
        }

        // Mark element as translatable for styling
        element.classList.add('translatable');
      }
    });
  }

  // Hide all translations
  function hideTranslations() {
    document.querySelectorAll('.translation').forEach(t => t.remove());
    document.querySelectorAll('.translatable').forEach(el => {
      el.classList.remove('translatable');
    });

    // Reset placeholder text
    const placeholder = document.querySelector('.transcription');
    if (placeholder) {
      placeholder.placeholder = 'Hier erscheint dein transkribierter Text...';
    }
  }

  // Event listeners
  if (burgerMenuBtn) {
    burgerMenuBtn.addEventListener('click', toggleMenu);
  }

  if (closePanelBtn) {
    closePanelBtn.addEventListener('click', closeMenu);
  }

  if (menuOverlay) {
    menuOverlay.addEventListener('click', closeMenu);
  }

  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      const selectedLanguage = e.target.value;
      currentLanguage = selectedLanguage;
      
      if (selectedLanguage) {
        showTranslations(selectedLanguage);
        saveLanguagePreference(selectedLanguage);
      } else {
        hideTranslations();
        saveLanguagePreference('');
      }
    });
  }

  // Handle escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen) {
      closeMenu();
    }
  });

  // Load saved preferences on page load
  loadLanguagePreference();

  // Perfekt Exercise Functionality
  const perfektPlayButton = document.getElementById('perfektPlayButton');
  const perfektAudio = document.getElementById('perfektAudio');
  const checkPerfektAnswers = document.getElementById('checkPerfektAnswers');
  const resetPerfektExercise = document.getElementById('resetPerfektExercise');
  const perfektFeedback = document.getElementById('perfektFeedback');
  const draggableWords = document.querySelectorAll('.draggable-word');
  const dropZones = document.querySelectorAll('.perfekt-drop-zone');

  let draggedElement = null;
  let perfektAnswers = {};

  // Audio control for Perfekt exercise
  if (perfektPlayButton && perfektAudio) {
    perfektPlayButton.addEventListener('click', () => {
      if (perfektAudio.paused) {
        perfektAudio.play();
        perfektPlayButton.textContent = 'Pause Audio';
      } else {
        perfektAudio.pause();
        perfektPlayButton.textContent = 'Play Audio';
      }
    });

    perfektAudio.addEventListener('play', () => {
      perfektPlayButton.textContent = 'Pause Audio';
    });

    perfektAudio.addEventListener('pause', () => {
      perfektPlayButton.textContent = 'Play Audio';
    });

    perfektAudio.addEventListener('ended', () => {
      perfektPlayButton.textContent = 'Play Audio';
    });
  }

  // Drag and Drop functionality
  function initDragAndDrop() {
    // Add drag event listeners to draggable words
    draggableWords.forEach(word => {
      word.addEventListener('dragstart', handleDragStart);
      word.addEventListener('dragend', handleDragEnd);
    });

    // Add drop event listeners to drop zones
    dropZones.forEach(zone => {
      zone.addEventListener('dragover', handleDragOver);
      zone.addEventListener('dragenter', handleDragEnter);
      zone.addEventListener('dragleave', handleDragLeave);
      zone.addEventListener('drop', handleDrop);
      
      // Allow clicking on dropped words to remove them
      zone.addEventListener('click', handleDropZoneClick);
    });
  }

  function handleDragStart(e) {
    if (e.target.classList.contains('used')) {
      e.preventDefault();
      return;
    }
    
    draggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  }

  function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedElement = null;
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragEnter(e) {
    e.preventDefault();
    e.target.classList.add('drag-over');
  }

  function handleDragLeave(e) {
    e.target.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.target.classList.remove('drag-over');
    
    if (!draggedElement) return;
    
    const dropZone = e.target.closest('.perfekt-drop-zone');
    if (!dropZone) return;

    // Check if drop zone already has an answer
    const existingAnswer = dropZone.querySelector('.dropped-word');
    if (existingAnswer) {
      // Return the existing word to the word bank
      returnWordToBank(existingAnswer.textContent);
      existingAnswer.remove();
    }

    // Create dropped word element
    const droppedWord = document.createElement('div');
    droppedWord.className = 'dropped-word';
    droppedWord.textContent = draggedElement.textContent;
    droppedWord.addEventListener('click', () => {
      returnWordToBank(droppedWord.textContent);
      droppedWord.remove();
      dropZone.classList.remove('has-answer');
      
      // Hide placeholder
      const placeholder = dropZone.querySelector('.drop-placeholder');
      if (placeholder) {
        placeholder.style.display = 'inline';
      }
      
      // Clear feedback
      clearFeedback();
      
      // Remove answer from tracking
      const verb = dropZone.closest('.perfekt-row').dataset.verb;
      delete perfektAnswers[verb];
    });

    // Clear placeholder and add answer
    const placeholder = dropZone.querySelector('.drop-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
    }
    
    dropZone.appendChild(droppedWord);
    dropZone.classList.add('has-answer');
    
    // Mark original word as used
    draggedElement.classList.add('used');
    draggedElement.draggable = false;
    
    // Track the answer
    const verb = dropZone.closest('.perfekt-row').dataset.verb;
    perfektAnswers[verb] = draggedElement.textContent;
    
    // Clear any existing feedback
    clearFeedback();
  }

  function handleDropZoneClick(e) {
    const droppedWord = e.target.closest('.dropped-word');
    if (droppedWord) {
      returnWordToBank(droppedWord.textContent);
      droppedWord.remove();
      
      const dropZone = e.target.closest('.perfekt-drop-zone');
      dropZone.classList.remove('has-answer');
      
      // Show placeholder again
      const placeholder = dropZone.querySelector('.drop-placeholder');
      if (placeholder) {
        placeholder.style.display = 'inline';
      }
      
      // Clear feedback
      clearFeedback();
      
      // Remove answer from tracking
      const verb = dropZone.closest('.perfekt-row').dataset.verb;
      delete perfektAnswers[verb];
    }
  }

  function returnWordToBank(wordText) {
    const originalWord = Array.from(draggableWords).find(word => 
      word.textContent === wordText
    );
    
    if (originalWord) {
      originalWord.classList.remove('used');
      originalWord.draggable = true;
    }
  }

  function checkAnswers() {
    let correctCount = 0;
    let totalCount = 0;
    
    dropZones.forEach(zone => {
      const verb = zone.closest('.perfekt-row').dataset.verb;
      const correctAnswer = zone.dataset.correct;
      const userAnswer = perfektAnswers[verb];
      const droppedWord = zone.querySelector('.dropped-word');
      
      totalCount++;
      
      // Clear previous styling
      zone.classList.remove('correct', 'incorrect');
      if (droppedWord) {
        droppedWord.classList.remove('correct', 'incorrect');
      }
      
      if (userAnswer === correctAnswer) {
        correctCount++;
        zone.classList.add('correct');
        if (droppedWord) {
          droppedWord.classList.add('correct');
        }
      } else if (userAnswer) {
        zone.classList.add('incorrect');
        if (droppedWord) {
          droppedWord.classList.add('incorrect');
        }
      }
    });
    
    // Show feedback
    showFeedback(correctCount, totalCount);
  }

  function showFeedback(correct, total) {
    let message = '';
    let className = '';
    
    if (correct === total) {
      message = `Ausgezeichnet! Alle ${total} Antworten sind richtig! 🎉`;
      className = 'success';
    } else if (correct === 0) {
      message = `Alle Antworten sind falsch. Versuche es noch einmal! 📚`;
      className = 'error';
    } else {
      message = `${correct} von ${total} Antworten sind richtig. Versuche die anderen noch einmal! 💪`;
      className = 'partial';
    }
    
    perfektFeedback.textContent = message;
    perfektFeedback.className = `perfekt-feedback ${className}`;
  }

  function clearFeedback() {
    perfektFeedback.textContent = '';
    perfektFeedback.className = 'perfekt-feedback';
    
    // Clear all styling from drop zones and dropped words
    dropZones.forEach(zone => {
      zone.classList.remove('correct', 'incorrect');
      const droppedWord = zone.querySelector('.dropped-word');
      if (droppedWord) {
        droppedWord.classList.remove('correct', 'incorrect');
      }
    });
  }

  function resetExercise() {
    // Clear all answers
    perfektAnswers = {};
    
    // Remove all dropped words and restore placeholders
    dropZones.forEach(zone => {
      const droppedWord = zone.querySelector('.dropped-word');
      if (droppedWord) {
        droppedWord.remove();
      }
      
      zone.classList.remove('has-answer', 'correct', 'incorrect');
      
      const placeholder = zone.querySelector('.drop-placeholder');
      if (placeholder) {
        placeholder.style.display = 'inline';
      }
    });
    
    // Reset all draggable words
    draggableWords.forEach(word => {
      word.classList.remove('used');
      word.draggable = true;
    });
    
    // Clear feedback
    clearFeedback();
  }

  // Event listeners for controls
  if (checkPerfektAnswers) {
    checkPerfektAnswers.addEventListener('click', checkAnswers);
  }

  if (resetPerfektExercise) {
    resetPerfektExercise.addEventListener('click', resetExercise);
  }

  // Initialize drag and drop
  if (draggableWords.length > 0 && dropZones.length > 0) {
    initDragAndDrop();
  }

  // Frida Exercise Functionality
  const fridaPlayButton = document.getElementById('fridaPlayButton');
  const fridaAudio = document.getElementById('fridaAudio');
  const fridaImageContainer = document.getElementById('fridaImageContainer');
  const checkFridaOrder = document.getElementById('checkFridaOrder');
  const resetFridaOrder = document.getElementById('resetFridaOrder');
  const fridaFeedback = document.getElementById('fridaFeedback');

  // Frida exercise data and state
  const fridaImages = [
    { id: 1, src: 'img/Frida/01_kaffee.png', alt: 'Frida trinkt Kaffee', correctPosition: 1 },
    { id: 2, src: 'img/Frida/02_fahrrad.png', alt: 'Frida fährt Fahrrad', correctPosition: 2 },
    { id: 3, src: 'img/Frida/03_buero.png', alt: 'Frida arbeitet im Büro', correctPosition: 3 },
    { id: 4, src: 'img/Frida/04_suppe.png', alt: 'Frida isst Suppe', correctPosition: 4 },
    { id: 5, src: 'img/Frida/05_park.png', alt: 'Frida trifft Freund im Park', correctPosition: 5 },
    { id: 6, src: 'img/Frida/06_kochen.png', alt: 'Frida kocht zu Hause', correctPosition: 6 }
  ];

  let currentFridaOrder = [];
  let initialShuffledOrder = [];
  let fridaDraggedElement = null;
  let fridaProgressState = {
    completed: false,
    attempts: 0,
    usedHints: false
  };

  // Frida audio controls
  if (fridaPlayButton && fridaAudio) {
    fridaPlayButton.addEventListener('click', () => {
      if (fridaAudio.paused) {
        fridaAudio.play();
        fridaPlayButton.textContent = 'Audio pausieren';
      } else {
        fridaAudio.pause();
        fridaPlayButton.textContent = 'Audio abspielen';
      }
    });

    fridaAudio.addEventListener('play', () => {
      fridaPlayButton.textContent = 'Audio pausieren';
    });

    fridaAudio.addEventListener('pause', () => {
      fridaPlayButton.textContent = 'Audio abspielen';
    });

    fridaAudio.addEventListener('ended', () => {
      fridaPlayButton.textContent = 'Audio abspielen';
    });
  }


  // Shuffle array function
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Initialize Frida images
  function initializeFridaImages() {
    if (!fridaImageContainer) return;

    // Create shuffled order for initial display
    initialShuffledOrder = shuffleArray(fridaImages);
    currentFridaOrder = [...initialShuffledOrder];

    renderFridaImages();
    initializeFridaDragAndDrop();
  }

  // Render Frida images
  function renderFridaImages() {
    if (!fridaImageContainer) return;

    fridaImageContainer.innerHTML = '';

    currentFridaOrder.forEach((imageData, index) => {
      const card = document.createElement('div');
      card.className = 'frida-image-card';
      card.draggable = true;
      card.tabIndex = 0;
      card.dataset.imageId = imageData.id;
      card.dataset.currentPosition = index + 1;

      card.innerHTML = `
        <div class="frida-image-number">${index + 1}</div>
        <img src="${imageData.src}" alt="${imageData.alt}" class="frida-image" />
        <div class="frida-image-alt">${imageData.alt}</div>
      `;

      // Make cards positioned so numbers show
      card.classList.add('positioned');

      fridaImageContainer.appendChild(card);
    });
  }

  // Initialize drag and drop for Frida exercise
  function initializeFridaDragAndDrop() {
    const imageCards = fridaImageContainer.querySelectorAll('.frida-image-card');

    imageCards.forEach(card => {
      // Drag events
      card.addEventListener('dragstart', handleFridaDragStart);
      card.addEventListener('dragend', handleFridaDragEnd);
      card.addEventListener('dragover', handleFridaDragOver);
      card.addEventListener('dragenter', handleFridaDragEnter);
      card.addEventListener('dragleave', handleFridaDragLeave);
      card.addEventListener('drop', handleFridaDrop);

      // Keyboard navigation
      card.addEventListener('keydown', handleFridaKeyboard);
    });
  }

  function handleFridaDragStart(e) {
    fridaDraggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    
    // Enable drop zones
    fridaImageContainer.classList.add('drop-enabled');
  }

  function handleFridaDragEnd(e) {
    e.target.classList.remove('dragging');
    fridaDraggedElement = null;
    
    // Disable drop zones
    fridaImageContainer.classList.remove('drop-enabled');
    
    // Clear any residual drag-over styles
    const allCards = fridaImageContainer.querySelectorAll('.frida-image-card');
    allCards.forEach(card => card.classList.remove('drag-over'));
  }

  function handleFridaDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleFridaDragEnter(e) {
    e.preventDefault();
    if (e.target.closest('.frida-image-card') && e.target.closest('.frida-image-card') !== fridaDraggedElement) {
      e.target.closest('.frida-image-card').classList.add('drag-over');
    }
  }

  function handleFridaDragLeave(e) {
    if (e.target.closest('.frida-image-card')) {
      e.target.closest('.frida-image-card').classList.remove('drag-over');
    }
  }

  function handleFridaDrop(e) {
    e.preventDefault();
    
    const dropTarget = e.target.closest('.frida-image-card');
    if (!dropTarget || dropTarget === fridaDraggedElement) return;

    dropTarget.classList.remove('drag-over');

    // Get positions
    const draggedIndex = Array.from(fridaImageContainer.children).indexOf(fridaDraggedElement);
    const targetIndex = Array.from(fridaImageContainer.children).indexOf(dropTarget);

    // Swap in current order array
    [currentFridaOrder[draggedIndex], currentFridaOrder[targetIndex]] = 
    [currentFridaOrder[targetIndex], currentFridaOrder[draggedIndex]];

    // Re-render
    renderFridaImages();
    initializeFridaDragAndDrop();

    // Clear feedback
    clearFridaFeedback();
  }

  // Keyboard navigation for accessibility
  function handleFridaKeyboard(e) {
    const cards = Array.from(fridaImageContainer.querySelectorAll('.frida-image-card'));
    const currentIndex = cards.indexOf(e.target);

    switch(e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          cards[currentIndex - 1].focus();
        }
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < cards.length - 1) {
          cards[currentIndex + 1].focus();
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        // Simple swap with next element for keyboard users
        if (currentIndex < cards.length - 1) {
          [currentFridaOrder[currentIndex], currentFridaOrder[currentIndex + 1]] = 
          [currentFridaOrder[currentIndex + 1], currentFridaOrder[currentIndex]];
          renderFridaImages();
          initializeFridaDragAndDrop();
          // Focus on the moved element
          setTimeout(() => {
            const newCards = fridaImageContainer.querySelectorAll('.frida-image-card');
            if (newCards[currentIndex + 1]) {
              newCards[currentIndex + 1].focus();
            }
          }, 100);
          clearFridaFeedback();
        }
        break;
    }
  }

  // Check Frida order
  function validateFridaOrder() {
    fridaProgressState.attempts++;
    
    let correctCount = 0;
    const totalCount = currentFridaOrder.length;
    
    // Clear previous styling
    const cards = fridaImageContainer.querySelectorAll('.frida-image-card');
    cards.forEach(card => {
      card.classList.remove('correct', 'incorrect');
    });

    // Check each position
    currentFridaOrder.forEach((imageData, index) => {
      const card = cards[index];
      const currentPosition = index + 1;
      
      if (imageData.correctPosition === currentPosition) {
        correctCount++;
        card.classList.add('correct');
      } else {
        card.classList.add('incorrect');
      }
    });

    // Show feedback
    showFridaFeedback(correctCount, totalCount);

    // Check if completed
    if (correctCount === totalCount) {
      fridaProgressState.completed = true;
      // Emit completion event
      emitFridaExerciseEvent('order_solved', {
        attempts: fridaProgressState.attempts,
        usedHints: fridaProgressState.usedHints
      });
    }
  }

  // Show feedback
  function showFridaFeedback(correct, total) {
    let message = '';
    let className = '';
    
    if (correct === total) {
      message = `Ausgezeichnet! Alle ${total} Bilder sind in der richtigen Reihenfolge! 🎉`;
      className = 'success';
    } else if (correct === 0) {
      message = `Fast! Höre noch einmal und versuche es erneut. 📚`;
      className = 'error';
    } else {
      message = `${correct} von ${total} Bildern sind richtig platziert. Fast! Höre noch einmal und versuche es erneut. 💪`;
      className = 'partial';
    }
    
    fridaFeedback.textContent = message;
    fridaFeedback.className = `frida-feedback ${className}`;

    // Emit check event
    emitFridaExerciseEvent('order_checked', {
      correct: correct,
      total: total,
      attempts: fridaProgressState.attempts
    });
  }

  // Clear feedback
  function clearFridaFeedback() {
    if (fridaFeedback) {
      fridaFeedback.textContent = '';
      fridaFeedback.className = 'frida-feedback';
    }
    
    // Clear styling from cards
    const cards = fridaImageContainer.querySelectorAll('.frida-image-card');
    cards.forEach(card => {
      card.classList.remove('correct', 'incorrect');
    });
  }

  // Reset Frida exercise
  function resetFridaExercise() {
    // Reset to initial shuffled order
    currentFridaOrder = [...initialShuffledOrder];
    renderFridaImages();
    initializeFridaDragAndDrop();
    clearFridaFeedback();

    // Emit reset event
    emitFridaExerciseEvent('exercise_reset', {
      attempts: fridaProgressState.attempts
    });
  }

  // Event emission for progress tracking
  function emitFridaExerciseEvent(eventType, data = {}) {
    const event = new CustomEvent('fridaExerciseEvent', {
      detail: {
        type: eventType,
        exerciseId: 'A2.1-U1-Listen-Order-Frida',
        timestamp: new Date().toISOString(),
        ...data
      }
    });
    document.dispatchEvent(event);
  }

  // Initialize exercise
  function initializeFridaExercise() {
    if (!fridaImageContainer) return;

    // Initialize images
    initializeFridaImages();

    // Emit viewed event
    emitFridaExerciseEvent('exercise_viewed');

    // Event listeners for controls
    if (checkFridaOrder) {
      checkFridaOrder.addEventListener('click', () => validateFridaOrder());
    }

    if (resetFridaOrder) {
      resetFridaOrder.addEventListener('click', resetFridaExercise);
    }

    // Audio play event tracking
    if (fridaAudio) {
      fridaAudio.addEventListener('play', () => {
        emitFridaExerciseEvent('audio_played');
      });
    }
  }

  // Extension to translation system to include Frida exercise elements
  function getFridaTranslatableElements() {
    const elements = [];
    
    // Frida exercise title
    const fridaTitle = document.querySelector('#frida-title');
    if (fridaTitle) elements.push({ element: fridaTitle, text: fridaTitle.textContent.trim() });

    // Frida instruction text
    const fridaInstructionText = document.querySelector('.frida-instruction-text');
    if (fridaInstructionText) elements.push({ element: fridaInstructionText, text: fridaInstructionText.textContent.trim() });

    // Image board title
    const imageBoardTitle = document.querySelector('.image-board-title');
    if (imageBoardTitle) elements.push({ element: imageBoardTitle, text: imageBoardTitle.textContent.trim() });

    return elements;
  }

  // Update the existing getTranslatableElements function
  const originalGetTranslatableElements = window.getTranslatableElements || getTranslatableElements;
  
  window.getTranslatableElements = function() {
    const originalElements = originalGetTranslatableElements ? originalGetTranslatableElements() : [];
    const fridaElements = getFridaTranslatableElements();
    return [...originalElements, ...fridaElements];
  };

  // Initialize Frida exercise when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFridaExercise);
  } else {
    initializeFridaExercise();
  }

  // Step Navigation Functionality
  const stepNavigation = {
    currentStep: 1,
    totalSteps: 4,
    steps: [],
    prevBtn: null,
    nextBtn: null,
    progressFill: null,
    currentStepEl: null,

    init() {
      // Get all step elements
      this.steps = Array.from(document.querySelectorAll('.lesson-step'));
      this.prevBtn = document.getElementById('prevBtn');
      this.nextBtn = document.getElementById('nextBtn');
      this.progressFill = document.getElementById('progressFill');
      this.currentStepEl = document.getElementById('currentStep');

      if (!this.steps.length || !this.prevBtn || !this.nextBtn) {
        console.warn('Step navigation elements not found');
        return;
      }

      // Set up event listeners
      this.prevBtn.addEventListener('click', () => this.goToPreviousStep());
      this.nextBtn.addEventListener('click', () => this.goToNextStep());

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        
        if (e.key === 'ArrowLeft' && !this.prevBtn.disabled) {
          e.preventDefault();
          this.goToPreviousStep();
        } else if (e.key === 'ArrowRight' && !this.nextBtn.disabled) {
          e.preventDefault();
          this.goToNextStep();
        }
      });

      // Initialize first step
      this.updateStepDisplay();
      this.updateNavigationButtons();
      this.updateProgress();

      // Update translation elements to include navigation
      if (window.getTranslatableElements) {
        const originalGetTranslatableElements = window.getTranslatableElements;
        window.getTranslatableElements = () => {
          const originalElements = originalGetTranslatableElements();
          const navElements = this.getNavigationTranslatableElements();
          return [...originalElements, ...navElements];
        };
      }
    },

    getNavigationTranslatableElements() {
      const elements = [];
      
      if (this.prevBtn) {
        elements.push({ element: this.prevBtn, text: this.prevBtn.textContent.trim() });
      }
      
      if (this.nextBtn) {
        elements.push({ element: this.nextBtn, text: this.nextBtn.textContent.trim() });
      }

      return elements;
    },

    goToNextStep() {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.updateStepDisplay();
        this.updateNavigationButtons();
        this.updateProgress();
        this.scrollToTop();
        this.emitStepChangeEvent('next');
      }
    },

    goToPreviousStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
        this.updateStepDisplay();
        this.updateNavigationButtons();
        this.updateProgress();
        this.scrollToTop();
        this.emitStepChangeEvent('previous');
      }
    },

    goToStep(stepNumber) {
      if (stepNumber >= 1 && stepNumber <= this.totalSteps && stepNumber !== this.currentStep) {
        const previousStep = this.currentStep;
        this.currentStep = stepNumber;
        this.updateStepDisplay();
        this.updateNavigationButtons();
        this.updateProgress();
        this.scrollToTop();
        this.emitStepChangeEvent('direct', { from: previousStep, to: stepNumber });
      }
    },

    updateStepDisplay() {
      this.steps.forEach((step, index) => {
        const stepNumber = index + 1;
        if (stepNumber === this.currentStep) {
          step.style.display = 'block';
          step.setAttribute('aria-hidden', 'false');
          
          // Trigger fade-in animation
          step.style.animation = 'none';
          requestAnimationFrame(() => {
            step.style.animation = 'fadeIn 0.4s ease';
          });
        } else {
          step.style.display = 'none';
          step.setAttribute('aria-hidden', 'true');
        }
      });

      // Update current step indicator
      if (this.currentStepEl) {
        this.currentStepEl.textContent = this.currentStep;
      }
    },

    updateNavigationButtons() {
      // Update previous button
      if (this.prevBtn) {
        this.prevBtn.disabled = this.currentStep === 1;
        this.prevBtn.style.visibility = this.currentStep === 1 ? 'hidden' : 'visible';
      }

      // Update next button
      if (this.nextBtn) {
        this.nextBtn.disabled = this.currentStep === this.totalSteps;
        if (this.currentStep === this.totalSteps) {
          this.nextBtn.textContent = 'Abgeschlossen ✓';
          this.nextBtn.classList.add('btn--accent');
          this.nextBtn.classList.remove('btn--primary');
        } else {
          this.nextBtn.textContent = 'Weiter →';
          this.nextBtn.classList.add('btn--primary');
          this.nextBtn.classList.remove('btn--accent');
        }
      }
    },

    updateProgress() {
      if (this.progressFill) {
        const progressPercentage = (this.currentStep / this.totalSteps) * 100;
        this.progressFill.style.width = `${progressPercentage}%`;
        this.progressFill.setAttribute('data-step', this.currentStep);
      }
    },

    scrollToTop() {
      // Smooth scroll to top of lesson
      const lesson = document.querySelector('.lesson');
      if (lesson) {
        lesson.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },

    emitStepChangeEvent(action, data = {}) {
      const event = new CustomEvent('stepChanged', {
        detail: {
          action,
          currentStep: this.currentStep,
          totalSteps: this.totalSteps,
          timestamp: new Date().toISOString(),
          ...data
        }
      });
      document.dispatchEvent(event);
    },

    // Public methods for external control
    getCurrentStep() {
      return this.currentStep;
    },

    getTotalSteps() {
      return this.totalSteps;
    },

    isFirstStep() {
      return this.currentStep === 1;
    },

    isLastStep() {
      return this.currentStep === this.totalSteps;
    }
  };

  // Initialize step navigation when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => stepNavigation.init());
  } else {
    stepNavigation.init();
  }

  // Expose step navigation to global scope for external access
  window.stepNavigation = stepNavigation;

  // Enhanced translation system for step navigation
  function updateStepTranslations() {
    // Update navigation button translations when language changes
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
      const originalChangeHandler = languageSelect.onchange;
      languageSelect.addEventListener('change', (e) => {
        // Call original handler first
        if (originalChangeHandler) {
          originalChangeHandler.call(languageSelect, e);
        }
        
        // Then update step navigation translations
        setTimeout(() => {
          if (window.TRANSLATIONS && e.target.value) {
            const lang = e.target.value;
            
            // Update navigation buttons
            if (stepNavigation.prevBtn && window.TRANSLATIONS['← Zurück']) {
              const translation = window.TRANSLATIONS['← Zurück'][lang];
              if (translation) {
                stepNavigation.prevBtn.textContent = translation;
              }
            }
            
            if (stepNavigation.nextBtn && !stepNavigation.isLastStep() && window.TRANSLATIONS['Weiter →']) {
              const translation = window.TRANSLATIONS['Weiter →'][lang];
              if (translation) {
                stepNavigation.nextBtn.textContent = translation;
              }
            }
          }
        }, 100);
      });
    }
  }

  // Initialize enhanced translations
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateStepTranslations);
  } else {
    updateStepTranslations();
  }

  // Step progress tracking for analytics
  function trackStepProgress() {
    document.addEventListener('stepChanged', (e) => {
      const { detail } = e;
      console.log(`Step navigation: ${detail.action} to step ${detail.currentStep}/${detail.totalSteps}`);
      
      // You can add analytics tracking here
      // Example: gtag('event', 'step_navigation', { step: detail.currentStep });
    });
  }

  trackStepProgress();

})();
