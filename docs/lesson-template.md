# Lesson Template Guide

## Overview

This guide provides templates and examples for creating new lessons in the German language learning app. Follow these templates to ensure consistency across all lessons.

## Directory Structure Template

When creating a new unit, use this structure:

```
app/frontend/A2.1/Unit[N]/
├── audio/
│   ├── LA2.1.[N].1.mp3        # Exercise 1 audio
│   ├── LA2.1.[N].2.mp3        # Exercise 2 audio
│   └── pronunciation.mp3       # Optional pronunciation guide
├── img/
│   ├── main-scene.png         # Main lesson image
│   ├── vocabulary/            # Vocabulary-related images
│   │   ├── word1.png
│   │   └── word2.png
│   └── [Character]/           # Character-specific images
│       ├── 01_action.png
│       └── 02_reaction.png
├── dialogs/
│   ├── dialog1.md            # Main dialog
│   └── dialog2.md            # Secondary dialog (if needed)
├── LA2.1.[N].html            # Main lesson file
├── lesson.css               # Unit-specific styles
├── lesson.js                # Unit functionality
└── translations.js          # Translation data
```

## HTML Template

Create `LA2.1.[N].html` using this template:

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Lesson Title] - Unit [N]</title>
    <link rel="stylesheet" href="../styles.css">
    <link rel="stylesheet" href="lesson.css">
</head>
<body>
    <!-- Burger Menu for Translation System -->
    <button id="burgerMenuBtn" class="burger-menu-btn" aria-label="Open translation menu">
        <span class="burger-line"></span>
        <span class="burger-line"></span>
        <span class="burger-line"></span>
    </button>

    <!-- Translation Panel -->
    <div id="translationPanel" class="translation-panel">
        <div class="translation-panel__content">
            <button id="closePanelBtn" class="close-panel-btn" aria-label="Close translation menu">×</button>
            <h3>Translation Settings</h3>
            <label for="languageSelect">Show translation below the original text:</label>
            <select id="languageSelect" class="language-select">
                <option value="">No</option>
                <option value="en">English 🇬🇧</option>
                <option value="pl">Polski 🇵🇱</option>
                <option value="ru">Русский 🇷🇺</option>
                <option value="fr">Français 🇫🇷</option>
                <option value="it">Italiano 🇮🇹</option>
                <option value="nl">Nederlands 🇳🇱</option>
                <option value="es">Español 🇪🇸</option>
                <option value="tr">Türkçe 🇹🇷</option>
                <option value="ar">العربية 🌍</option>
                <option value="zh">中文 🇨🇳</option>
                <option value="pt">Português 🇧🇷</option>
            </select>
        </div>
    </div>

    <!-- Menu Overlay -->
    <div id="menuOverlay" class="menu-overlay"></div>

    <!-- Main Content -->
    <div class="lesson-container">
        <!-- Header -->
        <header class="lesson__header">
            <h1 class="lesson__title">[Lesson Title in German]</h1>
            <p class="lesson__subtitle">[Lesson Subtitle/Description]</p>
        </header>

        <!-- Main Scene Image -->
        <section class="lesson__scene">
            <img src="img/main-scene.png" alt="[Description of scene]" class="scene__image">
        </section>

        <!-- Dialogue Section -->
        <section class="lesson__dialogue">
            <h2 class="section__title">Dialog</h2>
            <div class="dialogue">
                <div class="dialogue__controls">
                    <button id="playDialogBtn" class="audio-btn" aria-label="Play dialog">
                        ▶️ Dialog anhören
                    </button>
                </div>
                <div class="dialogue__content">
                    <p class="dialogue__line">
                        <span class="speaker">Person A:</span>
                        <span class="text">[German dialog line 1]</span>
                    </p>
                    <p class="dialogue__line">
                        <span class="speaker">Person B:</span>
                        <span class="text">[German dialog line 2]</span>
                    </p>
                    <!-- Add more dialogue lines as needed -->
                </div>
            </div>
        </section>

        <!-- Vocabulary Section -->
        <section class="lesson__vocabulary">
            <h2 class="section__title">Wortschatz</h2>
            <div class="vocabulary__grid">
                <div class="vocabulary__item">
                    <img src="img/vocabulary/word1.png" alt="[Word 1]" class="vocabulary__image">
                    <p class="vocabulary__word">[German Word 1]</p>
                </div>
                <div class="vocabulary__item">
                    <img src="img/vocabulary/word2.png" alt="[Word 2]" class="vocabulary__image">
                    <p class="vocabulary__word">[German Word 2]</p>
                </div>
                <!-- Add more vocabulary items -->
            </div>
        </section>

        <!-- Quiz Section -->
        <section class="lesson__quiz">
            <h2 class="section__title">Übung</h2>
            
            <!-- Multiple Choice Question -->
            <div class="quiz__question" data-question="1">
                <p class="quiz__prompt">[Quiz question in German]</p>
                <div class="quiz__options">
                    <label class="quiz__option">
                        <input type="radio" name="q1" value="a">
                        <span class="option__text">[Option A]</span>
                    </label>
                    <label class="quiz__option">
                        <input type="radio" name="q1" value="b">
                        <span class="option__text">[Option B]</span>
                    </label>
                    <label class="quiz__option">
                        <input type="radio" name="q1" value="c">
                        <span class="option__text">[Option C]</span>
                    </label>
                </div>
                <button class="quiz__check-btn" data-answer="a">Antwort prüfen</button>
                <div class="quiz__feedback"></div>
            </div>
        </section>

        <!-- Speaking Exercise -->
        <section class="lesson__speaking">
            <h2 class="section__title">Sprechen</h2>
            <div class="speaking__exercise">
                <p class="speaking__question-text">[Speaking prompt in German]</p>
                <button id="recordBtn" class="record-btn">🎤 Aufnehmen</button>
                <div class="speaking__feedback"></div>
            </div>
        </section>

        <!-- Navigation -->
        <nav class="lesson__navigation">
            <a href="../index.html" class="nav-btn nav-btn--back">← Zurück zur Übersicht</a>
            <a href="../Unit[N+1]/LA2.1.[N+1].html" class="nav-btn nav-btn--next">Nächste Lektion →</a>
        </nav>
    </div>

    <!-- Scripts -->
    <script src="translations.js"></script>
    <script src="lesson.js"></script>
</body>
</html>
```

## CSS Template

Create `lesson.css` using this template:

```css
/* ==========================================================================
   Unit [N] Specific Styles
   ========================================================================== */

/* Scene Section */
.lesson__scene {
    margin: 2rem 0;
    text-align: center;
}

.scene__image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Dialogue Section */
.dialogue {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1rem 0;
}

.dialogue__controls {
    margin-bottom: 1rem;
}

.audio-btn {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s ease;
}

.audio-btn:hover {
    background: var(--primary-color-dark);
}

.dialogue__line {
    margin: 0.75rem 0;
    padding: 0.5rem;
    border-left: 3px solid var(--accent-color);
    padding-left: 1rem;
}

.speaker {
    font-weight: bold;
    color: var(--primary-color);
    display: inline-block;
    min-width: 80px;
}

.text {
    color: var(--text-color);
    line-height: 1.6;
}

/* Vocabulary Section */
.vocabulary__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
}

.vocabulary__item {
    text-align: center;
    padding: 1rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.vocabulary__item:hover {
    transform: translateY(-4px);
}

.vocabulary__image {
    width: 100%;
    max-width: 150px;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 0.75rem;
}

.vocabulary__word {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
}

/* Quiz Section */
.quiz__question {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin: 1.5rem 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quiz__prompt {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: var(--text-color);
}

.quiz__options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.quiz__option {
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.quiz__option:hover {
    border-color: var(--primary-color);
    background: #f8f9fa;
}

.quiz__option input[type="radio"] {
    margin-right: 1rem;
    transform: scale(1.2);
}

.option__text {
    font-size: 1rem;
    color: var(--text-color);
}

.quiz__check-btn {
    background: var(--success-color);
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s ease;
}

.quiz__check-btn:hover {
    background: var(--success-color-dark);
}

.quiz__feedback {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 8px;
    font-weight: 600;
}

.quiz__feedback.correct {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.quiz__feedback.incorrect {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

/* Speaking Section */
.speaking__exercise {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.speaking__question-text {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    color: var(--text-color);
}

.record-btn {
    background: var(--accent-color);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 50px;
    cursor: pointer;
    font-size: 1.1rem;
    transition: all 0.3s ease;
}

.record-btn:hover {
    background: var(--accent-color-dark);
    transform: scale(1.05);
}

.record-btn.recording {
    background: #dc3545;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

/* Navigation */
.lesson__navigation {
    display: flex;
    justify-content: space-between;
    margin: 3rem 0 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e9ecef;
}

.nav-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
}

.nav-btn--back {
    background: #6c757d;
    color: white;
}

.nav-btn--next {
    background: var(--primary-color);
    color: white;
}

.nav-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Responsive Design */
@media (max-width: 768px) {
    .vocabulary__grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
    }
    
    .lesson__navigation {
        flex-direction: column;
        gap: 1rem;
    }
    
    .quiz__options {
        gap: 0.75rem;
    }
    
    .quiz__option {
        padding: 0.75rem;
    }
}

/* Unit-specific customizations go below this line */
/* ================================================ */

/* Example: Custom colors for this unit's theme */
:root {
    --unit-primary: #4a90e2;    /* Customize for unit theme */
    --unit-accent: #f39c12;     /* Customize for unit theme */
}

/* Example: Special styling for this unit's content */
.special-unit-element {
    /* Add unit-specific styles here */
}
```

## JavaScript Template

Create `lesson.js` using this template:

```javascript
/**
 * Unit [N] - [Lesson Title]
 * Interactive lesson functionality with translation system integration
 */

// =============================================================================
// Configuration and Constants
// =============================================================================

const LESSON_CONFIG = {
    unitNumber: [N],
    lessonTitle: '[Lesson Title]',
    audioFiles: {
        dialog: 'audio/LA2.1.[N].1.mp3',
        pronunciation: 'audio/pronunciation.mp3'
    },
    correctAnswers: {
        q1: 'a',  // Update with correct answers
        q2: 'b'
    }
};

// =============================================================================
// State Management
// =============================================================================

let lessonState = {
    currentAudio: null,
    isRecording: false,
    completedQuestions: new Set(),
    selectedLanguage: localStorage.getItem('selectedLanguage') || ''
};

// =============================================================================
// Audio Management
// =============================================================================

/**
 * Plays audio file with error handling
 * @param {string} audioPath - Path to audio file
 * @param {Function} onComplete - Callback when audio finishes
 */
const playAudio = async (audioPath, onComplete = null) => {
    try {
        // Stop current audio if playing
        if (lessonState.currentAudio) {
            lessonState.currentAudio.pause();
            lessonState.currentAudio.currentTime = 0;
        }

        const audio = new Audio(audioPath);
        lessonState.currentAudio = audio;

        // Set up event listeners
        audio.addEventListener('ended', () => {
            if (onComplete) onComplete();
            lessonState.currentAudio = null;
        });

        audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            showFeedback('Audio konnte nicht geladen werden.', 'error');
        });

        await audio.play();
        
    } catch (error) {
        console.error('Failed to play audio:', error);
        showFeedback('Audio-Wiedergabe fehlgeschlagen.', 'error');
    }
};

/**
 * Stops current audio playback
 */
const stopAudio = () => {
    if (lessonState.currentAudio) {
        lessonState.currentAudio.pause();
        lessonState.currentAudio.currentTime = 0;
        lessonState.currentAudio = null;
    }
};

// =============================================================================
// Quiz Functionality
// =============================================================================

/**
 * Checks quiz answer and provides feedback
 * @param {number} questionNumber - Question number
 * @param {string} selectedAnswer - Selected answer value
 * @param {string} correctAnswer - Correct answer value
 */
const checkQuizAnswer = (questionNumber, selectedAnswer, correctAnswer) => {
    const questionElement = document.querySelector(`[data-question="${questionNumber}"]`);
    const feedbackElement = questionElement.querySelector('.quiz__feedback');
    const checkButton = questionElement.querySelector('.quiz__check-btn');

    if (selectedAnswer === correctAnswer) {
        feedbackElement.textContent = 'Richtig! Gut gemacht!';
        feedbackElement.className = 'quiz__feedback correct';
        lessonState.completedQuestions.add(questionNumber);
        checkButton.disabled = true;
        checkButton.textContent = 'Beantwortet ✓';
    } else {
        feedbackElement.textContent = 'Nicht ganz richtig. Versuche es nochmal!';
        feedbackElement.className = 'quiz__feedback incorrect';
    }
};

/**
 * Initializes quiz functionality
 */
const initializeQuiz = () => {
    const checkButtons = document.querySelectorAll('.quiz__check-btn');
    
    checkButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const questionElement = e.target.closest('.quiz__question');
            const questionNumber = parseInt(questionElement.dataset.question);
            const selectedOption = questionElement.querySelector('input[type="radio"]:checked');
            
            if (!selectedOption) {
                showFeedback('Bitte wähle eine Antwort aus.', 'warning');
                return;
            }
            
            const selectedAnswer = selectedOption.value;
            const correctAnswer = button.dataset.answer;
            
            checkQuizAnswer(questionNumber, selectedAnswer, correctAnswer);
        });
    });
};

// =============================================================================
// Speaking Exercise
// =============================================================================

/**
 * Initializes speaking exercise functionality
 */
const initializeSpeaking = () => {
    const recordBtn = document.getElementById('recordBtn');
    
    if (recordBtn) {
        recordBtn.addEventListener('click', toggleRecording);
    }
};

/**
 * Toggles recording state
 */
const toggleRecording = () => {
    const recordBtn = document.getElementById('recordBtn');
    
    if (!lessonState.isRecording) {
        startRecording();
        recordBtn.textContent = '⏹️ Stoppen';
        recordBtn.classList.add('recording');
    } else {
        stopRecording();
        recordBtn.textContent = '🎤 Aufnehmen';
        recordBtn.classList.remove('recording');
    }
    
    lessonState.isRecording = !lessonState.isRecording;
};

/**
 * Starts recording (placeholder implementation)
 */
const startRecording = () => {
    console.log('Recording started...');
    // TODO: Implement actual recording functionality
    showFeedback('Aufnahme gestartet...', 'info');
};

/**
 * Stops recording (placeholder implementation)
 */
const stopRecording = () => {
    console.log('Recording stopped...');
    // TODO: Implement actual recording functionality
    showFeedback('Aufnahme beendet. Gut gemacht!', 'success');
};

// =============================================================================
// Translation System Integration
// =============================================================================

/**
 * Gets all translatable elements in the lesson
 * @returns {Array} Array of elements with their text content
 */
const getTranslatableElements = () => {
    const elements = [];
    
    // Title and subtitle
    const title = document.querySelector('.lesson__title');
    const subtitle = document.querySelector('.lesson__subtitle');
    
    if (title) {
        elements.push({ element: title, text: title.textContent.trim() });
    }
    if (subtitle) {
        elements.push({ element: subtitle, text: subtitle.textContent.trim() });
    }
    
    // Section titles
    const sectionTitles = document.querySelectorAll('.section__title');
    sectionTitles.forEach(title => {
        elements.push({ element: title, text: title.textContent.trim() });
    });
    
    // Dialogue text
    const dialogueText = document.querySelectorAll('.dialogue .text');
    dialogueText.forEach(text => {
        elements.push({ element: text, text: text.textContent.trim() });
    });
    
    // Quiz prompts
    const quizPrompts = document.querySelectorAll('.quiz__prompt');
    quizPrompts.forEach(prompt => {
        elements.push({ element: prompt, text: prompt.textContent.trim() });
    });
    
    // Quiz options
    const quizOptions = document.querySelectorAll('.option__text');
    quizOptions.forEach(option => {
        elements.push({ element: option, text: option.textContent.trim() });
    });
    
    // Speaking questions
    const speakingQuestions = document.querySelectorAll('.speaking__question-text');
    speakingQuestions.forEach(question => {
        elements.push({ element: question, text: question.textContent.trim() });
    });
    
    // Vocabulary words
    const vocabularyWords = document.querySelectorAll('.vocabulary__word');
    vocabularyWords.forEach(word => {
        elements.push({ element: word, text: word.textContent.trim() });
    });
    
    return elements;
};

/**
 * Shows translations for selected language
 * @param {string} language - Language code
 */
const showTranslations = (language) => {
    if (!language || !window.TRANSLATIONS) return;
    
    // Remove existing translations
    document.querySelectorAll('.translation').forEach(el => el.remove());
    
    const elements = getTranslatableElements();
    
    elements.forEach(({ element, text }) => {
        const translation = window.TRANSLATIONS[text];
        if (translation && translation[language]) {
            const translationElement = document.createElement('div');
            translationElement.className = 'translation';
            translationElement.textContent = translation[language];
            element.appendChild(translationElement);
        }
    });
};

/**
 * Hides all translations
 */
const hideTranslations = () => {
    document.querySelectorAll('.translation').forEach(el => el.remove());
};

/**
 * Initializes translation system
 */
const initializeTranslations = () => {
    const languageSelect = document.getElementById('languageSelect');
    const savedLanguage = localStorage.getItem('selectedLanguage');
    
    if (languageSelect) {
        // Set saved language
        if (savedLanguage) {
            languageSelect.value = savedLanguage;
            showTranslations(savedLanguage);
        }
        
        // Handle language changes
        languageSelect.addEventListener('change', (e) => {
            const selectedLanguage = e.target.value;
            localStorage.setItem('selectedLanguage', selectedLanguage);
            lessonState.selectedLanguage = selectedLanguage;
            
            if (selectedLanguage) {
                showTranslations(selectedLanguage);
            } else {
                hideTranslations();
            }
        });
    }
};

// =============================================================================
// Burger Menu Integration
// =============================================================================

/**
 * Initializes burger menu functionality
 */
const initializeBurgerMenu = () => {
    const burgerBtn = document.getElementById('burgerMenuBtn');
    const translationPanel = document.getElementById('translationPanel');
    const menuOverlay = document.getElementById('menuOverlay');
    const closePanelBtn = document.getElementById('closePanelBtn');
    
    if (burgerBtn && translationPanel && menuOverlay) {
        // Open menu
        burgerBtn.addEventListener('click', () => {
            translationPanel.classList.add('active');
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        // Close menu
        const closeMenu = () => {
            translationPanel.classList.remove('active');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        };
        
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', closeMenu);
        }
        
        menuOverlay.addEventListener('click', closeMenu);
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && translationPanel.classList.contains('active')) {
                closeMenu();
            }
        });
    }
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Shows user feedback message
 * @param {string} message - Message to display
 * @param {string} type - Type of message (success, error, warning, info)
 */
const showFeedback = (message, type = 'info') => {
    // Create or update feedback element
    let feedbackEl = document.getElementById('global-feedback');
    if (!feedbackEl) {
        feedbackEl = document.createElement('div');
        feedbackEl.id = 'global-feedback';
        feedbackEl.className = 'global-feedback';
        document.body.appendChild(feedbackEl);
    }
    
    feedbackEl.textContent = message;
    feedbackEl.className = `global-feedback ${type}`;
    feedbackEl.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        feedbackEl.style.display = 'none';
    }, 3000);
};

/**
 * Logs lesson progress
 * @param {string} action - Action performed
 * @param {Object} data - Additional data
 */
const logProgress = (action, data = {}) => {
    const progressData = {
        timestamp: new Date().toISOString(),
        unit: LESSON_CONFIG.unitNumber,
        lesson: LESSON_CONFIG.lessonTitle,
        action,
        ...data
    };
    
    console.log('Lesson Progress:', progressData);
    
    // TODO: Send to analytics or learning management system
};

// =============================================================================
// Event Handlers
// =============================================================================

/**
 * Handles dialog audio playback
 */
const handleDialogAudio = () => {
    const playDialogBtn = document.getElementById('playDialogBtn');
    
    if (playDialogBtn) {
        playDialogBtn.addEventListener('click', () => {
            playAudio(LESSON_CONFIG.audioFiles.dialog, () => {
                logProgress('dialog_completed');
            });
        });
    }
};

/**
 * Handles vocabulary interactions
 */
const handleVocabulary = () => {
    const vocabularyItems = document.querySelectorAll('.vocabulary__item');
    
    vocabularyItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            const word = item.querySelector('.vocabulary__word')?.textContent;
            if (word) {
                logProgress('vocabulary_clicked', { word, index });
                // TODO: Play pronunciation or show additional info
            }
        });
    });
};

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initializes the lesson when DOM is loaded
 */
const initializeLesson = () => {
    console.log(`Initializing Unit ${LESSON_CONFIG.unitNumber}: ${LESSON_CONFIG.lessonTitle}`);
    
    try {
        // Initialize all components
        initializeBurgerMenu();
        initializeTranslations();
        initializeQuiz();
        initializeSpeaking();
        handleDialogAudio();
        handleVocabulary();
        
        // Log lesson start
        logProgress('lesson_started');
        
        console.log('Lesson initialization completed successfully');
        
    } catch (error) {
        console.error('Error initializing lesson:', error);
        showFeedback('Fehler beim Laden der Lektion.', 'error');
    }
};

// =============================================================================
// DOM Ready
// =============================================================================

// Initialize when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLesson);
} else {
    initializeLesson();
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    stopAudio();
    logProgress('lesson_exited');
});
```

## Translations Template

Create `translations.js` using this template:

```javascript
/**
 * Translation data for Unit [N] - [Lesson Title]
 * All user-facing text with translations in 12 supported languages
 */

window.TRANSLATIONS = {
    // =========================================================================
    // Lesson Header
    // =========================================================================
    
    "[Lesson Title in German]": {
        en: "[English translation]",
        pl: "[Polish translation]",
        ru: "[Russian translation]",
        fr: "[French translation]",
        it: "[Italian translation]",
        nl: "[Dutch translation]",
        es: "[Spanish translation]",
        tr: "[Turkish translation]",
        ar: "[Arabic translation]",
        zh: "[Chinese translation]",
        pt: "[Portuguese translation]"
    },

    "[Lesson Subtitle/Description]": {
        en: "[English translation]",
        pl: "[Polish translation]",
        ru: "[Russian translation]",
        fr: "[French translation]",
        it: "[Italian translation]",
        nl: "[Dutch translation]",
        es: "[Spanish translation]",
        tr: "[Turkish translation]",
        ar: "[Arabic translation]",
        zh: "[Chinese translation]",
        pt: "[Portuguese translation]"
    },

    // =========================================================================
    // Section Titles
    // =========================================================================
    
    "Dialog": {
        en: "Dialog",
        pl: "Dialog",
        ru: "Диалог",
        fr: "Dialogue",
        it: "Dialogo",
        nl: "Dialoog",
        es: "Diálogo",
        tr: "Diyalog",
        ar: "حوار",
        zh: "对话",
        pt: "Diálogo"
    },

    "Wortschatz": {
        en: "Vocabulary",
        pl: "Słownictwo",
        ru: "Словарь",
        fr: "Vocabulaire",
        it: "Vocabolario",
        nl: "Woordenschat",
        es: "Vocabulario",
        tr: "Kelime Bilgisi",
        ar: "المفردات",
        zh: "词汇",
        pt: "Vocabulário"
    },

    "Übung": {
        en: "Exercise",
        pl: "Ćwiczenie",
        ru: "Упражнение",
        fr: "Exercice",
        it: "Esercizio",
        nl: "Oefening",
        es: "Ejercicio",
        tr: "Alıştırma",
        ar: "تمرين",
        zh: "练习",
        pt: "Exercício"
    },

    "Sprechen": {
        en: "Speaking",
        pl: "Mówienie",
        ru: "Говорение",
        fr: "Expression orale",
        it: "Parlare",
        nl: "Spreken",
        es: "Hablar",
        tr: "Konuşma",
        ar: "التحدث",
        zh: "口语",
        pt: "Falar"
    },

    // =========================================================================
    // Dialog Content
    // =========================================================================
    
    "[German dialog line 1]": {
        en: "[English translation]",
        pl: "[Polish translation]",
        ru: "[Russian translation]",
        fr: "[French translation]",
        it: "[Italian translation]",
        nl: "[Dutch translation]",
        es: "[Spanish translation]",
        tr: "[Turkish translation]",
        ar: "[Arabic translation]",
        zh: "[Chinese translation]",
        pt: "[Portuguese translation]"
    },

    "[German dialog line 2]": {
        en: "[English translation]",
        pl: "[Polish translation]",
        ru: "[Russian translation]",
        fr: "[French translation]",
        it: "[Italian translation]",
        nl: "[Dutch translation]",
        es: "[Spanish translation]",
        tr: "[Turkish translation]",
        ar: "[Arabic translation]",
        zh: "[Chinese translation]",
        pt: "[Portuguese translation]"
    },

    // =========================================================================
    // Vocabulary
    // =========================================================================
    
    "[German Word 1]": {
        en: "[English translation]",
        pl: "[Polish translation]",
        ru: "[Russian translation]",
        fr: "[French translation]",
        it: "[Italian translation]",
        nl: "[Dutch translation]",
        es: "[Spanish translation]",
        tr: "[Turkish translation]",
        ar: "[Arabic translation]",
        zh: "[Chinese translation]",
        pt: "[Portuguese translation]"
    },

    "[German Word 2]": {
        en: "[English translation]",
        pl: "[Polish translation]",
        ru: "[Russian translation]",
        fr: "[French translation]",
        it: "[Italian translation]",
        nl: "[Dutch translation]",
        es: "[Spanish translation]",
        tr: "[Turkish translation]",
        ar: "[Arabic translation]",
        zh: "[Chinese translation]",
        pt: "[Portuguese translation]"
    },

    // =========================================================================
    // Quiz Questions and Options
    // =========================================================================
    
    "[Quiz question in German]": {
        en: "[English translation]",
        pl: "[Polish translation]",
        ru: "[Russian translation]",
        fr: "[French translation]",
        it: "[Italian translation]",
        nl: "[Dutch translation]",
        es: "[Spanish translation]",
        tr: "[Turkish translation]",
        ar: "[Arabic translation]",
        zh: "[Chinese translation]",
        pt: "[Portuguese translation]"
    },

    "[Option A]": {
        en: "[English translation]",
        pl: "[Polish translation]",
        ru: "[Russian translation]",
        fr: "[French translation]",
        it: "[Italian translation]",
        nl: "[Dutch translation]",
        es: "[Spanish translation]",
        tr: "[Turkish translation]",
        ar: "[Arabic translation]",
        zh: "[Chinese translation]",
        pt: "[Portuguese translation]"
    },

    "[Option B]": {
        en: "[English translation]",
        pl: "[Polish translation]",
        ru: "[Russian translation]",
        fr: "[French translation]",
        it: "[Italian translation]",
        nl: "[Dutch translation]",
        es: "[Spanish translation]",
        tr: "[Turkish translation]",
        ar: "[Arabic translation]",
        zh: "[Chinese translation]",
        pt: "[Portuguese translation]"
    },

    "[Option C]": {
        en: "[English translation]",
        pl: "[Polish translation]",
        ru: "[Russian translation]",
        fr: "[French translation]",
        it: "[Italian translation]",
        nl: "[Dutch translation]",
        es: "[Spanish translation]",
        tr: "[Turkish translation]",
        ar: "[Arabic translation]",
        zh: "[Chinese translation]",
        pt: "[Portuguese translation]"
    },

    // =========================================================================
    // Speaking Exercise
    // =========================================================================
    
    "[Speaking prompt in German]": {
        en: "[English translation]",
        pl: "[Polish translation]",
        ru: "[Russian translation]",
        fr: "[French translation]",
        it: "[Italian translation]",
        nl: "[Dutch translation]",
        es: "[Spanish translation]",
        tr: "[Turkish translation]",
        ar: "[Arabic translation]",
        zh: "[Chinese translation]",
        pt: "[Portuguese translation]"
    },

    // =========================================================================
    // Interactive Elements
    // =========================================================================
    
    "Dialog anhören": {
        en: "Listen to dialog",
        pl: "Posłuchaj dialogu",
        ru: "Прослушать диалог",
        fr: "Écouter le dialogue",
        it: "Ascolta il dialogo",
        nl: "Luister naar dialoog",
        es: "Escuchar diálogo",
        tr: "Diyaloğu dinle",
        ar: "استمع للحوار",
        zh: "听对话",
        pt: "Ouvir diálogo"
    },

    "Antwort prüfen": {
        en: "Check answer",
        pl: "Sprawdź odpowiedź",
        ru: "Проверить ответ",
        fr: "Vérifier la réponse",
        it: "Controlla risposta",
        nl: "Controleer antwoord",
        es: "Verificar respuesta",
        tr: "Cevabı kontrol et",
        ar: "تحقق من الإجابة",
        zh: "检查答案",
        pt: "Verificar resposta"
    },

    "Aufnehmen": {
        en: "Record",
        pl: "Nagraj",
        ru: "Записать",
        fr: "Enregistrer",
        it: "Registra",
        nl: "Opnemen",
        es: "Grabar",
        tr: "Kaydet",
        ar: "سجل",
        zh: "录制",
        pt: "Gravar"
    },

    // =========================================================================
    // Navigation
    // =========================================================================
    
    "Zurück zur Übersicht": {
        en: "Back to overview",
        pl: "Powrót do przeglądu",
        ru: "Назад к обзору",
        fr: "Retour à l'aperçu",
        it: "Torna alla panoramica",
        nl: "Terug naar overzicht",
        es: "Volver al resumen",
        tr: "Genel bakışa dön",
        ar: "العودة إلى النظرة العامة",
        zh: "返回概览",
        pt: "Voltar à visão geral"
    },

    "Nächste Lektion": {
        en: "Next lesson",
        pl: "Następna lekcja",
        ru: "Следующий урок",
        fr: "Leçon suivante",
        it: "Prossima lezione",
        nl: "Volgende les",
        es: "Siguiente lección",
        tr: "Sonraki ders",
        ar: "الدرس التالي",
        zh: "下一课",
        pt: "Próxima lição"
    }

    // =========================================================================
    // Add more translations as needed for your specific lesson content
    // =========================================================================
};
```

## Dialog Markdown Template

Create `dialogs/dialog1.md` using this template:

```markdown
# Dialog [N] - [Dialog Title]

## Context
[Brief description of the dialog context, setting, and characters]

## Characters
- **Person A**: [Character description]
- **Person B**: [Character description]

## Dialog

**Person A**: [German dialog line 1]

**Person B**: [German dialog line 2]

**Person A**: [German dialog line 3]

**Person B**: [German dialog line 4]

[Continue with more dialog lines as needed]

## Vocabulary Notes
- **[German word]**: [Brief explanation or context]
- **[German word]**: [Brief explanation or context]

## Grammar Points
- [Grammar point 1 illustrated in this dialog]
- [Grammar point 2 illustrated in this dialog]

## Cultural Notes
[Any cultural context that learners should understand]

## Audio Information
- **File**: LA2.1.[N].1.mp3
- **Duration**: [Duration]
- **Speed**: [Normal/Slow]
- **Accent**: [Regional accent if applicable]
```

## Quick Start Checklist

When creating a new lesson, follow this checklist:

### 1. Setup
- [ ] Create unit directory structure
- [ ] Copy template files
- [ ] Update file names and paths

### 2. Content Creation
- [ ] Write German content (dialog, vocabulary, quiz)
- [ ] Create or gather images
- [ ] Record or obtain audio files
- [ ] Write dialog markdown files

### 3. Translation
- [ ] Add all German text to translations.js
- [ ] Translate to all 12 languages
- [ ] Test translation display

### 4. Technical Implementation
- [ ] Update HTML with actual content
- [ ] Customize CSS for lesson theme
- [ ] Update JavaScript configuration
- [ ] Test all interactive elements

### 5. Quality Assurance
- [ ] Test on multiple browsers
- [ ] Verify responsive design
- [ ] Check audio and image loading
- [ ] Validate translations
- [ ] Test lesson flow

### 6. Integration
- [ ] Update navigation links
- [ ] Add to main index if needed
- [ ] Test integration with existing lessons

## Tips for Success

1. **Start with Content**: Write all German content first before translating
2. **Use Consistent Structure**: Follow the template exactly for consistency
3. **Test Early and Often**: Test each component as you build it
4. **Focus on User Experience**: Ensure smooth, intuitive interactions
5. **Document Everything**: Add comments and documentation as you go
6. **Think Mobile-First**: Design for mobile, then enhance for desktop

---

This template system ensures consistency across all lessons while providing flexibility for unit-specific customizations. Follow the templates closely, and your lessons will integrate seamlessly with the existing translation system and overall app architecture.
