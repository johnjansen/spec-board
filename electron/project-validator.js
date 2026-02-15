const fs = require('fs');
const path = require('path');
const log = require('electron-log');

/**
 * Project Validation Utilities
 *
 * Validates that a directory is a valid spec-kit project by checking for
 * numbered feature folders matching pattern: \d+-feature-name
 */

/**
 * Validate that a directory is a valid specs directory
 * @param {string} dirPath - Absolute path to directory to validate
 * @returns {Object} { valid: boolean, error?: string, projectName?: string }
 */
function validateProjectDirectory(dirPath) {
  try {
    // Check if path exists
    if (!fs.existsSync(dirPath)) {
      return {
        valid: false,
        error: 'Directory does not exist. Please select a valid folder.'
      };
    }

    // Check if it's a directory
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return {
        valid: false,
        error: 'Selected path is not a directory. Please select a folder.'
      };
    }

    // Check for read permissions
    try {
      fs.accessSync(dirPath, fs.constants.R_OK);
    } catch (err) {
      log.error(`Permission error accessing ${dirPath}:`, err);
      return {
        valid: false,
        error: 'Permission denied. Please check folder permissions and try again.'
      };
    }

    // Read directory contents
    const entries = fs.readdirSync(dirPath);

    // Check for numbered feature folders (pattern: \d+-feature-name)
    const featureFolderPattern = /^\d+-[a-z0-9-]+$/;
    const featureFolders = entries.filter(entry => {
      const entryPath = path.join(dirPath, entry);
      const isDir = fs.statSync(entryPath).isDirectory();
      return isDir && featureFolderPattern.test(entry);
    });

    if (featureFolders.length === 0) {
      return {
        valid: false,
        error: 'Invalid specs directory. Selected folder must contain numbered feature folders (e.g., 001-feature-name/).'
      };
    }

    // Extract project name from parent directory
    const projectName = getProjectName(dirPath);

    log.info(`Validated project directory: ${dirPath} (${featureFolders.length} features found)`);

    return {
      valid: true,
      projectName: projectName,
      featureCount: featureFolders.length
    };

  } catch (error) {
    log.error(`Validation error for ${dirPath}:`, error);
    return {
      valid: false,
      error: `Error validating directory: ${error.message}`
    };
  }
}

/**
 * Extract project name from specs directory path
 * @param {string} specsPath - Absolute path to specs directory
 * @returns {string} Project name (parent directory name)
 */
function getProjectName(specsPath) {
  // Get the parent directory name
  // e.g., /Users/name/my-project/specs → "my-project"
  const parentDir = path.dirname(specsPath);
  const projectName = path.basename(parentDir);
  return projectName;
}

/**
 * Check if a directory path is the same as the currently loaded project
 * @param {string} newPath - Path to check
 * @param {string} currentPath - Currently loaded project path
 * @returns {boolean} True if paths refer to the same project
 */
function isSameProject(newPath, currentPath) {
  if (!newPath || !currentPath) {
    return false;
  }

  // Normalize paths for comparison (resolve symlinks, relative paths, etc.)
  const normalizedNew = path.resolve(newPath);
  const normalizedCurrent = path.resolve(currentPath);

  return normalizedNew === normalizedCurrent;
}

/**
 * Detect if directory is on a network mount
 * @param {string} dirPath - Directory path to check
 * @returns {boolean} True if likely a network mount
 */
function isNetworkMount(dirPath) {
  // Check for common network path patterns
  // macOS: /Volumes/, Windows: \\, Linux: /mnt/, /media/
  const networkPatterns = [
    /^\/Volumes\//,           // macOS network mounts
    /^\\\\[^\\]+\\/,          // Windows UNC paths
    /^\/\/[^\/]+\//,          // Unix UNC paths
    /^\/mnt\//,               // Linux mounts
    /^\/media\//              // Linux media mounts
  ];

  return networkPatterns.some(pattern => pattern.test(dirPath));
}

module.exports = {
  validateProjectDirectory,
  getProjectName,
  isSameProject,
  isNetworkMount
};
