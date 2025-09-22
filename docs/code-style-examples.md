# Code Style Examples and Best Practices

## Overview

This document provides concrete examples of clean, maintainable code following the project's engineering standards. Use these examples as templates when developing new features or lessons.

## Table of Contents

1. [JavaScript Best Practices](#javascript-best-practices)
2. [CSS Architecture](#css-architecture)  
3. [HTML Structure](#html-structure)
4. [Translation System Integration](#translation-system-integration)
5. [Audio and Media Handling](#audio-and-media-handling)
6. [Error Handling Patterns](#error-handling-patterns)
7. [State Management](#state-management)
8. [Performance Optimization](#performance-optimization)

## JavaScript Best Practices

### ✅ Modern Function Declarations

```javascript
// Good: Modern arrow functions with clear parameters
const playAudio = async (audioPath, options = {}) => {
    const { autoplay = true, volume = 1.0, onComplete = null } = options;
    
    try {
        const audio = new Audio(audioPath);
        audio.volume = volume;
        
        if (onComplete) {
            audio.addEventListener('ended', onComplete);
        }
        
        if (autoplay) {
            await audio.play();
        }
        
        return audio;
        
    } catch (error) {
        console.error('Audio playback failed:', error);
        throw new AudioError(`Failed to play audio: ${audioPath}`);
    }
};

// Bad: Old-style function with poor error handling
function playSound(src) {
    var audio = new Audio(src);
    audio.play();
}
```

### ✅ Class-Based Components

```javascript
// Good: Well-structured class with clear responsibilities
class QuizManager {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.questions = options.questions || [];
        this.currentQuestion = 0;
        this.score = 0;
        this.completed = false;
        
        this.init();
    }
    
    /**
     * Initializes the quiz with event listeners and UI
     */
    init() {
        this.validateContainer();
        this.setupEventListeners();
        this.renderCurrentQuestion();
    }
    
    /**
     * Validates that container element exists
     * @throws {Error} If container is invalid
     */
    validateContainer() {
        if (!this.container || !(this.container instanceof HTMLElement)) {
            throw new Error('QuizManager requires a valid HTML container element');
        }
    }
    
    /**
     * Sets up event delegation for quiz interactions
     */
    setupEventListeners() {
        this.container.addEventListener('click', (event) => {
            if (event.target.matches('.quiz__option')) {
                this.handleOptionSelect(event.target);
            } else if (event.target.matches('.quiz__next-btn')) {
                this.nextQuestion();
            }
        });
    }
    
    /**
     * Handles option selection with validation
     * @param {HTMLElement} optionElement - Selected option element
     */
    handleOptionSelect(optionElement) {
        if (this.completed) return;
        
        const selectedValue = optionElement.dataset.value;
        const isCorrect = this.checkAnswer(selectedValue);
        
        this.updateUI(optionElement, isCorrect);
        this.updateScore(isCorrect);
        
        // Log for analytics
        this.logInteraction('option_selected', {
            questionIndex: this.currentQuestion,
            selectedValue,
            isCorrect
        });
    }
    
    /**
     * Checks if the provided answer is correct
     * @param {string} answer - The selected answer
     * @returns {boolean} Whether the answer is correct
     */
    checkAnswer(answer) {
        const currentQ = this.questions[this.currentQuestion];
        return currentQ && currentQ.correctAnswer === answer;
    }
    
    /**
     * Updates the UI based on answer correctness
     * @param {HTMLElement} element - The selected option element
     * @param {boolean} isCorrect - Whether the answer was correct
     */
    updateUI(element, isCorrect) {
        element.classList.add(isCorrect ? 'correct' : 'incorrect');
        
        const feedback = element.closest('.quiz__question')
            .querySelector('.quiz__feedback');
            
        if (feedback) {
            feedback.textContent = isCorrect ? 
                'Richtig! Gut gemacht!' : 
                'Nicht ganz richtig. Versuche es nochmal!';
            feedback.className = `quiz__feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        }
    }
    
    /**
     * Logs user interactions for analytics
     * @param {string} action - The action performed
     * @param {Object} data - Additional data to log
     */
    logInteraction(action, data = {}) {
        const logData = {
            timestamp: new Date().toISOString(),
            component: 'QuizManager',
            action,
            ...data
        };
        
        console.log('Quiz Interaction:', logData);
        
        // TODO: Send to analytics service
        if (window.analytics && typeof window.analytics.track === 'function') {
            window.analytics.track('quiz_interaction', logData);
        }
    }
}

// Usage example
const initializeQuiz = () => {
    const quizContainer = document.querySelector('.quiz-container');
    if (!quizContainer) return;
    
    const questions = [
        {
            id: 1,
            text: "Wie geht es dir?",
            options: ["Gut", "Schlecht", "So so"],
            correctAnswer: "Gut"
        }
    ];
    
    try {
        const quiz = new QuizManager(quizContainer, { questions });
        return quiz;
    } catch (error) {
        console.error('Failed to initialize quiz:', error);
        showUserFeedback('Quiz konnte nicht geladen werden.', 'error');
    }
};
```

### ✅ Modular State Management

```javascript
// Good: Centralized state with clear structure
const createLessonState = () => {
    const state = {
        // Audio state
        audio: {
            current: null,
            isPlaying: false,
            volume: 1.0
        },
        
        // Progress tracking
        progress: {
            currentStep: 0,
            completedSteps: new Set(),
            startTime: Date.now(),
            lastActivity: Date.now()
        },
        
        // User preferences
        preferences: {
            selectedLanguage: localStorage.getItem('selectedLanguage') || '',
            showTranslations: localStorage.getItem('showTranslations') === 'true',
            audioSpeed: parseFloat(localStorage.getItem('audioSpeed')) || 1.0
        },
        
        // Quiz state
        quiz: {
            answers: new Map(),
            score: 0,
            attempts: new Map()
        }
    };
    
    // State update methods
    const updateState = (category, updates) => {
        if (state[category]) {
            Object.assign(state[category], updates);
            
            // Persist preferences
            if (category === 'preferences') {
                persistPreferences(updates);
            }
            
            // Emit state change event
            document.dispatchEvent(new CustomEvent('lessonStateChange', {
                detail: { category, updates, state }
            }));
        }
    };
    
    const persistPreferences = (preferences) => {
        Object.entries(preferences).forEach(([key, value]) => {
            localStorage.setItem(key, String(value));
        });
    };
    
    const getState = () => ({ ...state });
    
    return {
        getState,
        updateState,
        // Specific updaters for common operations
        setAudio: (audio) => updateState('audio', { current: audio }),
        setPlaying: (isPlaying) => updateState('audio', { isPlaying }),
        completeStep: (step) => {
            state.progress.completedSteps.add(step);
            updateState('progress', { 
                currentStep: step + 1,
                lastActivity: Date.now()
            });
        },
        setLanguage: (language) => updateState('preferences', { selectedLanguage: language })
    };
};

// Usage
const lessonState = createLessonState();

// Listen for state changes
document.addEventListener('lessonStateChange', (event) => {
    console.log('State updated:', event.detail);
});
```

## CSS Architecture

### ✅ BEM Methodology with CSS Custom Properties

```css
/* Good: Structured CSS with clear hierarchy and maintainable variables */

/* ==========================================================================
   CSS Custom Properties (Variables)
   ========================================================================== */

:root {
    /* Color Palette */
    --color-primary: #4a90e2;
    --color-primary-dark: #357abd;
    --color-primary-light: #6ba3e8;
    
    --color-secondary: #f39c12;
    --color-secondary-dark: #e67e22;
    
    --color-success: #27ae60;
    --color-warning: #f1c40f;
    --color-error: #e74c3c;
    --color-info: #3498db;
    
    /* Typography */
    --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-family-heading: 'Merriweather', serif;
    
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-2xl: 1.5rem;
    --font-size-3xl: 2rem;
    
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    
    /* Spacing */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;
    --space-2xl: 3rem;
    
    /* Layout */
    --container-max-width: 1200px;
    --border-radius: 8px;
    --border-radius-lg: 12px;
    --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    --box-shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.15);
    
    /* Transitions */
    --transition-fast: 0.15s ease;
    --transition-normal: 0.3s ease;
    --transition-slow: 0.5s ease;
}

/* ==========================================================================
   Component: Lesson Quiz
   ========================================================================== */

.lesson-quiz {
    background: white;
    border-radius: var(--border-radius-lg);
    box-shadow: var(--box-shadow);
    padding: var(--space-xl);
    margin: var(--space-lg) 0;
}

.lesson-quiz__header {
    margin-bottom: var(--space-lg);
}

.lesson-quiz__title {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    margin: 0 0 var(--space-sm);
}

.lesson-quiz__description {
    font-size: var(--font-size-lg);
    color: #6c757d;
    margin: 0;
    line-height: 1.6;
}

/* Question Component */
.quiz-question {
    margin-bottom: var(--space-xl);
    padding-bottom: var(--space-lg);
    border-bottom: 1px solid #e9ecef;
}

.quiz-question:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
}

.quiz-question__prompt {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    margin-bottom: var(--space-lg);
    line-height: 1.5;
}

.quiz-question__options {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
}

/* Option Component */
.quiz-option {
    display: flex;
    align-items: center;
    padding: var(--space-md);
    border: 2px solid #e9ecef;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all var(--transition-normal);
    background: white;
}

.quiz-option:hover {
    border-color: var(--color-primary-light);
    background: #f8f9fa;
    transform: translateY(-1px);
}

.quiz-option:focus-within {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.quiz-option--selected {
    border-color: var(--color-primary);
    background: rgba(74, 144, 226, 0.05);
}

.quiz-option--correct {
    border-color: var(--color-success);
    background: rgba(39, 174, 96, 0.1);
}

.quiz-option--incorrect {
    border-color: var(--color-error);
    background: rgba(231, 76, 60, 0.1);
}

.quiz-option__input {
    margin-right: var(--space-md);
    transform: scale(1.2);
}

.quiz-option__text {
    font-size: var(--font-size-base);
    color: #333;
    flex: 1;
}

/* Feedback Component */
.quiz-feedback {
    padding: var(--space-md);
    border-radius: var(--border-radius);
    font-weight: var(--font-weight-medium);
    margin-top: var(--space-md);
    transition: all var(--transition-normal);
}

.quiz-feedback--success {
    background: rgba(39, 174, 96, 0.1);
    color: var(--color-success);
    border: 1px solid rgba(39, 174, 96, 0.2);
}

.quiz-feedback--error {
    background: rgba(231, 76, 60, 0.1);
    color: var(--color-error);
    border: 1px solid rgba(231, 76, 60, 0.2);
}

/* ==========================================================================
   Responsive Design
   ========================================================================== */

@media (max-width: 768px) {
    .lesson-quiz {
        padding: var(--space-lg);
        margin: var(--space-md) 0;
    }
    
    .lesson-quiz__title {
        font-size: var(--font-size-xl);
    }
    
    .quiz-question__prompt {
        font-size: var(--font-size-base);
    }
    
    .quiz-question__options {
        gap: var(--space-sm);
    }
    
    .quiz-option {
        padding: var(--space-sm);
    }
}

/* ==========================================================================
   Animation Classes
   ========================================================================== */

.fade-in {
    animation: fadeIn var(--transition-normal) ease-in;
}

.slide-up {
    animation: slideUp var(--transition-normal) ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ==========================================================================
   Utility Classes
   ========================================================================== */

.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.mb-0 { margin-bottom: 0; }
.mb-1 { margin-bottom: var(--space-sm); }
.mb-2 { margin-bottom: var(--space-md); }
.mb-3 { margin-bottom: var(--space-lg); }
```

### ❌ Bad CSS Example

```css
/* Bad: Inconsistent naming, hard-coded values, no structure */
.quiz {
    background: #fff;
    padding: 32px;
    margin: 24px 0;
    border-radius: 12px;
}

.question {
    margin-bottom: 20px;
}

.option {
    padding: 16px;
    border: 1px solid #ddd;
    margin: 8px 0;
}

.option:hover {
    background: #f5f5f5;
}

.correct {
    border: 1px solid green;
    background: lightgreen;
}

.wrong {
    border: 1px solid red;
    background: pink;
}
```

## HTML Structure

### ✅ Semantic and Accessible HTML

```html
<!-- Good: Semantic structure with proper ARIA labels -->
<section class="lesson-section" aria-labelledby="quiz-heading">
    <header class="lesson-section__header">
        <h2 id="quiz-heading" class="lesson-section__title">
            Wortschatz-Quiz
        </h2>
        <p class="lesson-section__description">
            Teste dein Wissen über die neuen Vokabeln.
        </p>
    </header>
    
    <form class="quiz-form" role="group" aria-labelledby="quiz-heading">
        <fieldset class="quiz-question" aria-describedby="question-1-help">
            <legend class="quiz-question__prompt">
                Was bedeutet "das Brot"?
            </legend>
            
            <div id="question-1-help" class="quiz-question__help">
                Wähle die richtige Übersetzung aus.
            </div>
            
            <div class="quiz-question__options" role="radiogroup">
                <label class="quiz-option">
                    <input 
                        type="radio" 
                        name="question-1" 
                        value="bread"
                        class="quiz-option__input"
                        aria-describedby="option-1-desc"
                    >
                    <span class="quiz-option__text">Bread</span>
                    <span id="option-1-desc" class="visually-hidden">
                        First option: Bread
                    </span>
                </label>
                
                <label class="quiz-option">
                    <input 
                        type="radio" 
                        name="question-1" 
                        value="butter"
                        class="quiz-option__input"
                        aria-describedby="option-2-desc"
                    >
                    <span class="quiz-option__text">Butter</span>
                    <span id="option-2-desc" class="visually-hidden">
                        Second option: Butter
                    </span>
                </label>
                
                <label class="quiz-option">
                    <input 
                        type="radio" 
                        name="question-1" 
                        value="water"
                        class="quiz-option__input"
                        aria-describedby="option-3-desc"
                    >
                    <span class="quiz-option__text">Water</span>
                    <span id="option-3-desc" class="visually-hidden">
                        Third option: Water
                    </span>
                </label>
            </div>
            
            <button 
                type="button" 
                class="quiz-question__check-btn"
                data-correct-answer="bread"
                aria-describedby="question-1-feedback"
            >
                Antwort prüfen
            </button>
            
            <div 
                id="question-1-feedback" 
                class="quiz-question__feedback"
                role="status"
                aria-live="polite"
            >
                <!-- Feedback will be inserted here -->
            </div>
        </fieldset>
    </form>
</section>
```

### ❌ Bad HTML Example

```html
<!-- Bad: No semantic structure, poor accessibility -->
<div class="quiz">
    <div class="title">Quiz</div>
    <div class="question">
        <div class="prompt">Was bedeutet "das Brot"?</div>
        <div class="options">
            <div class="option">
                <input type="radio" name="q1" value="bread">
                <span>Bread</span>
            </div>
            <div class="option">
                <input type="radio" name="q1" value="butter">
                <span>Butter</span>
            </div>
        </div>
        <button onclick="checkAnswer()">Check</button>
        <div class="feedback"></div>
    </div>
</div>
```

## Translation System Integration

### ✅ Robust Translation Implementation

```javascript
// Good: Comprehensive translation system with error handling
class TranslationManager {
    constructor() {
        this.translations = window.TRANSLATIONS || {};
        this.currentLanguage = localStorage.getItem('selectedLanguage') || '';
        this.observers = new Set();
        this.cache = new Map();
        
        this.initializeTranslationObserver();
    }
    
    /**
     * Initializes mutation observer to detect new content
     */
    initializeTranslationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.translateNewContent(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.mutationObserver = observer;
    }
    
    /**
     * Translates newly added content
     * @param {HTMLElement} element - New element to translate
     */
    translateNewContent(element) {
        if (!this.currentLanguage) return;
        
        const translatableElements = this.findTranslatableElements(element);
        translatableElements.forEach(({ element, text }) => {
            this.addTranslationToElement(element, text, this.currentLanguage);
        });
    }
    
    /**
     * Finds all translatable elements within a container
     * @param {HTMLElement} container - Container to search
     * @returns {Array} Array of translatable elements with their text
     */
    findTranslatableElements(container = document) {
        const selectors = [
            '.lesson__title',
            '.lesson__subtitle',
            '.section__title',
            '.dialogue .text',
            '.quiz__prompt',
            '.option__text',
            '.speaking__question-text',
            '.vocabulary__word',
            '.instruction__text'
        ];
        
        const elements = [];
        
        selectors.forEach(selector => {
            const found = container.querySelectorAll(selector);
            found.forEach(element => {
                const text = this.extractText(element);
                if (text && this.hasTranslation(text)) {
                    elements.push({ element, text });
                }
            });
        });
        
        return elements;
    }
    
    /**
     * Extracts clean text from element
     * @param {HTMLElement} element - Element to extract text from
     * @returns {string} Clean text content
     */
    extractText(element) {
        // Clone element to avoid modifying original
        const clone = element.cloneNode(true);
        
        // Remove existing translations
        clone.querySelectorAll('.translation').forEach(el => el.remove());
        
        return clone.textContent.trim();
    }
    
    /**
     * Checks if translation exists for given text
     * @param {string} text - Text to check
     * @returns {boolean} Whether translation exists
     */
    hasTranslation(text) {
        return this.translations[text] && 
               typeof this.translations[text] === 'object';
    }
    
    /**
     * Gets translation for text in specified language
     * @param {string} text - Original text
     * @param {string} language - Target language code
     * @returns {string|null} Translation or null if not found
     */
    getTranslation(text, language) {
        const cacheKey = `${text}:${language}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const translation = this.translations[text]?.[language] || null;
        this.cache.set(cacheKey, translation);
        
        return translation;
    }
    
    /**
     * Adds translation element to target element
     * @param {HTMLElement} element - Target element
     * @param {string} originalText - Original text
     * @param {string} language - Language code
     */
    addTranslationToElement(element, originalText, language) {
        // Remove existing translation
        const existingTranslation = element.querySelector('.translation');
        if (existingTranslation) {
            existingTranslation.remove();
        }
        
        const translation = this.getTranslation(originalText, language);
        if (!translation) return;
        
        const translationElement = document.createElement('div');
        translationElement.className = 'translation';
        translationElement.textContent = translation;
        translationElement.setAttribute('lang', language);
        translationElement.setAttribute('data-original', originalText);
        
        element.appendChild(translationElement);
    }
    
    /**
     * Shows translations for specified language
     * @param {string} language - Language code
     */
    showTranslations(language) {
        this.currentLanguage = language;
        localStorage.setItem('selectedLanguage', language);
        
        if (!language) {
            this.hideAllTranslations();
            return;
        }
        
        const elements = this.findTranslatableElements();
        elements.forEach(({ element, text }) => {
            this.addTranslationToElement(element, text, language);
        });
        
        // Notify observers
        this.notifyObservers('language_changed', { language });
    }
    
    /**
     * Hides all translations
     */
    hideAllTranslations() {
        document.querySelectorAll('.translation').forEach(el => el.remove());
        this.currentLanguage = '';
        localStorage.removeItem('selectedLanguage');
        
        this.notifyObservers('translations_hidden');
    }
    
    /**
     * Adds observer for translation events
     * @param {Function} callback - Observer callback
     */
    addObserver(callback) {
        this.observers.add(callback);
    }
    
    /**
     * Removes observer
     * @param {Function} callback - Observer callback to remove
     */
    removeObserver(callback) {
        this.observers.delete(callback);
    }
    
    /**
     * Notifies all observers of events
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    notifyObservers(event, data = {}) {
        this.observers.forEach(callback => {
            try {
                callback({ event, data });
            } catch (error) {
                console.error('Translation observer error:', error);
            }
        });
    }
    
    /**
     * Validates translation data integrity
     * @returns {Object} Validation report
     */
    validateTranslations() {
        const report = {
            valid: true,
            errors: [],
            warnings: [],
            stats: {
                totalKeys: 0,
                completeTranslations: 0,
                incompleteTranslations: 0
            }
        };
        
        const supportedLanguages = ['en', 'pl', 'ru', 'fr', 'it', 'nl', 'es', 'tr', 'ar', 'zh', 'pt'];
        
        Object.entries(this.translations).forEach(([key, translations]) => {
            report.stats.totalKeys++;
            
            if (typeof translations !== 'object') {
                report.errors.push(`Invalid translation object for key: ${key}`);
                report.valid = false;
                return;
            }
            
            const missingLanguages = supportedLanguages.filter(lang => !translations[lang]);
            
            if (missingLanguages.length === 0) {
                report.stats.completeTranslations++;
            } else {
                report.stats.incompleteTranslations++;
                report.warnings.push(`Missing translations for "${key}": ${missingLanguages.join(', ')}`);
            }
        });
        
        return report;
    }
    
    /**
     * Cleanup method
     */
    destroy() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        this.observers.clear();
        this.cache.clear();
    }
}

// Usage
const translationManager = new TranslationManager();

// Initialize with saved language
const savedLanguage = localStorage.getItem('selectedLanguage');
if (savedLanguage) {
    translationManager.showTranslations(savedLanguage);
}

// Listen for translation events
translationManager.addObserver(({ event, data }) => {
    console.log('Translation event:', event, data);
    
    if (event === 'language_changed') {
        // Update UI language indicator
        updateLanguageIndicator(data.language);
    }
});
```

## Audio and Media Handling

### ✅ Robust Audio Management

```javascript
// Good: Comprehensive audio system with proper error handling
class AudioManager {
    constructor() {
        this.audioCache = new Map();
        this.currentAudio = null;
        this.isPlaying = false;
        this.volume = 1.0;
        this.playbackRate = 1.0;
        
        this.setupEventListeners();
    }
    
    /**
     * Sets up global event listeners
     */
    setupEventListeners() {
        // Pause audio when page loses focus
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isPlaying) {
                this.pause();
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                this.togglePlayPause();
            }
        });
    }
    
    /**
     * Loads audio file with caching and error handling
     * @param {string} audioPath - Path to audio file
     * @returns {Promise<HTMLAudioElement>} Audio element
     */
    async loadAudio(audioPath) {
        if (this.audioCache.has(audioPath)) {
            return this.audioCache.get(audioPath);
        }
        
        return new Promise((resolve, reject) => {
            const audio = new Audio(audioPath);
            
            const handleLoad = () => {
                this.audioCache.set(audioPath, audio);
                cleanup();
                resolve(audio);
            };
            
            const handleError = (error) => {
                cleanup();
                reject(new Error(`Failed to load audio: ${audioPath} - ${error.message}`));
            };
            
            const cleanup = () => {
                audio.removeEventListener('loadeddata', handleLoad);
                audio.removeEventListener('error', handleError);
            };
            
            audio.addEventListener('loadeddata', handleLoad);
            audio.addEventListener('error', handleError);
            
            // Set audio properties
            audio.volume = this.volume;
            audio.playbackRate = this.playbackRate;
            
            // Start loading
            audio.load();
        });
    }
    
    /**
     * Plays audio with comprehensive options
     * @param {string} audioPath - Path to audio file
     * @param {Object} options - Playback options
     * @returns {Promise<void>}
     */
    async playAudio(audioPath, options = {}) {
        const {
            startTime = 0,
            endTime = null,
            loop = false,
            onProgress = null,
            onComplete = null,
            onError = null
        } = options;
        
        try {
            // Stop current audio
            this.stop();
            
            // Load audio
            const audio = await this.loadAudio(audioPath);
            this.currentAudio = audio;
            
            // Set start time
            if (startTime > 0) {
                audio.currentTime = startTime;
            }
            
            // Setup event listeners
            const handleTimeUpdate = () => {
                if (onProgress) {
                    onProgress({
                        currentTime: audio.currentTime,
                        duration: audio.duration,
                        progress: audio.currentTime / audio.duration
                    });
                }
                
                // Handle end time
                if (endTime && audio.currentTime >= endTime) {
                    this.pause();
                    if (onComplete) onComplete();
                }
            };
            
            const handleEnded = () => {
                this.isPlaying = false;
                if (onComplete) onComplete();
                cleanup();
            };
            
            const handleError = (error) => {
                this.isPlaying = false;
                if (onError) onError(error);
                cleanup();
            };
            
            const cleanup = () => {
                audio.removeEventListener('timeupdate', handleTimeUpdate);
                audio.removeEventListener('ended', handleEnded);
                audio.removeEventListener('error', handleError);
            };
            
            audio.addEventListener('timeupdate', handleTimeUpdate);
            audio.addEventListener('ended', handleEnded);
            audio.addEventListener('error', handleError);
            
            // Set loop
            audio.loop = loop;
            
            // Start playback
            await audio.play();
            this.isPlaying = true;
            
            // Dispatch custom event
            document.dispatchEvent(new CustomEvent('audioStarted', {
                detail: { audioPath, audio }
            }));
            
        } catch (error) {
            console.error('Audio playback failed:', error);
            
            if (onError) {
                onError(error);
            } else {
                this.showAudioError(error.message);
            }
            
            throw error;
        }
    }
    
    /**
     * Pauses current audio
     */
    pause() {
        if (this.currentAudio && this.isPlaying) {
            this.currentAudio.pause();
            this.isPlaying = false;
            
            document.dispatchEvent(new CustomEvent('audioPaused', {
                detail: { audio: this.currentAudio }
            }));
        }
    }
    
    /**
     * Stops current audio
     */
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.isPlaying = false;
            
            document.dispatchEvent(new CustomEvent('audioStopped', {
                detail: { audio: this.currentAudio }
            }));
        }
    }
    
    /**
     * Toggles play/pause
     */
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else if (this.currentAudio) {
            this.currentAudio.play().then(() => {
                this.isPlaying = true;
            }).catch(error => {
                console.error('Resume playback failed:', error);
            });
        }
    }
    
    /**
     * Sets volume (0.0 to 1.0)
     * @param {number} volume - Volume level
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (this.currentAudio) {
            this.currentAudio.volume = this.volume;
        }
        
        // Update all cached audio
        this.audioCache.forEach(audio => {
            audio.volume = this.volume;
        });
    }
    
    /**
     * Sets playback rate (0.5 to 2.0)
     * @param {number} rate - Playback rate
     */
    setPlaybackRate(rate) {
        this.playbackRate = Math.max(0.5, Math.min(2.0, rate));
        
        if (this.currentAudio) {
            this.currentAudio.playbackRate = this.playbackRate;
        }
        
        // Update all cached audio
        this.audioCache.forEach(audio => {
            audio.playbackRate = this.playbackRate;
        });
    }
    
    /**
     * Shows user-friendly error message
     * @param {string} message - Error message
     */
    showAudioError(message) {
        const errorEvent = new CustomEvent('showUserFeedback', {
            detail: {
                message: 'Audio konnte nicht abgespielt werden.',
                type: 'error'
            }
        });
        
        document.dispatchEvent(errorEvent);
    }
    
    /**
     * Clears audio cache
     */
    clearCache() {
        this.audioCache.clear();
    }
    
    /**
     * Gets current playback info
     * @returns {Object} Playback information
     */
    getPlaybackInfo() {
        if (!this.currentAudio) return null;
        
        return {
            currentTime: this.currentAudio.currentTime,
            duration: this.currentAudio.duration,
            volume: this.volume,
            playbackRate: this.playbackRate,
            isPlaying: this.isPlaying,
            progress: this.currentAudio.currentTime / this.currentAudio.duration
        };
    }
}

// Usage
const audioManager = new AudioManager();

// Play dialog audio with progress tracking
const playDialogAudio = async () => {
    try {
        await audioManager.playAudio('audio/LA2.1.1.mp3', {
            onProgress: (info) => {
                updateProgressBar(info.progress);
            },
            onComplete: () => {
                console.log('Dialog audio completed');
                enableNextButton();
            },
            onError: (error) => {
                console.error('Dialog audio error:', error);
            }
        });
    } catch (error) {
        console.error('Failed to start dialog audio:', error);
    }
};
```

## Error Handling Patterns

### ✅ Comprehensive Error Handling

```javascript
// Good: Structured error handling with user feedback
class LessonError extends Error {
    constructor(message, type = 'general', details = {}) {
        super(message);
        this.name = 'LessonError';
        this.type = type;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.setupGlobalErrorHandling();
    }
    
    /**
     * Sets up global error handlers
     */
    setupGlobalErrorHandling() {
        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError(new LessonError(
                event.message,
                'javascript',
                {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error?.stack
                }
            ));
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(new LessonError(
                'Unhandled promise rejection',
                'promise',
                {
                    reason: event.reason,
                    promise: event.promise
                }
            ));
        });
        
        // Handle resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                const element = event.target;
                this.handleError(new LessonError(
                    `Failed to load resource: ${element.src || element.href}`,
                    'resource',
                    {
                        elementType: element.tagName,
                        source: element.src || element.href
                    }
                ));
            }
        }, true);
    }
    
    /**
     * Handles errors with appropriate user feedback
     * @param {Error} error - Error to handle
     */
    handleError(error) {
        // Log error
        this.logError(error);
        
        // Determine user message based on error type
        const userMessage = this.getUserMessage(error);
        
        // Show user feedback
        this.showUserFeedback(userMessage, 'error');
        
        // Send to monitoring service (if available)
        this.reportError(error);
    }
    
    /**
     * Logs error to console and internal log
     * @param {Error} error - Error to log
     */
    logError(error) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            message: error.message,
            type: error.type || 'unknown',
            details: error.details || {},
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.errorLog.push(logEntry);
        console.error('Lesson Error:', logEntry);
        
        // Keep only last 50 errors
        if (this.errorLog.length > 50) {
            this.errorLog = this.errorLog.slice(-50);
        }
    }
    
    /**
     * Gets user-friendly error message
     * @param {Error} error - Error object
     * @returns {string} User-friendly message
     */
    getUserMessage(error) {
        const messageMap = {
            audio: 'Audio konnte nicht abgespielt werden. Bitte versuche es erneut.',
            translation: 'Übersetzung konnte nicht geladen werden.',
            network: 'Netzwerkfehler. Bitte prüfe deine Internetverbindung.',
            resource: 'Einige Inhalte konnten nicht geladen werden.',
            quiz: 'Quiz konnte nicht verarbeitet werden.',
            javascript: 'Ein technischer Fehler ist aufgetreten.',
            general: 'Ein unerwarteter Fehler ist aufgetreten.'
        };
        
        return messageMap[error.type] || messageMap.general;
    }
    
    /**
     * Shows user feedback message
     * @param {string} message - Message to show
     * @param {string} type - Message type
     */
    showUserFeedback(message, type = 'info') {
        const event = new CustomEvent('showUserFeedback', {
            detail: { message, type }
        });
        
        document.dispatchEvent(event);
    }
    
    /**
     * Reports error to monitoring service
     * @param {Error} error - Error to report
     */
    reportError(error) {
        // TODO: Implement error reporting to service
        if (window.errorReporting && typeof window.errorReporting.report === 'function') {
            window.errorReporting.report({
                message: error.message,
                type: error.type,
                details: error.details,
                stack: error.stack,
                timestamp: error.timestamp
            });
        }
    }
    
    /**
     * Wraps async functions with error handling
     * @param {Function} fn - Function to wrap
     * @returns {Function} Wrapped function
     */
    wrapAsync(fn) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.handleError(error instanceof LessonError ? error : 
                    new LessonError(error.message, 'general', { originalError: error }));
                throw error;
            }
        };
    }
    
    /**
     * Gets error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            recent: this.errorLog.slice(-10)
        };
        
        this.errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });
        
        return stats;
    }
}

// Initialize global error handler
const errorHandler = new ErrorHandler();

// Usage examples
const safeAudioPlay = errorHandler.wrapAsync(async (audioPath) => {
    const audio = new Audio(audioPath);
    await audio.play();
});

const safeApiCall = errorHandler.wrapAsync(async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new LessonError(
            `API call failed: ${response.status}`,
            'network',
            { url, status: response.status }
        );
    }
    return response.json();
});
```

---

These examples demonstrate clean, maintainable code that follows modern JavaScript best practices, proper error handling, accessibility standards, and the project's architectural patterns. Use these as templates when developing new features or refactoring existing code.
