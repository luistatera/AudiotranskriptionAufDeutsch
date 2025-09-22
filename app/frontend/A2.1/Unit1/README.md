# A2.1 Unit 1: Scalable Step-based Structure

This unit demonstrates a scalable, step-based lesson structure that allows for:
- **Independent step files** for easier development and maintenance
- **Reusable navigation** that works across multiple HTML files
- **Shared components** that can be used throughout the unit
- **Translation system** that works seamlessly across all steps

## 📁 **File Structure**

```
Unit1/
├── step1.html                    # Dialog, image, and comprehension
├── step2.html                    # Speaking practice
├── step3.html                    # Perfect tense exercise
├── step4.html                    # Frida's day ordering exercise
├── shared/
│   ├── navigation.js             # Universal navigation system
│   ├── navigation.css            # Navigation styles
│   ├── translation-menu.js       # Burger menu component
│   └── lesson-common.css         # Common lesson styles
├── unit-config.js                # Unit configuration and metadata
├── lesson.css                    # Unit-specific styles
├── lesson.js                     # Original lesson logic (still used)
├── translations.js               # Translation data
├── audio/                        # Audio files
├── img/                          # Image assets
└── dialogs/                      # Dialog content
```

## 🚀 **How to Use**

### **Starting a Lesson**
1. Navigate to `step1.html` to begin
2. The navigation system automatically detects the current step
3. Progress is tracked and saved in localStorage

### **Adding New Steps**
1. Create a new `stepN.html` file
2. Update `unit-config.js` to include the new step
3. Copy the structure from existing step files
4. Implement step-specific functionality

### **Creating New Units**
1. Copy the entire Unit1 folder structure
2. Update the `unit-config.js` with new unit details
3. Replace content, audio, and images
4. Maintain the same file structure for consistency

## 🎯 **Key Features**

### **Universal Navigation**
- **Automatic Setup**: Injects progress bar and navigation buttons
- **Cross-file Navigation**: Seamlessly moves between step files
- **Progress Tracking**: Saves progress in localStorage
- **Keyboard Support**: Arrow keys for navigation
- **Translation Ready**: All navigation elements are translatable

### **Independent Steps**
- **Focused Content**: Each step handles one specific exercise type
- **Modular Development**: Edit individual steps without affecting others
- **Easy Testing**: Test specific exercises in isolation
- **Scalable**: Add unlimited steps without complexity growth

### **Shared Components**
- **Burger Menu**: Universal translation menu across all steps
- **Common Styles**: Consistent UI/UX throughout the unit
- **Reusable Logic**: Common functionality shared between steps
- **Translation System**: Seamless translation across all content

## 🔧 **Technical Details**

### **Navigation System**
The `UniversalNavigation` class handles:
- Step detection from filename
- Cross-file navigation
- Progress tracking
- Translation integration
- Keyboard navigation

### **Translation Menu**
The `TranslationMenu` class provides:
- Universal burger menu
- Language persistence
- Dynamic content translation
- Event-driven language changes

### **Configuration System**
The `unit-config.js` defines:
- Step metadata and structure
- Audio/image asset mapping
- Navigation settings
- Translation configuration

## 📈 **Benefits**

1. **Scalability**: Easy to add new units, lessons, and steps
2. **Maintainability**: Isolated, focused code per step
3. **Reusability**: Shared components across all lessons
4. **Performance**: Smaller, faster-loading individual files
5. **Development**: Easier testing and debugging
6. **Translation**: Comprehensive multilingual support

## 🎨 **Customization**

### **Adding New Exercise Types**
1. Create step-specific HTML structure
2. Implement exercise logic in the step file
3. Add necessary CSS to `lesson.css`
4. Update translations as needed

### **Styling Changes**
- **Global**: Edit `shared/lesson-common.css`
- **Navigation**: Edit `shared/navigation.css`
- **Unit-specific**: Edit `lesson.css`

### **Navigation Customization**
- **Settings**: Modify `unit-config.js` navigation section
- **Behavior**: Extend `UniversalNavigation` class
- **Styling**: Update `shared/navigation.css`

## 🔄 **Migration Path**

For existing lessons:
1. **Extract content** from monolithic HTML files
2. **Split into logical steps** (dialog, exercises, etc.)
3. **Apply shared component structure**
4. **Test navigation flow**
5. **Verify translation system**

This structure provides a solid foundation for scaling the German learning application to multiple levels, units, and lesson types while maintaining code quality and user experience.
