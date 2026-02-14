/**
 * Edit-modals.js - Modal dialog handlers for editor
 * Feature: 005-markdown-editor
 */

/**
 * Show conflict modal with Reload/Keep Editing options
 * @param {string} message - Conflict message from server
 * @returns {Promise<string>} User's choice: 'reload' or 'keep-editing'
 */
function showConflictModal(message) {
    return new Promise((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'conflict-modal';
        overlay.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        overlay.style.display = 'flex';

        // Create modal content
        overlay.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md shadow-xl">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">File Modified Externally</h3>
                <p class="text-gray-700 mb-6">${message || 'This file has been modified outside the editor. Choose an option:'}</p>
                <div class="flex gap-3 justify-end">
                    <button
                        id="modal-reload"
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Reload
                    </button>
                    <button
                        id="modal-keep-editing"
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors">
                        Keep Editing
                    </button>
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(overlay);

        // Wire up buttons
        const reloadBtn = document.getElementById('modal-reload');
        const keepEditingBtn = document.getElementById('modal-keep-editing');

        reloadBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve('reload');
        });

        keepEditingBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve('keep-editing');
        });

        // ESC key closes modal (defaults to keep-editing)
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', handleEscape);
                resolve('keep-editing');
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

/**
 * Show error modal with Retry option
 * @param {string} errorMessage - Error message from server
 * @returns {Promise<boolean>} True if user wants to retry, false otherwise
 */
function showErrorModal(errorMessage) {
    return new Promise((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'error-modal';
        overlay.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        overlay.style.display = 'flex';

        // Create modal content
        overlay.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md shadow-xl">
                <h3 class="text-lg font-semibold text-red-800 mb-4">Save Error</h3>
                <p class="text-gray-700 mb-6">${errorMessage || 'Failed to save file. Please try again.'}</p>
                <div class="flex gap-3 justify-end">
                    <button
                        id="modal-cancel"
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors">
                        Cancel
                    </button>
                    <button
                        id="modal-retry"
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Retry
                    </button>
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(overlay);

        // Wire up buttons
        const retryBtn = document.getElementById('modal-retry');
        const cancelBtn = document.getElementById('modal-cancel');

        retryBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(true); // User wants to retry
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(false); // User cancelled
        });

        // ESC key closes modal (defaults to cancel)
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', handleEscape);
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

/**
 * Show large file warning modal
 * @param {number} sizeMB - File size in megabytes
 * @returns {Promise<boolean>} True if user wants to proceed, false otherwise
 */
function showLargeFileWarning(sizeMB) {
    return new Promise((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'large-file-modal';
        overlay.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        overlay.style.display = 'flex';

        // Create modal content
        overlay.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md shadow-xl">
                <h3 class="text-lg font-semibold text-yellow-800 mb-4">Large File Warning</h3>
                <p class="text-gray-700 mb-4">
                    This file is <strong>${sizeMB.toFixed(1)} MB</strong> in size.
                    Editing may be slow.
                </p>
                <p class="text-gray-600 text-sm mb-6">
                    For best performance, consider editing files under 5MB.
                </p>
                <div class="flex gap-3 justify-end">
                    <button
                        id="modal-cancel-large"
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors">
                        Cancel
                    </button>
                    <button
                        id="modal-edit-anyway"
                        class="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors">
                        Edit Anyway
                    </button>
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(overlay);

        // Wire up buttons
        const editAnywayBtn = document.getElementById('modal-edit-anyway');
        const cancelBtn = document.getElementById('modal-cancel-large');

        editAnywayBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(true); // User wants to proceed
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(false); // User cancelled
        });

        // ESC key closes modal (defaults to cancel)
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', handleEscape);
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

// Export functions to window for access from editor.js
window.showConflictModal = showConflictModal;
window.showErrorModal = showErrorModal;
window.showLargeFileWarning = showLargeFileWarning;
