/**
 * Unit Configuration for A2.1 Unit 1
 * Defines the structure, steps, and metadata for this unit
 */

window.UNIT_CONFIG = {
  level: "A2.1",
  unit: "Unit1",
  title: "Kochen mit Freunden",
  description: "Learn about cooking with friends, daily routines, and perfect tense",
  
  steps: [
    {
      id: "step1",
      title: "Kochen mit Freunden",
      description: "Dialog, comprehension, and tasks",
      file: "step1.html",
      sections: ["dialog", "comprehension", "tasks"],
      estimatedTime: "15 min"
    },
    {
      id: "step2", 
      title: "Sprache",
      description: "Speaking practice and oral questions",
      file: "step2.html",
      sections: ["speaking"],
      estimatedTime: "10 min"
    },
    {
      id: "step3",
      title: "🎧 Hören & Ziehen – Perfekt",
      description: "Perfect tense drag and drop exercise",
      file: "step3.html", 
      sections: ["listening", "grammar"],
      estimatedTime: "12 min"
    },
    {
      id: "step4",
      title: "🎧 Frida erzählt ihren Tag",
      description: "Listening comprehension and image ordering",
      file: "step4.html",
      sections: ["listening", "sequencing"],
      estimatedTime: "15 min"
    }
  ],

  // Audio files used in this unit
  audio: {
    main: "audio/LA2.1.1.mp3",
    frida: "audio/LA2.1.2.mp3"
  },

  // Image assets
  images: {
    main: "img/people_cooking.png",
    frida: [
      "img/Frida/01_kaffee.png",
      "img/Frida/02_fahrrad.png", 
      "img/Frida/03_buero.png",
      "img/Frida/04_suppe.png",
      "img/Frida/05_park.png",
      "img/Frida/06_kochen.png"
    ]
  },

  // Dialog files
  dialogs: [
    "dialogs/dialog1.md",
    "dialogs/dialog2.md"
  ],

  // Navigation settings
  navigation: {
    showProgress: true,
    allowSkipping: false, // Students must complete steps in order
    keyboardNavigation: true
  },

  // Translation settings
  translations: {
    file: "translations.js",
    languages: ["en", "pl", "ru", "fr", "it", "nl", "es", "tr", "ar", "zh", "pt"]
  }
};
