/**
 * Universal Translation Menu Component
 * Reusable burger menu translation system for all step files
 */

class TranslationMenu {
  constructor() {
    this.currentLanguage = '';
    this.isMenuOpen = false;
    this.elements = {
      burgerBtn: null,
      panel: null,
      overlay: null,
      closeBtn: null,
      languageSelect: null
    };
    this.initialized = false;
  }

  /**
   * Initialize the translation menu
   */
  async init() {
    if (this.initialized) return;

    await this.loadGlobalNavigation();
    this.injectMenuHTML();
    this.bindElements();
    this.setupEventListeners();
    this.setupNavigationHandlers();
    this.populateLevelSelector();
    this.loadLanguagePreference();
    this.updateActiveMenuLinks();
    this.closeMenuOnNavigation();
    this.initialized = true;
    
    console.log('Translation Menu initialized');
  }

  /**
   * Load global navigation configuration
   */
  async loadGlobalNavigation() {
    if (window.APP_NAVIGATION) return;

    try {
      // Try to load from different possible locations
      const possiblePaths = [
        '../../../shared/app-navigation.js',
        '../../shared/app-navigation.js', 
        '../shared/app-navigation.js',
        'shared/app-navigation.js'
      ];

      for (const path of possiblePaths) {
        try {
          const script = document.createElement('script');
          script.src = path;
          document.head.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            setTimeout(reject, 1000); // Timeout after 1 second
          });

          if (window.APP_NAVIGATION) {
            console.log('Global navigation loaded from:', path);
            return;
          }
        } catch (e) {
          // Try next path
          continue;
        }
      }
      
      // Fallback: create minimal navigation config
      console.warn('Could not load global navigation, using fallback');
      this.createFallbackNavigation();
    } catch (error) {
      console.error('Failed to load global navigation:', error);
      this.createFallbackNavigation();
    }
  }

  /**
   * Create fallback navigation when global config fails to load
   */
  createFallbackNavigation() {
    window.APP_NAVIGATION = {
      levels: [
        {
          id: "A2.1",
          title: "A2.1",
          description: "Elementary Level 1",
          status: "active",
          units: [
            {
              id: "Unit1",
              title: "Unit 1",
              description: "Kochen mit Freunden", 
              status: "active",
              startFile: "step1.html"
            },
            {
              id: "Unit2",
              title: "Unit 2", 
              description: "Coming soon",
              status: "coming_soon",
              startFile: "step1.html"
            }
          ]
        }
      ],
      getCurrentLocation: () => ({ level: "A2.1", unit: "Unit1", isActive: true }),
      getLevel: (id) => window.APP_NAVIGATION.levels.find(l => l.id === id),
      getUnit: (levelId, unitId) => {
        const level = window.APP_NAVIGATION.getLevel(levelId);
        return level ? level.units.find(u => u.id === unitId) : null;
      },
      getUnitUrl: (levelId, unitId) => {
        if (levelId === "A2.1" && unitId === "Unit1") return "step1.html";
        return null;
      },
      canAccessUnit: (levelId, unitId) => {
        const unit = window.APP_NAVIGATION.getUnit(levelId, unitId);
        return unit && unit.status === 'active';
      }
    };
  }

  /**
   * Populate the level selector dropdown
   */
  populateLevelSelector() {
    const levelSelect = document.getElementById('levelSelect');
    if (!levelSelect || !window.APP_NAVIGATION) return;

    // Clear existing options except the first one
    const firstOption = levelSelect.firstElementChild;
    levelSelect.innerHTML = '';
    levelSelect.appendChild(firstOption);

    // Add level options
    window.APP_NAVIGATION.levels.forEach(level => {
      const option = document.createElement('option');
      option.value = level.id;
      option.textContent = level.title;
      option.disabled = level.status === 'coming_soon';
      if (level.status === 'coming_soon') {
        option.textContent += ' (Coming Soon)';
      }
      levelSelect.appendChild(option);
    });

    // Set current level as selected
    const currentLocation = window.APP_NAVIGATION.getCurrentLocation();
    if (currentLocation.level) {
      levelSelect.value = currentLocation.level;
      this.showUnitsForLevel(currentLocation.level);
    }
  }

  /**
   * Show units for the selected level
   */
  showUnitsForLevel(levelId) {
    const unitNavigation = document.getElementById('unitNavigation');
    const unitLinks = document.getElementById('unitLinks');
    
    if (!unitNavigation || !unitLinks || !window.APP_NAVIGATION) return;

    const level = window.APP_NAVIGATION.getLevel(levelId);
    if (!level) {
      unitNavigation.style.display = 'none';
      return;
    }

    // Clear existing unit links
    unitLinks.innerHTML = '';

    // Add unit links
    level.units.forEach(unit => {
      const link = document.createElement('a');
      link.className = 'menu-link';
      link.dataset.levelId = levelId;
      link.dataset.unitId = unit.id;
      
      if (unit.status === 'active') {
        const unitUrl = window.APP_NAVIGATION.getUnitUrl(levelId, unit.id);
        if (unitUrl) {
          link.href = unitUrl;
        }
      } else {
        link.classList.add('menu-link--disabled');
        link.addEventListener('click', (e) => e.preventDefault());
      }

      link.innerHTML = `
        <span class="menu-link__icon">${unit.status === 'active' ? '📚' : '🔒'}</span>
        <span class="menu-link__text">${unit.title}${unit.status === 'coming_soon' ? ' (Coming Soon)' : ''}</span>
      `;

      unitLinks.appendChild(link);
    });

    // Show the unit navigation
    unitNavigation.style.display = 'block';
    
    // Update active states and translations
    this.updateActiveUnitLinks();
    setTimeout(() => {
      this.updateMenuTextTranslations();
    }, 10);
  }

  /**
   * Setup navigation event handlers
   */
  setupNavigationHandlers() {
    const levelSelect = document.getElementById('levelSelect');
    if (levelSelect) {
      levelSelect.addEventListener('change', (e) => {
        const selectedLevel = e.target.value;
        if (selectedLevel) {
          this.showUnitsForLevel(selectedLevel);
        } else {
          const unitNavigation = document.getElementById('unitNavigation');
          if (unitNavigation) {
            unitNavigation.style.display = 'none';
          }
        }
      });
    }
  }

  /**
   * Update active unit links based on current location
   */
  updateActiveUnitLinks() {
    if (!window.APP_NAVIGATION) return;
    
    const currentLocation = window.APP_NAVIGATION.getCurrentLocation();
    const unitLinks = document.querySelectorAll('.menu-link[data-unit-id]');
    
    unitLinks.forEach(link => {
      const levelId = link.dataset.levelId;
      const unitId = link.dataset.unitId;
      
      if (levelId === currentLocation.level && unitId === currentLocation.unit) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Inject burger menu HTML if not present
   */
  injectMenuHTML() {
    // Check if menu already exists
    if (document.getElementById('burgerMenuBtn')) return;

    const menuHTML = `
      <!-- Burger Menu Button -->
      <button id="burgerMenuBtn" class="burger-menu-btn" aria-label="Open translation menu">
        <span class="burger-line"></span>
        <span class="burger-line"></span>
        <span class="burger-line"></span>
      </button>

      <!-- Translation Menu Panel -->
      <div id="translationPanel" class="translation-panel">
        <div class="translation-panel__header">
          <h3 class="translation-panel__title">Menu</h3>
          <button id="closePanelBtn" class="close-panel-btn" aria-label="Close menu">&times;</button>
        </div>
        <div class="translation-panel__content">
          <!-- Navigation Section -->
          <div class="menu-section">
            <h4 class="menu-section__title">Navigation</h4>
            
            <!-- Level Selector -->
            <div class="level-selector">
              <label for="levelSelect" class="level-label">Level:</label>
              <select id="levelSelect" class="level-select">
                <option value="">Select Level</option>
              </select>
            </div>

            <!-- Unit Navigation (shown when level selected) -->
            <div class="unit-navigation" id="unitNavigation" style="display: none;">
              <h5 class="unit-navigation__title">Units:</h5>
              <div class="menu-links" id="unitLinks">
                <!-- Units will be populated dynamically -->
              </div>
            </div>
          </div>

          <!-- Translation Section -->
          <div class="menu-section">
            <h4 class="menu-section__title">Translation Settings</h4>
            <label for="languageSelect" class="translation-label">Show translation below the original text:</label>
            <select id="languageSelect" class="language-select">
              <option value="">No</option>
              <option value="pl">Polish 🇵🇱</option>
              <option value="ru">Russian 🇷🇺</option>
              <option value="fr">French 🇫🇷</option>
              <option value="en">English 🇬🇧</option>
              <option value="it">Italian 🇮🇹</option>
              <option value="nl">Dutch 🇳🇱</option>
              <option value="es">Spanish 🇪🇸</option>
              <option value="tr">Turkish 🇹🇷</option>
              <option value="ar">Arabic 🌍</option>
              <option value="zh">Chinese 🇨🇳</option>
              <option value="pt">Portuguese 🇧🇷</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Overlay -->
      <div id="menuOverlay" class="menu-overlay"></div>
    `;

    // Insert at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', menuHTML);
  }

  /**
   * Bind DOM elements
   */
  bindElements() {
    this.elements.burgerBtn = document.getElementById('burgerMenuBtn');
    this.elements.panel = document.getElementById('translationPanel');
    this.elements.overlay = document.getElementById('menuOverlay');
    this.elements.closeBtn = document.getElementById('closePanelBtn');
    this.elements.languageSelect = document.getElementById('languageSelect');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (this.elements.burgerBtn) {
      this.elements.burgerBtn.addEventListener('click', () => this.toggleMenu());
    }

    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', () => this.closeMenu());
    }

    if (this.elements.overlay) {
      this.elements.overlay.addEventListener('click', () => this.closeMenu());
    }

    if (this.elements.languageSelect) {
      this.elements.languageSelect.addEventListener('change', (e) => {
        this.handleLanguageChange(e.target.value);
      });
    }

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMenu();
      }
    });
  }

  /**
   * Toggle burger menu
   */
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    
    if (this.elements.burgerBtn) {
      this.elements.burgerBtn.classList.toggle('open', this.isMenuOpen);
    }
    
    if (this.elements.panel) {
      this.elements.panel.classList.toggle('open', this.isMenuOpen);
    }
    
    if (this.elements.overlay) {
      this.elements.overlay.classList.toggle('active', this.isMenuOpen);
    }

    // Prevent body scroll when menu is open
    document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
  }

  /**
   * Close menu
   */
  closeMenu() {
    if (this.isMenuOpen) {
      this.toggleMenu();
    }
  }

  /**
   * Handle language change
   */
  handleLanguageChange(language) {
    this.currentLanguage = language;
    
    if (language) {
      this.showTranslations(language);
      this.saveLanguagePreference(language);
    } else {
      this.hideTranslations();
      this.saveLanguagePreference('');
    }

    // Update menu translations immediately
    setTimeout(() => {
      this.updateMenuTextTranslations();
    }, 50);

    // Emit language change event
    const event = new CustomEvent('languageChanged', {
      detail: { language: language }
    });
    document.dispatchEvent(event);
  }

  /**
   * Get all translatable elements on the page
   */
  getTranslatableElements() {
    const elements = [];
    
    // Get elements from universal navigation if available
    if (window.universalNav && window.universalNav.getNavigationTranslatableElements) {
      elements.push(...window.universalNav.getNavigationTranslatableElements());
    }

    // Get step-specific translatable elements
    if (window.getTranslatableElements) {
      const stepElements = window.getTranslatableElements();
      elements.push(...stepElements);
    } else {
      // Fallback: collect common translatable elements
      elements.push(...this.getCommonTranslatableElements());
    }

    return elements;
  }

  /**
   * Get common translatable elements (fallback)
   */
  getCommonTranslatableElements() {
    const elements = [];
    
    // Titles and subtitles
    const title = document.querySelector('.lesson__title');
    const subtitle = document.querySelector('.lesson__subtitle');
    if (title) elements.push({ element: title, text: title.textContent.trim() });
    if (subtitle) elements.push({ element: subtitle, text: subtitle.textContent.trim() });

    // Section titles
    const sectionTitles = document.querySelectorAll('.section-title, h2, h3');
    sectionTitles.forEach(title => {
      elements.push({ element: title, text: title.textContent.trim() });
    });

    // Menu elements
    const menuTitle = document.querySelector('.translation-panel__title');
    if (menuTitle) elements.push({ element: menuTitle, text: menuTitle.textContent.trim() });

    const menuSectionTitles = document.querySelectorAll('.menu-section__title');
    menuSectionTitles.forEach(title => {
      elements.push({ element: title, text: title.textContent.trim() });
    });

    // Level selector elements
    const levelLabel = document.querySelector('.level-label');
    if (levelLabel) elements.push({ element: levelLabel, text: levelLabel.textContent.trim() });

    const levelSelect = document.querySelector('.level-select');
    if (levelSelect) {
      const selectOption = levelSelect.querySelector('option[value=""]');
      if (selectOption) elements.push({ element: selectOption, text: selectOption.textContent.trim() });
    }

    // Unit navigation elements
    const unitNavTitle = document.querySelector('.unit-navigation__title');
    if (unitNavTitle) elements.push({ element: unitNavTitle, text: unitNavTitle.textContent.trim() });

    const menuLinkTexts = document.querySelectorAll('.menu-link__text');
    menuLinkTexts.forEach(linkText => {
      // Only translate if it doesn't contain "(Coming Soon)"
      const textContent = linkText.textContent.trim();
      const baseText = textContent.replace(' (Coming Soon)', '');
      if (baseText && baseText !== textContent) {
        // For "Unit X (Coming Soon)" we only translate the "Unit X" part
        elements.push({ element: linkText, text: baseText, isPartial: true });
      } else {
        elements.push({ element: linkText, text: textContent });
      }
    });

    const translationLabel = document.querySelector('.translation-label');
    if (translationLabel) elements.push({ element: translationLabel, text: translationLabel.textContent.trim() });

    // Buttons (including audio controls)
    const buttons = document.querySelectorAll('button:not(#burgerMenuBtn):not(#closePanelBtn)');
    buttons.forEach(btn => {
      const text = btn.textContent.trim();
      if (text) {
        elements.push({ element: btn, text: text });
      }
    });

    // Other common elements
    const captions = document.querySelectorAll('.lesson__caption, figcaption');
    captions.forEach(caption => {
      elements.push({ element: caption, text: caption.textContent.trim() });
    });

    return elements;
  }

  /**
   * Show translations for selected language
   */
  showTranslations(language) {
    // Remove existing translations
    document.querySelectorAll('.translation').forEach(t => t.remove());

    if (!language || !window.TRANSLATIONS) return;

    const elements = this.getTranslatableElements();
    
    elements.forEach(({ element, text, hasStrong, isPlaceholder }) => {
      const translation = window.TRANSLATIONS[text];
      if (translation && translation[language]) {
        if (isPlaceholder) {
          // For placeholder text, update the placeholder attribute
          element.placeholder = element.placeholder + ' / ' + translation[language];
        } else {
          const translationElement = document.createElement('div');
          translationElement.className = 'translation';
          translationElement.textContent = translation[language];

          if (hasStrong) {
            // For dialogue with speaker names, insert after the paragraph
            element.parentNode.insertBefore(translationElement, element.nextSibling);
          } else {
            // For regular elements, append after
            element.appendChild(translationElement);
          }

          // Mark element as translatable for styling
          element.classList.add('translatable');
        }
      }
    });
  }

  /**
   * Hide all translations
   */
  hideTranslations() {
    document.querySelectorAll('.translation').forEach(t => t.remove());
    document.querySelectorAll('.translatable').forEach(el => {
      el.classList.remove('translatable');
    });

    // Reset placeholder text if any
    const placeholders = document.querySelectorAll('[placeholder*="/"]');
    placeholders.forEach(el => {
      const originalPlaceholder = el.placeholder.split(' / ')[0];
      el.placeholder = originalPlaceholder;
    });
  }

  /**
   * Load saved language preference
   */
  loadLanguagePreference() {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && this.elements.languageSelect) {
      this.elements.languageSelect.value = savedLanguage;
      this.currentLanguage = savedLanguage;
      if (savedLanguage) {
        // Delay showing translations to ensure all content is loaded
        setTimeout(() => {
          this.showTranslations(savedLanguage);
        }, 100);
      }
    }
  }

  /**
   * Save language preference
   */
  saveLanguagePreference(language) {
    localStorage.setItem('selectedLanguage', language);
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Set language programmatically
   */
  setLanguage(language) {
    if (this.elements.languageSelect) {
      this.elements.languageSelect.value = language;
      this.handleLanguageChange(language);
    }
  }

  /**
   * Update active menu links based on current page
   */
  updateActiveMenuLinks() {
    this.updateActiveUnitLinks();
    this.updateMenuTextTranslations();
  }

  /**
   * Update menu text translations for current language
   */
  updateMenuTextTranslations() {
    const currentLanguage = this.getCurrentLanguage();
    if (!currentLanguage || !window.TRANSLATIONS) return;

    // Update menu elements that need direct text replacement
    const menuElements = [
      { selector: '.translation-panel__title', key: 'Menu' },
      { selector: '.menu-section__title', key: 'Navigation' },
      { selector: '.level-label', key: 'Level:' },
      { selector: '.level-select option[value=""]', key: 'Select Level' },
      { selector: '.unit-navigation__title', key: 'Units:' },
      { selector: '.translation-label', key: 'Show translation below the original text:' }
    ];

    menuElements.forEach(({ selector, key }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const translation = window.TRANSLATIONS[key];
        if (translation && translation[currentLanguage]) {
          if (!element.dataset.originalText) {
            element.dataset.originalText = element.textContent.trim();
          }
          element.textContent = translation[currentLanguage];
        }
      });
    });

    // Update unit link texts
    const unitLinks = document.querySelectorAll('.menu-link__text');
    unitLinks.forEach(linkText => {
      const textContent = linkText.textContent.trim();
      const baseText = textContent.replace(' (Coming Soon)', '');
      const isComingSoon = textContent.includes('(Coming Soon)');
      
      const translation = window.TRANSLATIONS[baseText];
      if (translation && translation[currentLanguage]) {
        if (!linkText.dataset.originalText) {
          linkText.dataset.originalText = textContent;
        }
        linkText.textContent = translation[currentLanguage] + (isComingSoon ? ' (Coming Soon)' : '');
      }
    });
  }

  /**
   * Close menu when navigating
   */
  closeMenuOnNavigation() {
    // Add click event to menu links to close menu
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        setTimeout(() => {
          this.closeMenu();
        }, 100);
      });
    });
  }
}

// Auto-initialize translation menu
const translationMenu = new TranslationMenu();

// Make it globally accessible
window.translationMenu = translationMenu;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => translationMenu.init());
} else {
  translationMenu.init();
}
