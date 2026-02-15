const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - Exposes safe IPC API to renderer process
 *
 * This script runs in a privileged context with access to Node.js APIs,
 * but exposes only a limited, safe API to the renderer process via contextBridge.
 *
 * See contracts/ipc-contract.md for complete IPC API specification.
 */

// Expose electronAPI to renderer process via window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  // ===== Main → Renderer Messages (receive) =====

  /**
   * Listen for file change notifications
   * @param {Function} callback - Called with {type, path, relativePath, timestamp}
   */
  onFileChanged: (callback) => {
    ipcRenderer.on('file-changed', (event, data) => callback(data));
  },

  /**
   * Listen for Python server error notifications
   * @param {Function} callback - Called with {type, message, severity, canRestart}
   */
  onPythonServerError: (callback) => {
    ipcRenderer.on('python-server-error', (event, data) => callback(data));
  },

  /**
   * Listen for project loaded notifications
   * @param {Function} callback - Called with {type, path, name, featureCount}
   */
  onProjectLoaded: (callback) => {
    ipcRenderer.on('project-loaded', (event, data) => callback(data));
  },

  /**
   * Listen for save file command (from Cmd/Ctrl+S shortcut)
   * @param {Function} callback - Called when save shortcut is triggered
   */
  onSaveFile: (callback) => {
    ipcRenderer.on('save-file', (event) => callback());
  },

  // ===== Renderer → Main Messages (send/invoke) =====

  /**
   * Request native folder picker dialog
   * @returns {Promise<{canceled: boolean, path?: string}>}
   */
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),

  /**
   * Switch to a different project directory
   * @param {string} projectPath - Absolute path to specs directory
   * @returns {Promise<{success: boolean, projectName?: string, featureCount?: number, error?: string, reason?: string}>}
   */
  switchProject: (projectPath) => ipcRenderer.invoke('switch-project', projectPath),

  /**
   * Save application preferences
   * @param {Object} preferences - Partial preferences to save
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  savePreferences: (preferences) => ipcRenderer.invoke('save-preferences', preferences),

  /**
   * Restart the Python backend server
   * @returns {Promise<{success: boolean, port?: number, error?: string}>}
   */
  restartPythonServer: () => ipcRenderer.invoke('restart-python-server'),

  /**
   * Reveal file in native file manager (Finder/Explorer)
   * @param {string} path - Absolute path to file
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  showInFinder: (path) => ipcRenderer.invoke('show-in-finder', path),

  /**
   * Get application metadata
   * @returns {Promise<{version, electronVersion, nodeVersion, pythonVersion, platform, logPath}>}
   */
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
});
