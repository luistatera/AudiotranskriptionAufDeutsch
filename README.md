# German Language Learning App

A comprehensive, multi-language German learning application featuring interactive lessons, audio exercises, and a robust translation system supporting 12 languages.

## 🌟 Features

- **Interactive Lessons**: Audio, images, dialogs, and quizzes
- **Multi-Language Support**: 12 languages with real-time translations
- **Responsive Design**: Works on desktop and mobile devices
- **Modular Architecture**: Clean separation of frontend and backend
- **Translation System**: Non-intrusive burger menu with persistent preferences
- **Audio Management**: Comprehensive audio playback with error handling
- **Progressive Learning**: Organized by levels (A2.1, B1, etc.) and units

## 🏗️ Project Structure

```
AudiotranskriptionAufDeutsch/
├── app/
│   ├── frontend/           # Frontend application
│   │   ├── A2.1/          # Level A2.1 lessons
│   │   │   └── Unit1/     # Individual lesson units
│   │   │       ├── audio/ # Lesson audio files
│   │   │       ├── img/   # Lesson images
│   │   │       ├── dialogs/ # Dialog content
│   │   │       ├── LA2.1.1.html # Main lesson file
│   │   │       ├── lesson.css   # Lesson styles
│   │   │       ├── lesson.js    # Lesson functionality
│   │   │       └── translations.js # Translation data
│   │   ├── index.html     # Main app entry
│   │   ├── script.js      # Global app logic
│   │   └── styles.css     # Global styles
│   └── backend/           # Backend services
│       ├── main.py        # FastAPI application
│       └── requirements.txt # Python dependencies
├── docs/                  # Documentation
│   ├── translation-system.md # Translation system docs
│   ├── lesson-template.md    # Lesson creation guide
│   ├── code-style-examples.md # Code examples
│   └── notes.md             # Development notes
├── material/              # Source content and specifications
├── .cursorrules          # Cursor IDE development rules
├── CONTRIBUTING.md       # Development guidelines
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites

- **Frontend**: Modern web browser with JavaScript enabled
- **Backend**: Python 3.8+, pip
- **Development**: Git, text editor with language support

### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd AudiotranskriptionAufDeutsch
   ```

2. **Backend Setup** (Optional)
   ```bash
   cd app/backend
   pip install -r requirements.txt
   python main.py
   ```

3. **Frontend Setup**
   ```bash
   cd app/frontend
   # Open index.html in browser or use live server
   open index.html
   ```

4. **Start Learning**
   - Navigate to a lesson (e.g., `A2.1/Unit1/LA2.1.1.html`)
   - Click the hamburger menu (☰) to select your language
   - Follow the interactive exercises

## 🌍 Translation System

### Supported Languages

| Language | Code | Flag | Native Name |
|----------|------|------|-------------|
| English | `en` | 🇬🇧 | English |
| Polish | `pl` | 🇵🇱 | Polski |
| Russian | `ru` | 🇷🇺 | Русский |
| French | `fr` | 🇫🇷 | Français |
| Italian | `it` | 🇮🇹 | Italiano |
| Dutch | `nl` | 🇳🇱 | Nederlands |
| Spanish | `es` | 🇪🇸 | Español |
| Turkish | `tr` | 🇹🇷 | Türkçe |
| Arabic | `ar` | 🌍 | العربية |
| Chinese | `zh` | 🇨🇳 | 中文 |
| Portuguese | `pt` | 🇧🇷 | Português |

### How It Works

1. **Access Translations**: Click the hamburger menu (☰) in any lesson
2. **Select Language**: Choose your preferred language from the dropdown
3. **View Translations**: Translations appear below German text in italics
4. **Persistent Selection**: Your choice is saved for future visits

## 📚 Creating New Lessons

### Quick Guide

1. **Copy Template**
   ```bash
   cp -r app/frontend/A2.1/Unit1/ app/frontend/A2.1/Unit[N]/
   ```

2. **Update Content**
   - Modify HTML with new lesson content
   - Add/replace audio and image files
   - Update dialog markdown files

3. **Add Translations**
   ```javascript
   // In translations.js
   "New German text": {
     en: "English translation",
     pl: "Polish translation",
     // ... all 12 languages
   }
   ```

4. **Test Integration**
   - Verify burger menu functionality
   - Test all interactive elements
   - Check responsive design

For detailed instructions, see [Lesson Template Guide](docs/lesson-template.md).

## 🛠️ Development Guidelines

### Code Quality Standards

- **Modular**: Keep components independent and reusable
- **Documented**: Comment complex logic and public APIs
- **Accessible**: Follow ARIA guidelines and semantic HTML
- **Responsive**: Mobile-first design approach
- **Performant**: Optimize images, audio, and JavaScript

### File Naming Conventions

- **Audio**: `LA[Level].[Unit].[Exercise].mp3`
- **Images**: `descriptive-name.png/jpg/webp`
- **Dialogs**: `dialog[number].md`
- **CSS Classes**: BEM methodology (`.block__element--modifier`)

### Translation Requirements

- **Complete Coverage**: All user-facing text must be translatable
- **Quality**: Professional, contextually appropriate translations
- **Consistency**: Use established translation patterns
- **Testing**: Verify display across all 12 languages

For comprehensive guidelines, see:
- [Cursor Rules](.cursorrules) - Complete development standards
- [Contributing Guide](CONTRIBUTING.md) - Development workflow
- [Code Style Examples](docs/code-style-examples.md) - Best practices

## 🧪 Testing

### Manual Testing Checklist

- [ ] **Audio Playback**: All audio files load and play
- [ ] **Image Loading**: All images display correctly
- [ ] **Translation System**: Burger menu and language switching
- [ ] **Responsive Design**: Mobile and desktop compatibility
- [ ] **Interactive Elements**: Quizzes, speaking exercises
- [ ] **Navigation**: Lesson-to-lesson flow
- [ ] **Performance**: Page load times under 3 seconds

### Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📖 Documentation

- **[Translation System](docs/translation-system.md)**: Complete translation system documentation
- **[Lesson Templates](docs/lesson-template.md)**: Templates for creating new lessons
- **[Code Examples](docs/code-style-examples.md)**: Best practices and patterns
- **[Development Notes](docs/notes.md)**: Project notes and decisions

## 🔧 Technical Architecture

### Frontend

- **HTML5**: Semantic structure with accessibility features
- **CSS3**: BEM methodology with CSS custom properties
- **JavaScript ES6+**: Modern syntax with proper error handling
- **Translation System**: Dynamic content translation with localStorage

### Backend (Optional)

- **FastAPI**: Python web framework for API services
- **RESTful APIs**: Standard HTTP methods and status codes
- **Type Hints**: Comprehensive type annotations
- **Error Handling**: Structured error responses

### Asset Management

- **Audio**: MP3 format, optimized for web delivery
- **Images**: WebP preferred, PNG/JPG acceptable
- **Dialogs**: Markdown format with metadata
- **Translations**: JavaScript objects with 12-language support

## 📈 Performance Considerations

- **Lazy Loading**: Non-critical resources loaded as needed
- **Caching**: Translation data cached in localStorage
- **Optimization**: Images and audio compressed for web
- **Responsive**: Mobile-first approach with progressive enhancement

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for:

- Development setup instructions
- Code style guidelines
- Translation requirements
- Pull request process
- Testing procedures

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch
3. Follow the [Cursor Rules](.cursorrules)
4. Add/update translations for all languages
5. Test thoroughly across browsers
6. Submit a pull request

## 📄 License

[Add your license information here]

## 🆘 Support

- **Issues**: Create GitHub issues for bugs or feature requests
- **Documentation**: Check the `docs/` directory for detailed guides
- **Code Style**: Follow the examples in `docs/code-style-examples.md`

---

**Built with ❤️ for German language learners worldwide**

*This project follows modern software engineering practices with a focus on maintainability, accessibility, and user experience.*