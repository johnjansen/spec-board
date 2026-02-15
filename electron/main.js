const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron');
const log = require('electron-log');
const path = require('path');
const Preferences = require('./preferences');
const pythonServer = require('./python-server');
const projectValidator = require('./project-validator');
const fileWatcher = require('./file-watcher');

// Configure electron-log
// Log locations:
// - macOS: ~/Library/Logs/spec-board-desktop/main.log
// - Windows: %USERPROFILE%\AppData\Roaming\spec-board-desktop\logs\main.log
// - Linux: ~/.config/spec-board-desktop/logs/main.log
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.info('Electron app starting...');
log.info(`Log file location: ${log.transports.file.getFile().path}`);

// Global references
let mainWindow = null;
const preferences = new Preferences();
let currentWatcher = null; // T009: Track current file watcher

// T028: Single instance lock
// Ensure only one instance of the application can run at a time
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit this one
  log.info('Another instance is already running, quitting...');
  app.quit();
} else {
  // T029: Handle second instance attempt - focus existing window
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    log.info('Second instance detected, focusing existing window');

    // If we have a window, restore and focus it
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}

/**
 * T009: Start file watcher for project directory
 * @param {string} projectPath - Path to specs directory to watch
 */
async function startProjectWatcher(projectPath) {
  // Stop existing watcher if any
  if (currentWatcher) {
    log.info('Stopping existing file watcher');
    await fileWatcher.stopWatcher(currentWatcher);
    currentWatcher = null;
  }

  // Start new watcher
  log.info(`Starting file watcher for: ${projectPath}`);
  currentWatcher = fileWatcher.createWatcher(
    projectPath,
    // onChange callback
    (filePath, relativePath) => {
      if (mainWindow) {
        mainWindow.webContents.send('file-changed', {
          type: 'file-changed',
          path: filePath,
          relativePath: relativePath,
          timestamp: Date.now()
        });
      }
    },
    // onError callback
    async (error) => {
      log.error(`File watcher error: ${error.message || error}`);

      // T028: Handle project deletion
      if (error.type === 'project-deleted') {
        log.warn('Current project directory no longer exists');

        // Stop the watcher
        await stopProjectWatcher();

        // Show warning dialog to user
        if (mainWindow) {
          const choice = await dialog.showMessageBox(mainWindow, {
            type: 'warning',
            title: 'Project Directory Deleted',
            message: 'Current project directory no longer exists. Please open a different project.',
            buttons: ['Open Folder...', 'Quit'],
            defaultId: 0
          });

          if (choice.response === 0) {
            // User chose to open a different folder
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              title: 'Select Specs Directory',
              buttonLabel: 'Open Project'
            });

            if (!result.canceled) {
              const selectedPath = result.filePaths[0];
              const validation = projectValidator.validateProjectDirectory(selectedPath);

              if (validation.valid) {
                await stopProjectWatcher();

                // Restart Python server with new specs directory
                const newPort = await pythonServer.restartServer(selectedPath);
                log.info(`Python server restarted on port ${newPort}, server is ready`);

                preferences.set('currentProjectPath', selectedPath);
                preferences.set('lastProjectPath', selectedPath);
                preferences.updateRecentProjects(selectedPath, validation.projectName);
                mainWindow.setTitle(`spec-board - ${validation.projectName}`);
                await startProjectWatcher(selectedPath);
                createApplicationMenu();

                // Load the new project from the server
                const newUrl = `http://localhost:${newPort}`;
                log.info(`Loading new project from: ${newUrl}`);
                await mainWindow.loadURL(newUrl);
              } else {
                await dialog.showErrorBox('Invalid Directory', validation.error);
              }
            }
          } else {
            // User chose to quit
            app.quit();
          }
        }
      } else if (mainWindow) {
        // Other file watcher errors
        mainWindow.webContents.send('python-server-error', {
          type: 'file-watcher-error',
          message: error.message || String(error),
          severity: 'warning',
          canRestart: false
        });
      }
    }
  );
}

/**
 * T009: Stop file watcher
 */
async function stopProjectWatcher() {
  if (currentWatcher) {
    log.info('Stopping file watcher');
    await fileWatcher.stopWatcher(currentWatcher);
    currentWatcher = null;
  }
}

/**
 * Create the main browser window
 * T016, T017, T018: Create window with saved preferences and load Python server URL
 *
 * @param {number} port - Port where Python server is running
 * @returns {BrowserWindow} Created window
 */
function createMainWindow(port) {
  log.info('Creating main window...');

  // Get saved window preferences (T018)
  const windowBounds = preferences.get('windowBounds', { width: 1200, height: 800 });
  const windowState = preferences.get('windowState', 'normal');

  // Create the browser window (T016)
  mainWindow = new BrowserWindow({
    width: windowBounds.width,
    height: windowBounds.height,
    x: windowBounds.x,
    y: windowBounds.y,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false // Don't show until ready
  });

  // Apply window state (T018)
  if (windowState === 'maximized') {
    mainWindow.maximize();
  } else if (windowState === 'fullscreen') {
    mainWindow.setFullScreen(true);
  }

  // Load URL from Python server (T017)
  const url = `http://localhost:${port}`;
  log.info(`Loading URL: ${url}`);
  mainWindow.loadURL(url);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    log.info('Window ready to show');
    mainWindow.show();
  });

  // Save window bounds on resize/move (debounced)
  let saveBoundsTimeout;
  mainWindow.on('resize', () => {
    clearTimeout(saveBoundsTimeout);
    saveBoundsTimeout = setTimeout(() => {
      if (!mainWindow.isMaximized() && !mainWindow.isFullScreen()) {
        preferences.set('windowBounds', mainWindow.getBounds());
      }
    }, 500);
  });

  mainWindow.on('move', () => {
    clearTimeout(saveBoundsTimeout);
    saveBoundsTimeout = setTimeout(() => {
      if (!mainWindow.isMaximized() && !mainWindow.isFullScreen()) {
        preferences.set('windowBounds', mainWindow.getBounds());
      }
    }, 500);
  });

  // Save window state changes
  mainWindow.on('maximize', () => {
    preferences.set('windowState', 'maximized');
  });

  mainWindow.on('unmaximize', () => {
    preferences.set('windowState', 'normal');
  });

  mainWindow.on('enter-full-screen', () => {
    preferences.set('windowState', 'fullscreen');
  });

  mainWindow.on('leave-full-screen', () => {
    preferences.set('windowState', 'normal');
  });

  // Window close handler (T021)
  // Per spec clarification: closing window quits app entirely
  mainWindow.on('close', () => {
    log.info('Main window closing, will quit app');
    app.quit();
  });

  return mainWindow;
}

/**
 * T019: Build Recent Projects submenu
 * @returns {Array} Menu items for Recent Projects submenu
 */
function buildRecentProjectsMenu() {
  const recentProjects = preferences.getRecentProjects();

  // T024: Handle empty state
  if (!recentProjects || recentProjects.length === 0) {
    return [{
      label: '(none)',
      enabled: false
    }];
  }

  // T022: Create menu item for each recent project with click handler
  return recentProjects.map((project, index) => ({
    label: project.name,
    click: async () => {
      log.info(`Recent project clicked: ${project.name} (${project.path})`);

      // Check if it's already the current project
      const currentPath = preferences.get('currentProjectPath');
      if (projectValidator.isSameProject(project.path, currentPath)) {
        log.info('Project is already open');
        await dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Project Already Open',
          message: 'This project is already open',
          buttons: ['OK']
        });
        return;
      }

      // Validate project still exists and is valid
      const validation = projectValidator.validateProjectDirectory(project.path);
      if (!validation.valid) {
        log.warn(`Recent project no longer valid: ${validation.error}`);
        await dialog.showErrorBox(
          'Invalid Project',
          `Cannot open "${project.name}":\n\n${validation.error}`
        );
        return;
      }

      // Switch to project
      await stopProjectWatcher();

      // Restart Python server with new specs directory
      log.info('Restarting Python server with new specs directory...');
      const newPort = await pythonServer.restartServer(project.path);
      log.info(`Python server restarted on port ${newPort}, server is ready`);

      preferences.set('currentProjectPath', project.path);
      preferences.set('lastProjectPath', project.path);
      preferences.updateRecentProjects(project.path, project.name);
      mainWindow.setTitle(`spec-board - ${project.name}`);
      await startProjectWatcher(project.path);

      // T023: Rebuild menu after switch
      createApplicationMenu();

      // Load the new project from the server
      const newUrl = `http://localhost:${newPort}`;
      log.info(`Loading new project from: ${newUrl}`);
      await mainWindow.loadURL(newUrl);
      log.info(`Switched to recent project: ${project.name}`);
    }
  }));
}

/**
 * Application Menu Setup
 * T005: Create menu with File > Open Folder
 */
function createApplicationMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    // App Menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),

    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            log.info('File > Open Folder clicked');

            // Open folder picker dialog
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              title: 'Select Specs Directory',
              buttonLabel: 'Open Project'
            });

            if (result.canceled) {
              log.info('Folder picker canceled');
              return;
            }

            const selectedPath = result.filePaths[0];
            log.info(`User selected: ${selectedPath}`);

            // Validate and switch to the selected project
            const validation = projectValidator.validateProjectDirectory(selectedPath);

            if (!validation.valid) {
              log.warn(`Invalid directory: ${validation.error}`);
              await dialog.showErrorBox('Invalid Specs Directory', validation.error);
              return;
            }

            // Stop current watcher
            await stopProjectWatcher();

            // Restart Python server with new specs directory
            log.info('Restarting Python server with new specs directory...');
            const newPort = await pythonServer.restartServer(selectedPath);
            log.info(`Python server restarted on port ${newPort}, server is ready`);

            // Update preferences and window title
            preferences.set('currentProjectPath', selectedPath);
            preferences.set('lastProjectPath', selectedPath);
            mainWindow.setTitle(`spec-board - ${validation.projectName}`);

            // Start watcher for new project
            await startProjectWatcher(selectedPath);

            // T021, T023: Update recent projects and rebuild menu
            preferences.updateRecentProjects(selectedPath, validation.projectName);
            createApplicationMenu();

            // Load the new project from the server
            const newUrl = `http://localhost:${newPort}`;
            log.info(`Loading new project from: ${newUrl}`);
            await mainWindow.loadURL(newUrl);
            log.info(`Switched to project: ${validation.projectName}`);
          }
        },
        {
          label: 'Recent Projects',
          submenu: buildRecentProjectsMenu()
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },

    // View Menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },

    // Window Menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  log.info('Application menu created');
}

/**
 * IPC Handlers for Project Switching
 */

// T002: IPC handler for 'open-folder-dialog'
// Opens native folder picker dialog for selecting a specs directory
ipcMain.handle('open-folder-dialog', async (event) => {
  log.info('Opening folder picker dialog');

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Specs Directory',
      buttonLabel: 'Open Project'
    });

    if (result.canceled) {
      log.info('Folder picker canceled by user');
      return { canceled: true };
    }

    const selectedPath = result.filePaths[0];
    log.info(`User selected folder: ${selectedPath}`);

    return {
      canceled: false,
      path: selectedPath
    };

  } catch (error) {
    log.error(`Error opening folder dialog: ${error.message}`);
    throw error;
  }
});

// T003: IPC handler for 'switch-project'
// Validates directory, updates preferences, and triggers project reload
ipcMain.handle('switch-project', async (event, projectPath) => {
  log.info(`Switch project requested: ${projectPath}`);

  try {
    // Get current project path for comparison
    const currentProjectPath = preferences.get('currentProjectPath');

    // Check if it's the same project (T026)
    if (projectValidator.isSameProject(projectPath, currentProjectPath)) {
      log.info('Selected project is already loaded');
      await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Project Already Open',
        message: 'This project is already open',
        buttons: ['OK']
      });
      return { success: false, reason: 'same-project' };
    }

    // Validate the directory (T007)
    const validation = projectValidator.validateProjectDirectory(projectPath);

    if (!validation.valid) {
      log.warn(`Invalid project directory: ${validation.error}`);
      await dialog.showErrorBox(
        'Invalid Specs Directory',
        validation.error
      );
      return { success: false, error: validation.error };
    }

    log.info(`Project validated: ${validation.projectName} (${validation.featureCount} features)`);

    // T025: Check for unsaved changes before switching
    // TODO: This requires frontend integration - the renderer process needs to
    // track editor state and respond to a 'check-unsaved-changes' IPC call.
    // For now, we proceed with the switch. Implementation steps:
    // 1. Add IPC handler 'check-unsaved-changes' that sends message to renderer
    // 2. Renderer checks editor state and responds with {hasUnsavedChanges: boolean}
    // 3. If true, show dialog: "You have unsaved changes. Save before switching?"
    // 4. Options: "Save", "Don't Save", "Cancel"
    // 5. Only proceed if user chooses "Save" (after saving) or "Don't Save"

    // T009: Stop file watcher
    await stopProjectWatcher();

    // Restart Python server with new specs directory
    log.info('Restarting Python server with new specs directory...');
    const newPort = await pythonServer.restartServer(projectPath);
    log.info(`Python server restarted on port ${newPort}, server is ready`);

    // Update preferences (T010)
    preferences.set('currentProjectPath', projectPath);
    preferences.set('lastProjectPath', projectPath);

    // T021: Update recent projects list
    preferences.updateRecentProjects(projectPath, validation.projectName);

    // Update window title (T015)
    const projectName = validation.projectName;
    mainWindow.setTitle(`spec-board - ${projectName}`);

    // T009: Start file watcher for new project
    await startProjectWatcher(projectPath);

    // T023: Rebuild menu to update recent projects list
    createApplicationMenu();

    // Load the new project from the server (don't just reload)
    const newUrl = `http://localhost:${newPort}`;
    log.info(`Loading new project from: ${newUrl}`);
    await mainWindow.loadURL(newUrl);

    log.info(`Project switch complete: ${projectName}`);

    return {
      success: true,
      projectName: projectName,
      featureCount: validation.featureCount
    };

  } catch (error) {
    log.error(`Error switching project: ${error.message}`);
    await dialog.showErrorBox(
      'Error Switching Project',
      `Failed to switch project: ${error.message}`
    );
    return { success: false, error: error.message };
  }
});

/**
 * Application initialization
 */
app.whenReady().then(async () => {
  log.info('Electron app ready');
  log.info(`App path: ${app.getPath('userData')}`);
  log.info(`Platform: ${process.platform}`);

  // Create application menu (T005)
  createApplicationMenu();

  try {
    // Check for last project path (T024)
    const lastProjectPath = preferences.get('lastProjectPath');

    // Start Python server (T014, T015)
    log.info('Starting Python backend server...');
    const port = await pythonServer.startServer(lastProjectPath);
    log.info(`Python server started on port ${port}`);
    if (lastProjectPath) {
      log.info(`Serving specs from: ${lastProjectPath}`);
    }

    // Create main window (T016, T017, T018)
    if (!lastProjectPath) {
      // No previous project - load welcome screen (T025)
      log.info('No previous project found, loading welcome screen');
      createMainWindow(port);
      // Welcome screen will be loaded by default route or /welcome
    } else {
      // Load previous project
      log.info(`Loading previous project: ${lastProjectPath}`);
      createMainWindow(port);

      // T014, T016: Set window title on project load
      const projectName = projectValidator.getProjectName(lastProjectPath);
      mainWindow.setTitle(`spec-board - ${projectName}`);
      log.info(`Window title set: spec-board - ${projectName}`);

      // T014: Start file watcher for loaded project
      await startProjectWatcher(lastProjectPath);
    }

  } catch (error) {
    log.error(`Failed to start application: ${error.message}`);
    log.error(error.stack);
    app.quit();
  }

  app.on('activate', () => {
    // On macOS it's common to re-create a window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      // Restart server and window
      pythonServer.startServer().then((port) => {
        createMainWindow(port);
      });
    }
  });
});

/**
 * Quit when all windows are closed
 */
app.on('window-all-closed', () => {
  // On macOS, applications stay in menu bar until user quits explicitly
  // But per spec clarification (US1), we quit entirely on window close
  log.info('All windows closed, quitting app');
  app.quit();
});

/**
 * Before quit handler (T022)
 * Save preferences and stop Python server gracefully
 */
app.on('before-quit', async (event) => {
  log.info('Application quitting, cleaning up...');

  // Stop Python server gracefully (T023)
  try {
    await pythonServer.stopServer();
    log.info('Python server stopped');
  } catch (error) {
    log.error(`Error stopping Python server: ${error.message}`);
  }

  // Preferences are already saved on window events (resize/move/maximize)
  log.info('Cleanup complete');
});

/**
 * App quit handler
 */
app.on('quit', () => {
  log.info('Application quit');
});

/**
 * Handle uncaught exceptions
 * (Will be enhanced in T013)
 */
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
