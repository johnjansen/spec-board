const Store = require('electron-store');

/**
 * Application preferences module
 *
 * Uses electron-store for persistent key-value storage.
 * Storage location:
 * - macOS: ~/Library/Application Support/spec-board-desktop/config.json
 * - Windows: %APPDATA%\spec-board-desktop\config.json
 * - Linux: ~/.config/spec-board-desktop/config.json
 */

// Define preferences schema
const schema = {
  currentProjectPath: {
    type: 'string',
    description: 'Absolute path to currently loaded specs directory'
  },
  lastProjectPath: {
    type: 'string',
    description: 'Absolute path to last opened specs directory'
  },
  recentProjects: {
    type: 'array',
    description: 'List of recently opened projects (max 5)',
    items: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute path to specs directory'
        },
        name: {
          type: 'string',
          description: 'Project name (derived from parent directory)'
        },
        lastAccessed: {
          type: 'number',
          description: 'Timestamp (ms) of last access'
        }
      },
      required: ['path', 'name', 'lastAccessed']
    },
    default: []
  },
  windowBounds: {
    type: 'object',
    properties: {
      width: {
        type: 'number',
        minimum: 800,
        maximum: 3840,
        default: 1200
      },
      height: {
        type: 'number',
        minimum: 600,
        maximum: 2160,
        default: 800
      },
      x: {
        type: 'number'
      },
      y: {
        type: 'number'
      }
    },
    default: {
      width: 1200,
      height: 800
    }
  },
  windowState: {
    type: 'string',
    enum: ['normal', 'maximized', 'fullscreen'],
    default: 'normal'
  }
};

// Initialize store with schema
const store = new Store({ schema });

/**
 * Preferences manager
 */
class Preferences {
  constructor() {
    this.store = store;
  }

  /**
   * Get a preference value
   * @param {string} key - Preference key (e.g., 'lastProjectPath', 'windowBounds')
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Preference value
   */
  get(key, defaultValue = undefined) {
    return this.store.get(key, defaultValue);
  }

  /**
   * Set a preference value
   * @param {string} key - Preference key
   * @param {*} value - Value to set
   */
  set(key, value) {
    this.store.set(key, value);
  }

  /**
   * Check if a preference key exists
   * @param {string} key - Preference key
   * @returns {boolean} True if key exists
   */
  has(key) {
    return this.store.has(key);
  }

  /**
   * Delete a preference
   * @param {string} key - Preference key to delete
   */
  delete(key) {
    this.store.delete(key);
  }

  /**
   * Clear all preferences (reset to defaults)
   */
  clear() {
    this.store.clear();
  }

  /**
   * Get all preferences
   * @returns {Object} All preferences
   */
  getAll() {
    return this.store.store;
  }

  /**
   * Get the file path where preferences are stored
   * @returns {string} Absolute path to config file
   */
  getPath() {
    return this.store.path;
  }

  /**
   * T018: Update recent projects list
   * Adds a project to the top of the list, removes duplicates, and limits to 5 entries
   * @param {string} projectPath - Absolute path to specs directory
   * @param {string} projectName - Project name
   */
  updateRecentProjects(projectPath, projectName) {
    // Get current recent projects list
    let recentProjects = this.get('recentProjects', []);

    // Create new project entry
    const newEntry = {
      path: projectPath,
      name: projectName,
      lastAccessed: Date.now()
    };

    // Remove any existing entry with the same path (case-insensitive comparison)
    recentProjects = recentProjects.filter(
      project => project.path.toLowerCase() !== projectPath.toLowerCase()
    );

    // Add new entry at the beginning (most recent first)
    recentProjects.unshift(newEntry);

    // Limit to 5 entries
    if (recentProjects.length > 5) {
      recentProjects = recentProjects.slice(0, 5);
    }

    // Save updated list
    this.set('recentProjects', recentProjects);
  }

  /**
   * Get recent projects list
   * @returns {Array} Recent projects list
   */
  getRecentProjects() {
    return this.get('recentProjects', []);
  }
}

module.exports = Preferences;
