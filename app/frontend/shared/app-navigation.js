/**
 * Global App Navigation Configuration
 * Defines the complete structure of levels, units, and steps
 */

window.APP_NAVIGATION = {
  levels: [
    {
      id: "A1.2",
      title: "A1.2",
      description: "Beginner Level 2",
      path: "A1.2",
      status: "coming_soon",
      units: [
        {
          id: "Unit1",
          title: "Unit 1",
          description: "Coming soon",
          path: "A1.2/Unit1",
          status: "coming_soon"
        }
      ]
    },
    {
      id: "A2.1", 
      title: "A2.1",
      description: "Elementary Level 1",
      path: "A2.1",
      status: "active",
      units: [
        {
          id: "Unit1",
          title: "Unit 1",
          description: "Kochen mit Freunden",
          path: "A2.1/Unit1",
          status: "active",
          startFile: "step1.html"
        },
        {
          id: "Unit2", 
          title: "Unit 2",
          description: "Coming soon",
          path: "A2.1/Unit2",
          status: "coming_soon",
          startFile: "step1.html"
        }
      ]
    },
    {
      id: "A2.2",
      title: "A2.2", 
      description: "Elementary Level 2",
      path: "A2.2",
      status: "coming_soon",
      units: [
        {
          id: "Unit1",
          title: "Unit 1", 
          description: "Coming soon",
          path: "A2.2/Unit1",
          status: "coming_soon"
        }
      ]
    }
  ],

  /**
   * Get current level and unit from current path
   */
  getCurrentLocation() {
    const path = window.location.pathname;
    const pathParts = path.split('/');
    
    // Find level (A2.1, A2.2, etc.)
    const levelMatch = pathParts.find(part => /^A\d+\.\d+$/.test(part));
    
    // Find unit (Unit1, Unit2, etc.)
    const unitMatch = pathParts.find(part => /^Unit\d+$/.test(part));
    
    return {
      level: levelMatch || null,
      unit: unitMatch || null,
      isActive: !!(levelMatch && unitMatch)
    };
  },

  /**
   * Get level configuration by ID
   */
  getLevel(levelId) {
    return this.levels.find(level => level.id === levelId);
  },

  /**
   * Get unit configuration by level and unit ID
   */
  getUnit(levelId, unitId) {
    const level = this.getLevel(levelId);
    if (!level) return null;
    return level.units.find(unit => unit.id === unitId);
  },

  /**
   * Get navigation URL for a unit
   */
  getUnitUrl(levelId, unitId) {
    const unit = this.getUnit(levelId, unitId);
    if (!unit || unit.status === 'coming_soon') return null;
    
    // Calculate relative path from current location to target
    const currentPath = window.location.pathname;
    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    
    // If we're already in the right level, use relative path
    if (currentPath.includes(`/${levelId}/`)) {
      return `../${unitId}/${unit.startFile || 'step1.html'}`;
    } else {
      // Otherwise use absolute path from frontend root
      return `../${unit.path}/${unit.startFile || 'step1.html'}`;
    }
  },

  /**
   * Check if user can access a unit
   */
  canAccessUnit(levelId, unitId) {
    const unit = this.getUnit(levelId, unitId);
    return unit && unit.status === 'active';
  }
};
