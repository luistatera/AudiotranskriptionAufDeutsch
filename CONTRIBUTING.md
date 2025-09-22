# Contributing to German Language Learning App

## Overview

This document provides practical guidelines for contributing to the German language learning application. Please read the [Cursor Rules](.cursorrules) for comprehensive development standards.

## Getting Started

### Prerequisites
- **Frontend**: Basic HTML, CSS, JavaScript knowledge
- **Backend**: Python 3.8+, FastAPI framework
- **Translation**: Understanding of the 12 supported languages
- **Tools**: Git, modern web browser, text editor with language support

### Development Setup

1. **Clone and Navigate**
   ```bash
   git clone <repository-url>
   cd AudiotranskriptionAufDeutsch
   ```

2. **Backend Setup**
   ```bash
   cd app/backend
   pip install -r requirements.txt
   python main.py
   ```

3. **Frontend Setup**
   ```bash
   cd app/frontend
   # Open index.html in browser or use live server
   ```

## Creating New Lessons

### 1. Directory Structure Setup

Create a new unit following this structure:
```
app/frontend/A2.1/Unit[N]/
├── audio/                 # All audio files for this unit
├── img/                   # All images for this unit
│   └── [Character]/       # Character-specific images if needed
├── dialogs/               # Dialog markdown files
├── LA2.1.[N].html        # Main lesson page
├── lesson.css            # Unit-specific styles
├── lesson.js             # Unit functionality
└── translations.js       # All translations for this unit
```

### 2. Copy Lesson Template

```bash
# Copy from existing unit
cp -r app/frontend/A2.1/Unit1/ app/frontend/A2.1/Unit[N]/
```

### 3. Update Content

1. **HTML File (`LA2.1.[N].html`)**
   - Update lesson title and subtitle
   - Replace dialog content
   - Update quiz questions
   - Ensure burger menu is included

2. **JavaScript (`lesson.js`)**
   - Update audio file references
   - Modify quiz logic if needed
   - Ensure translation system integration

3. **Translations (`translations.js`)**
   - Add all German text as keys
   - Provide translations for all 12 languages
   - Test translation display

4. **Assets**
   - Add audio files with proper naming: `LA2.1.[N].[exercise].mp3`
   - Add optimized images
   - Create dialog files in markdown format

## Translation Guidelines

### Adding New Content Translations

1. **Identify All Text**
   Extract every piece of German text that users will see:
   - Lesson titles and subtitles
   - Dialog content
   - Quiz questions and answer options
   - Instructions and button labels
   - Error messages and feedback

2. **Update translations.js**
   ```javascript
   window.TRANSLATIONS = {
     "Existing content...": { /* existing translations */ },
     
     // Add new content
     "New German text": {
       en: "English translation",
       pl: "Polish translation",
       ru: "Russian translation",
       fr: "French translation",
       it: "Italian translation",
       nl: "Dutch translation",
       es: "Spanish translation",
       tr: "Turkish translation",
       ar: "Arabic translation",
       zh: "Chinese translation",
       pt: "Portuguese translation"
     }
   };
   ```

3. **Translation Quality Standards**
   - Use natural, conversational language
   - Maintain educational tone
   - Consider cultural context
   - Verify accuracy with native speakers when possible

### Language-Specific Considerations

- **Arabic**: Right-to-left text support is automatically handled
- **Chinese**: Use simplified Chinese characters
- **Portuguese**: Use Brazilian Portuguese variant
- **Spanish**: Use neutral Spanish without regional dialects

## Code Style Guide

### HTML Best Practices

```html
<!-- ✅ Good: Semantic structure with consistent classes -->
<section class="lesson__content">
  <h1 class="lesson__title">Lesson Title</h1>
  <div class="dialogue">
    <p class="dialogue__speaker">Speaker:</p>
    <p class="dialogue__text">Dialog text here</p>
  </div>
</section>

<!-- ❌ Bad: Generic divs without semantic meaning -->
<div class="content">
  <div class="title">Lesson Title</div>
  <div class="text">Dialog text here</div>
</div>
```

### CSS Best Practices

```css
/* ✅ Good: BEM methodology with clear hierarchy */
.lesson__title {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.dialogue__speaker {
  font-weight: bold;
  color: var(--speaker-color);
}

.dialogue__text {
  margin-left: 1rem;
  line-height: 1.6;
}

/* ❌ Bad: Generic selectors and inconsistent naming */
.title {
  font-size: 32px;
  color: #333;
}

.text {
  margin-left: 16px;
}
```

### JavaScript Best Practices

```javascript
// ✅ Good: Modern syntax with proper error handling
const playAudio = async (audioPath) => {
  try {
    const audio = new Audio(audioPath);
    await audio.play();
    
    audio.addEventListener('ended', () => {
      console.log('Audio playback completed');
    });
  } catch (error) {
    console.error('Failed to play audio:', error);
    showUserFriendlyError('Audio playback failed');
  }
};

// ✅ Good: Modular function with clear purpose
const initializeTranslationSystem = () => {
  const languageSelect = document.getElementById('languageSelect');
  const savedLanguage = localStorage.getItem('selectedLanguage');
  
  if (savedLanguage && languageSelect) {
    languageSelect.value = savedLanguage;
    showTranslations(savedLanguage);
  }
};

// ❌ Bad: Global variables and no error handling
var audioElement;
function playSound(src) {
  audioElement = new Audio(src);
  audioElement.play();
}
```

## Testing Guidelines

### Manual Testing Checklist

Before submitting any lesson:

- [ ] **Audio Playback**: All audio files load and play correctly
- [ ] **Image Loading**: All images display properly across browsers
- [ ] **Translation System**: Burger menu opens, all languages work
- [ ] **Responsive Design**: Lesson works on mobile and desktop
- [ ] **Quiz Functionality**: All interactive elements respond correctly
- [ ] **Error Handling**: Graceful handling of missing assets
- [ ] **Performance**: Page loads within 3 seconds on average connection

### Browser Testing

Test on these minimum browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Translation Testing

1. Test each language selection
2. Verify text displays correctly (no overflow, proper spacing)
3. Check character encoding (especially for Arabic, Chinese)
4. Ensure translations make sense in context

## File Naming Conventions

### Audio Files
```
LA[Level].[Unit].[Exercise].mp3
Examples:
- LA2.1.1.mp3 (Level A2.1, Unit 1, Exercise 1)
- LA2.1.2.mp3 (Level A2.1, Unit 1, Exercise 2)
```

### Image Files
```
[descriptive-name].png/jpg/webp
Examples:
- german-class.png
- people-cooking.jpg
- character-frida-cooking.png
```

### Dialog Files
```
dialog[number].md
Examples:
- dialog1.md
- dialog2.md
```

## Git Workflow

### Commit Message Format

Use conventional commits:
```
<type>(<scope>): <description>

feat(lesson): add Unit 3 with cooking vocabulary
fix(translation): correct French translation for "kitchen"
docs(readme): update setup instructions
style(css): improve responsive design for mobile
```

### Branch Naming
```
feature/unit-[number]-[description]
fix/translation-[language]-[issue]
docs/update-[documentation-type]

Examples:
- feature/unit-4-restaurant-vocabulary
- fix/translation-arabic-text-direction
- docs/update-contributing-guide
```

### Pull Request Process

1. Create feature branch from main
2. Make changes following these guidelines
3. Test thoroughly (see testing checklist)
4. Update documentation if needed
5. Submit PR with descriptive title and description
6. Request review from team members

## Common Issues and Solutions

### Translation System Not Working
```javascript
// Check if translations are loaded
console.log('Translations loaded:', !!window.TRANSLATIONS);

// Check specific translation
console.log('Translation exists:', window.TRANSLATIONS['German text']);

// Verify language selection
console.log('Selected language:', localStorage.getItem('selectedLanguage'));
```

### Audio Not Playing
```javascript
// Check file path
const audioPath = 'audio/LA2.1.1.mp3';
console.log('Audio path:', audioPath);

// Test with absolute path
const audio = new Audio(`${window.location.origin}/path/to/audio.mp3`);
```

### Images Not Loading
- Verify file path and capitalization
- Check image optimization (file size < 1MB recommended)
- Ensure proper alt text for accessibility

## Performance Guidelines

### Image Optimization
- Use WebP format when possible
- Compress images to reasonable file sizes
- Use appropriate dimensions (don't load 4K images for thumbnails)

### Audio Optimization
- Keep audio files under 5MB
- Use MP3 format for compatibility
- Consider audio compression for longer clips

### JavaScript Performance
- Minimize DOM queries (cache selectors)
- Use event delegation for multiple similar elements
- Lazy load non-critical resources

## Documentation Requirements

### Code Documentation
```javascript
/**
 * Plays audio file and handles playback events
 * @param {string} audioPath - Path to the audio file
 * @param {Function} onComplete - Callback when playback finishes
 * @returns {Promise<void>}
 */
const playAudio = async (audioPath, onComplete) => {
  // Implementation...
};
```

### Lesson Documentation
Each lesson should include:
- Learning objectives
- Vocabulary list
- Grammar points covered
- Exercise difficulty level
- Teacher notes (if applicable)

## Getting Help

### Resources
- [Cursor Rules](.cursorrules) - Complete development standards
- [Translation System Documentation](docs/translation-system.md)
- [Project Notes](docs/notes.md)

### Contact
- Create GitHub issue for bugs or feature requests
- Use pull request discussions for code review questions
- Check existing documentation before asking questions

---

**Remember**: Quality over quantity. It's better to create one well-structured, fully-translated lesson than multiple incomplete ones.
