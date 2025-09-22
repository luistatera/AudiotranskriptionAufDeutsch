/**
 * Universal Navigation System
 * Works across separate step files for scalable lesson structure
 */

class UniversalNavigation {
  constructor() {
    this.config = null;
    this.currentStep = 1;
    this.totalSteps = 0;
    this.basePath = '';
    this.initialized = false;
  }

  /**
   * Initialize the navigation system
   */
  async init() {
    if (this.initialized) return;

    try {
      // Load unit configuration
      await this.loadConfig();
      
      // Determine current step from URL
      this.detectCurrentStep();
      
      // Setup navigation elements
      this.setupNavigation();
      
      // Setup translation integration
      this.setupTranslations();
      
      // Setup keyboard navigation
      this.setupKeyboardNavigation();
      
      this.initialized = true;
      console.log('Universal Navigation initialized:', {
        currentStep: this.currentStep,
        totalSteps: this.totalSteps,
        config: this.config
      });
    } catch (error) {
      console.error('Failed to initialize navigation:', error);
    }
  }

  /**
   * Load unit configuration
   */
  async loadConfig() {
    if (window.UNIT_CONFIG) {
      this.config = window.UNIT_CONFIG;
      this.totalSteps = this.config.steps.length;
      return;
    }

    // Try to load config if not already loaded
    try {
      const configScript = document.createElement('script');
      configScript.src = this.resolveUrl('../unit-config.js');
      document.head.appendChild(configScript);
      
      return new Promise((resolve) => {
        configScript.onload = () => {
          this.config = window.UNIT_CONFIG;
          this.totalSteps = this.config.steps.length;
          resolve();
        };
      });
    } catch (error) {
      throw new Error('Could not load unit configuration');
    }
  }

  /**
   * Detect current step from URL or filename
   */
  detectCurrentStep() {
    const currentFile = window.location.pathname.split('/').pop();
    const stepMatch = currentFile.match(/step(\d+)\.html/);
    
    if (stepMatch) {
      this.currentStep = parseInt(stepMatch[1]);
    } else {
      // Fallback: check if we can determine from config
      const stepIndex = this.config.steps.findIndex(step => 
        window.location.pathname.includes(step.file)
      );
      this.currentStep = stepIndex >= 0 ? stepIndex + 1 : 1;
    }

    // Ensure valid step number
    if (this.currentStep < 1) this.currentStep = 1;
    if (this.currentStep > this.totalSteps) this.currentStep = this.totalSteps;
  }

  /**
   * Setup navigation HTML if not present
   */
  setupNavigation() {
    this.injectNavigationHTML();
    this.updateProgressDisplay();
    this.updateNavigationButtons();
    this.setupEventListeners();
  }

  /**
   * Inject navigation HTML into the page
   */
  injectNavigationHTML() {
    // Check if navigation already exists
    if (document.querySelector('.step-progress')) return;

    const lesson = document.querySelector('.lesson') || document.querySelector('main') || document.body;
    
    // Progress indicator
    const progressHTML = `
      <div class="step-progress">
        <div class="step-progress__bar">
          <div class="step-progress__fill" id="progressFill"></div>
        </div>
        <div class="step-progress__info">
          <span class="step-progress__current" id="currentStep">${this.currentStep}</span>
          <span class="step-progress__separator">/</span>
          <span class="step-progress__total">${this.totalSteps}</span>
        </div>
      </div>
    `;

    // Navigation controls
    const navigationHTML = `
      <nav class="lesson-navigation" aria-label="Schritt Navigation">
        <button id="prevBtn" type="button" class="btn btn--ghost lesson-nav-btn">
          ← Zurück
        </button>
        <button id="nextBtn" type="button" class="btn btn--primary lesson-nav-btn">
          Weiter →
        </button>
      </nav>
    `;

    // Insert progress at the beginning
    if (lesson.firstChild) {
      lesson.insertAdjacentHTML('afterbegin', progressHTML);
    } else {
      lesson.innerHTML = progressHTML + lesson.innerHTML;
    }

    // Insert navigation at the end
    lesson.insertAdjacentHTML('beforeend', navigationHTML);
  }

  /**
   * Setup event listeners for navigation
   */
  setupEventListeners() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.goToPreviousStep());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.goToNextStep());
    }
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Don't interfere with form inputs, modifiers, or when translation menu is open
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || 
          e.target.tagName === 'SELECT' || e.altKey || e.ctrlKey || e.metaKey) {
        return;
      }

      // Don't interfere if translation panel is open
      const translationPanel = document.getElementById('translationPanel');
      if (translationPanel && translationPanel.classList.contains('open')) {
        return;
      }

      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');

      if (e.key === 'ArrowLeft' && prevBtn && !prevBtn.disabled) {
        e.preventDefault();
        this.goToPreviousStep();
      } else if (e.key === 'ArrowRight' && nextBtn && !nextBtn.disabled) {
        e.preventDefault();
        this.goToNextStep();
      }
    });
  }

  /**
   * Go to previous step
   */
  goToPreviousStep() {
    if (this.currentStep > 1) {
      const prevStep = this.currentStep - 1;
      const targetFile = this.config.steps[prevStep - 1].file;
      this.navigateToStep(targetFile, prevStep);
    }
  }

  /**
   * Go to next step
   */
  goToNextStep() {
    if (this.currentStep < this.totalSteps) {
      const nextStep = this.currentStep + 1;
      const targetFile = this.config.steps[nextStep - 1].file;
      this.navigateToStep(targetFile, nextStep);
    } else {
      // Last step completed
      this.onLessonCompleted();
    }
  }

  /**
   * Navigate to a specific step
   */
  navigateToStep(targetFile, stepNumber) {
    // Store progress
    this.saveProgress(stepNumber);
    
    // Emit navigation event
    this.emitNavigationEvent('step_change', {
      from: this.currentStep,
      to: stepNumber,
      file: targetFile
    });

    // Navigate to the file
    const currentDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    window.location.href = currentDir + targetFile;
  }

  /**
   * Update progress display
   */
  updateProgressDisplay() {
    const progressFill = document.getElementById('progressFill');
    const currentStepEl = document.getElementById('currentStep');

    if (progressFill) {
      const progressPercentage = (this.currentStep / this.totalSteps) * 100;
      progressFill.style.width = `${progressPercentage}%`;
      progressFill.setAttribute('data-step', this.currentStep);
    }

    if (currentStepEl) {
      currentStepEl.textContent = this.currentStep;
    }
  }

  /**
   * Update navigation button states
   */
  updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
      prevBtn.disabled = this.currentStep === 1;
      prevBtn.style.visibility = this.currentStep === 1 ? 'hidden' : 'visible';
    }

    if (nextBtn) {
      if (this.currentStep === this.totalSteps) {
        nextBtn.textContent = 'Abgeschlossen ✓';
        nextBtn.classList.add('btn--accent');
        nextBtn.classList.remove('btn--primary');
      } else {
        nextBtn.textContent = 'Weiter →';
        nextBtn.classList.add('btn--primary');
        nextBtn.classList.remove('btn--accent');
      }
    }
  }

  /**
   * Setup translation integration
   */
  setupTranslations() {
    // Add navigation elements to translatable elements
    if (window.getTranslatableElements) {
      const originalGetTranslatableElements = window.getTranslatableElements;
      window.getTranslatableElements = () => {
        const originalElements = originalGetTranslatableElements ? originalGetTranslatableElements() : [];
        const navElements = this.getNavigationTranslatableElements();
        return [...originalElements, ...navElements];
      };
    }

    // Update translations when language changes
    document.addEventListener('languageChanged', (e) => {
      this.updateNavigationTranslations(e.detail.language);
    });
  }

  /**
   * Get navigation elements for translation
   */
  getNavigationTranslatableElements() {
    const elements = [];
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn && prevBtn.textContent.trim()) {
      elements.push({ element: prevBtn, text: prevBtn.textContent.trim() });
    }

    if (nextBtn && nextBtn.textContent.trim()) {
      elements.push({ element: nextBtn, text: nextBtn.textContent.trim() });
    }

    return elements;
  }

  /**
   * Update navigation translations
   */
  updateNavigationTranslations(language) {
    if (!window.TRANSLATIONS || !language) return;

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn && window.TRANSLATIONS['← Zurück']) {
      const translation = window.TRANSLATIONS['← Zurück'][language];
      if (translation) {
        prevBtn.textContent = translation;
      }
    }

    if (nextBtn) {
      if (this.currentStep === this.totalSteps && window.TRANSLATIONS['Abgeschlossen ✓']) {
        const translation = window.TRANSLATIONS['Abgeschlossen ✓'][language];
        if (translation) {
          nextBtn.textContent = translation;
        }
      } else if (window.TRANSLATIONS['Weiter →']) {
        const translation = window.TRANSLATIONS['Weiter →'][language];
        if (translation) {
          nextBtn.textContent = translation;
        }
      }
    }
  }

  /**
   * Save progress to localStorage
   */
  saveProgress(stepNumber) {
    const progressKey = `progress_${this.config.level}_${this.config.unit}`;
    const progress = {
      currentStep: stepNumber,
      totalSteps: this.totalSteps,
      lastAccessed: new Date().toISOString(),
      completed: stepNumber === this.totalSteps
    };
    localStorage.setItem(progressKey, JSON.stringify(progress));
  }

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    const progressKey = `progress_${this.config.level}_${this.config.unit}`;
    const saved = localStorage.getItem(progressKey);
    return saved ? JSON.parse(saved) : null;
  }

  /**
   * Handle lesson completion
   */
  onLessonCompleted() {
    this.saveProgress(this.totalSteps);
    this.emitNavigationEvent('lesson_completed', {
      level: this.config.level,
      unit: this.config.unit,
      totalSteps: this.totalSteps
    });

    // Could redirect to next unit or show completion message
    console.log('Lesson completed!');
  }

  /**
   * Emit navigation events for analytics/tracking
   */
  emitNavigationEvent(eventType, data) {
    const event = new CustomEvent('universalNavigation', {
      detail: {
        type: eventType,
        timestamp: new Date().toISOString(),
        level: this.config?.level,
        unit: this.config?.unit,
        ...data
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Resolve URL relative to current file
   */
  resolveUrl(relativePath) {
    const currentDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    return currentDir + relativePath;
  }

  /**
   * Public API methods
   */
  getCurrentStep() {
    return this.currentStep;
  }

  getTotalSteps() {
    return this.totalSteps;
  }

  getConfig() {
    return this.config;
  }

  isFirstStep() {
    return this.currentStep === 1;
  }

  isLastStep() {
    return this.currentStep === this.totalSteps;
  }
}

// Initialize universal navigation
const universalNav = new UniversalNavigation();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => universalNav.init());
} else {
  universalNav.init();
}

// Expose to global scope
window.UniversalNavigation = UniversalNavigation;
window.universalNav = universalNav;
