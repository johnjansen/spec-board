const { spawn } = require('child_process');
const getPort = require('get-port');
const log = require('electron-log');
const http = require('http');

/**
 * Python Backend Server Management
 *
 * Manages the lifecycle of the embedded Python FastAPI server:
 * - Start server on random port
 * - Health check until ready
 * - Graceful shutdown with SIGTERM → SIGKILL fallback
 */

let pythonProcess = null;
let serverPort = null;
let currentSpecsDir = null;

/**
 * Start the Python FastAPI server
 * @param {string} specsDir - Absolute path to specs directory (optional)
 * @returns {Promise<number>} Port number when server is ready
 * @throws {Error} If server fails to start or health check times out
 */
async function startServer(specsDir = null) {
  try {
    // Find an available port in range 3000-9000
    // get-port v5 API: accepts array or number
    const portOptions = [];
    for (let p = 3000; p <= 9000; p++) {
      portOptions.push(p);
    }
    serverPort = await getPort({ port: portOptions });
    log.info(`Starting Python server on port ${serverPort}...`);

    // Working directory is the repository root (one level up from electron/)
    const repoRoot = require('path').join(__dirname, '..');

    // Store the specs directory for this server instance
    currentSpecsDir = specsDir;

    // Prepare environment variables
    const env = {
      ...process.env,
      PYTHONUNBUFFERED: '1'
    };

    // If specs directory provided, set SPECS_DIR environment variable
    if (specsDir) {
      env.SPECS_DIR = specsDir;
      log.info(`SPECS_DIR set to: ${specsDir}`);
    }

    // Use 'uv run' to execute within the project's virtual environment
    // This ensures we use the correct Python with all dependencies installed
    pythonProcess = spawn(
      'uv',
      ['run', 'uvicorn', 'src.web.app:app', '--port', serverPort.toString(), '--log-level', 'info'],
      {
        cwd: repoRoot,
        env: env,
        stdio: ['ignore', 'pipe', 'pipe']
      }
    );

    log.info(`Python process started with PID ${pythonProcess.pid}`);

    // Capture stdout
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log.info(`[Python stdout] ${output}`);
      }
    });

    // Capture stderr
    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log.error(`[Python stderr] ${output}`);
      }
    });

    // Handle process exit
    pythonProcess.on('exit', (code, signal) => {
      log.warn(`Python process exited with code ${code}, signal ${signal}`);
      pythonProcess = null;
    });

    // Handle process errors
    pythonProcess.on('error', (err) => {
      log.error(`Python process error: ${err.message}`);
      throw err;
    });

    // Wait for server to be ready (health check)
    await healthCheck(serverPort, 10000); // 10 second timeout

    log.info(`Python server ready on http://localhost:${serverPort}`);
    return serverPort;

  } catch (error) {
    log.error(`Failed to start Python server: ${error.message}`);
    if (pythonProcess) {
      pythonProcess.kill('SIGKILL');
      pythonProcess = null;
    }
    throw error;
  }
}

/**
 * Health check - Poll server until it responds or timeout
 * @param {number} port - Port to check
 * @param {number} timeout - Timeout in milliseconds (default 10000)
 * @returns {Promise<void>} Resolves when server responds, rejects on timeout
 */
function healthCheck(port, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = 200; // Check every 200ms

    const check = () => {
      const req = http.get(`http://localhost:${port}/`, (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          // 200 = OK, 404 = server is up but route doesn't exist (that's fine)
          log.info('Python server health check passed');
          resolve();
        } else {
          // Unexpected status code, keep trying
          scheduleNextCheck();
        }
      });

      req.on('error', (err) => {
        // Connection refused or other error - server not ready yet
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Python server health check timeout after ${timeout}ms`));
        } else {
          scheduleNextCheck();
        }
      });

      req.end();
    };

    const scheduleNextCheck = () => {
      setTimeout(check, interval);
    };

    check();
  });
}

/**
 * Stop the Python server gracefully
 * @returns {Promise<void>} Resolves when server is stopped
 */
async function stopServer() {
  if (!pythonProcess) {
    log.info('No Python server to stop');
    return;
  }

  log.info('Stopping Python server...');

  return new Promise((resolve) => {
    let killed = false;

    // Set up timeout for SIGKILL
    const killTimeout = setTimeout(() => {
      if (!killed && pythonProcess) {
        log.warn('Python server did not stop gracefully, sending SIGKILL');
        pythonProcess.kill('SIGKILL');
        killed = true;
        resolve();
      }
    }, 5000); // 5 second grace period

    // Handle exit event
    pythonProcess.once('exit', () => {
      clearTimeout(killTimeout);
      if (!killed) {
        log.info('Python server stopped gracefully');
        killed = true;
        resolve();
      }
    });

    // Send SIGTERM for graceful shutdown
    pythonProcess.kill('SIGTERM');
  });
}

/**
 * Get the current server port
 * @returns {number|null} Port number or null if server not running
 */
function getServerPort() {
  return serverPort;
}

/**
 * Check if server is running
 * @returns {boolean} True if server process exists
 */
function isServerRunning() {
  return pythonProcess !== null && !pythonProcess.killed;
}

/**
 * Restart the server with a new specs directory
 * @param {string} specsDir - Absolute path to new specs directory
 * @returns {Promise<number>} Port number when server is ready
 */
async function restartServer(specsDir) {
  log.info(`Restarting Python server with new specs directory: ${specsDir}`);

  // Stop current server if running
  if (isServerRunning()) {
    log.info('Stopping current Python server...');
    await stopServer();
    log.info('Current Python server stopped');

    // Give the OS a moment to clean up the port
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Start server with new specs directory
  log.info('Starting new Python server instance...');
  const port = await startServer(specsDir);
  log.info(`New Python server instance started successfully on port ${port}`);

  // Give the server a moment to fully initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  return port;
}

/**
 * Get the current specs directory
 * @returns {string|null} Current specs directory or null
 */
function getCurrentSpecsDir() {
  return currentSpecsDir;
}

module.exports = {
  startServer,
  stopServer,
  restartServer,
  healthCheck,
  getServerPort,
  isServerRunning,
  getCurrentSpecsDir
};
