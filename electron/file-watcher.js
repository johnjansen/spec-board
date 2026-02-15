const chokidar = require('chokidar');
const log = require('electron-log');
const path = require('path');

/**
 * File System Watcher Module
 *
 * Monitors the specs directory for external file changes and notifies the renderer.
 * Uses chokidar for cross-platform file watching with debouncing.
 */

/**
 * Create a file watcher for the given path
 * @param {string} watchPath - Absolute path to watch (specs directory)
 * @param {Function} onChange - Callback called when file changes: (filePath, relativePath) => void
 * @param {Function} onError - Callback called on watcher error: (error) => void
 * @returns {FSWatcher} Chokidar watcher instance
 */
function createWatcher(watchPath, onChange, onError) {
  log.info(`Creating file watcher for: ${watchPath}`);

  const watcher = chokidar.watch(watchPath, {
    // Ignore patterns
    ignored: [
      /(^|[\/\\])\../, // Dotfiles (.git, .DS_Store, etc.)
      /node_modules/, // Node modules
      /__pycache__/, // Python cache
      /\.pytest_cache/, // Pytest cache
      /\.venv/, // Python venv
      /venv/, // Python venv
      /\.tmp$/, // Temporary files
      /\.swp$/, // Vim swap files
      /\.log$/ // Log files
    ],

    // Chokidar options
    persistent: true,
    ignoreInitial: true, // Don't emit events for existing files on startup
    awaitWriteFinish: {
      // Debouncing: wait for writes to finish before emitting event
      stabilityThreshold: 300, // 300ms
      pollInterval: 100 // Check every 100ms
    },
    depth: 10, // Maximum depth to watch (prevent infinite recursion)
    followSymlinks: false // Don't follow symbolic links
  });

  // Listen for change events
  watcher.on('change', (filePath) => {
    const relativePath = path.relative(watchPath, filePath);
    log.info(`File changed: ${relativePath}`);

    if (onChange) {
      onChange(filePath, relativePath);
    }
  });

  // Listen for add events (new files)
  watcher.on('add', (filePath) => {
    const relativePath = path.relative(watchPath, filePath);
    log.info(`File added: ${relativePath}`);

    if (onChange) {
      onChange(filePath, relativePath);
    }
  });

  // Listen for unlink events (deleted files)
  watcher.on('unlink', (filePath) => {
    const relativePath = path.relative(watchPath, filePath);
    log.info(`File deleted: ${relativePath}`);

    if (onChange) {
      onChange(filePath, relativePath);
    }
  });

  // T027: Listen for unlinkDir events (directory deletion)
  watcher.on('unlinkDir', (dirPath) => {
    const relativePath = path.relative(watchPath, dirPath);
    log.warn(`Directory deleted: ${relativePath}`);

    // Check if the watched root directory itself was deleted
    if (dirPath === watchPath || path.normalize(dirPath) === path.normalize(watchPath)) {
      log.error(`Watched project directory was deleted: ${watchPath}`);
      if (onError) {
        onError({
          type: 'project-deleted',
          message: 'Current project directory no longer exists',
          path: watchPath
        });
      }
    } else if (onChange) {
      onChange(dirPath, relativePath);
    }
  });

  // Handle watcher errors
  watcher.on('error', (error) => {
    log.error(`File watcher error: ${error.message}`);

    if (onError) {
      onError(error);
    }
  });

  // Log when watcher is ready
  watcher.on('ready', () => {
    log.info(`File watcher ready for: ${watchPath}`);
  });

  return watcher;
}

/**
 * Stop a file watcher
 * @param {FSWatcher} watcher - Chokidar watcher instance to stop
 * @returns {Promise<void>} Resolves when watcher is closed
 */
async function stopWatcher(watcher) {
  if (!watcher) {
    log.warn('No watcher to stop');
    return;
  }

  log.info('Stopping file watcher...');
  await watcher.close();
  log.info('File watcher stopped');
}

module.exports = {
  createWatcher,
  stopWatcher
};
