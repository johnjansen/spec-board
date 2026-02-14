/**
 * Editor.js - Core editing session management for markdown editor
 * Feature: 005-markdown-editor
 */

// Global edit session state
let editSession = null;

// Preview mode state
let isPreviewMode = false;

/**
 * Start a new edit session
 * @param {string} filepath - Absolute path to file being edited
 * @param {string} originalContent - Content when edit started
 * @param {number} originalMtime - File mtime when edit started
 */
function startEditSession(filepath, originalContent, originalMtime) {
    editSession = {
        filepath: filepath,
        originalContent: originalContent,
        originalMtime: originalMtime,
        isDirty: false,
        autoSaveTimer: null,
        draftKey: `draft:${btoa(filepath)}`
    };

    // Get editor elements
    const textarea = document.getElementById('markdown-editor');
    const btnSave = document.getElementById('btn-save');
    const btnCancel = document.getElementById('btn-cancel');

    // Add input event listener to track changes
    if (textarea) {
        textarea.addEventListener('input', function() {
            editSession.isDirty = true;
            updateStatus('Modified - unsaved changes');
        });
    }

    // Wire up Save button
    if (btnSave) {
        btnSave.addEventListener('click', handleSave);
    }

    // Wire up Cancel button
    if (btnCancel) {
        btnCancel.addEventListener('click', handleCancel);
    }

    // Wire up Preview button
    const btnPreview = document.getElementById('btn-preview');
    if (btnPreview) {
        btnPreview.addEventListener('click', togglePreview);
    }

    // Start auto-save timer (every 30 seconds)
    if (window.autoSaveDraft) {
        editSession.autoSaveTimer = setInterval(autoSaveDraft, 30000);
    }

    // Check for existing draft
    if (window.restoreDraftIfExists) {
        restoreDraftIfExists();
    }

    // Add beforeunload warning for unsaved changes
    window.addEventListener('beforeunload', handleBeforeUnload);

    updateStatus('Ready to edit');
}

/**
 * End edit session and cleanup
 */
function endEditSession() {
    if (!editSession) return;

    // Clear auto-save timer
    if (editSession.autoSaveTimer) {
        clearInterval(editSession.autoSaveTimer);
    }

    // Clear draft from localStorage
    if (window.clearDraft) {
        clearDraft();
    }

    // Remove beforeunload listener
    window.removeEventListener('beforeunload', handleBeforeUnload);

    // Clear session
    editSession = null;

    updateStatus('Edit session ended');
}

/**
 * Get current editor content
 * @returns {string} Current content of textarea
 */
function getEditorContent() {
    const textarea = document.getElementById('markdown-editor');
    return textarea ? textarea.value : '';
}

/**
 * Handle Save button click
 */
async function handleSave() {
    if (!editSession) return;

    const content = getEditorContent();
    const btnSave = document.getElementById('btn-save');

    // Disable save button during save
    if (btnSave) {
        btnSave.disabled = true;
        btnSave.textContent = 'Saving...';
    }

    updateStatus('Saving...');

    try {
        const response = await fetch('/api/edit/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filepath: editSession.filepath,
                content: content,
                originalMtime: editSession.originalMtime
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Save successful
            updateStatus('Saved successfully!');
            setTimeout(() => {
                // Clear draft and return to view mode
                endEditSession();
                // Reload the artifact view (go back to read mode)
                window.location.reload();
            }, 500);
        } else if (response.status === 409 && data.conflict) {
            // Conflict detected
            if (window.showConflictModal) {
                const action = await showConflictModal(data.message);
                if (action === 'reload') {
                    // Reload file and discard edits
                    endEditSession();
                    window.location.reload();
                } else {
                    // Keep editing - user can try save again to overwrite
                    updateStatus('Conflict detected - keeping your changes');
                }
            }
        } else {
            // Other error
            if (window.showErrorModal) {
                const retry = await showErrorModal(data.error || 'Failed to save file');
                if (retry) {
                    // Retry save
                    handleSave();
                }
            } else {
                alert(`Save failed: ${data.error || 'Unknown error'}`);
            }
        }
    } catch (error) {
        // Network or other error
        if (window.showErrorModal) {
            const retry = await showErrorModal(`Network error: ${error.message}`);
            if (retry) {
                handleSave();
            }
        } else {
            alert(`Error: ${error.message}`);
        }
    } finally {
        // Re-enable save button
        if (btnSave) {
            btnSave.disabled = false;
            btnSave.textContent = 'Save';
        }
    }
}

/**
 * Handle Cancel button click
 */
function handleCancel() {
    if (!editSession) return;

    // Check if there are unsaved changes
    if (editSession.isDirty) {
        const discard = confirm(
            'You have unsaved changes. Discard changes and return to view mode?'
        );
        if (!discard) {
            return; // User cancelled
        }
    }

    // End session and reload to view mode
    endEditSession();
    window.location.reload();
}

/**
 * Handle beforeunload event (user tries to navigate away)
 */
function handleBeforeUnload(event) {
    if (editSession && editSession.isDirty) {
        // Show browser's native "unsaved changes" prompt
        event.preventDefault();
        event.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // Legacy browsers
    }
}

/**
 * Update status bar text
 * @param {string} message - Status message to display
 */
function updateStatus(message) {
    const statusText = document.getElementById('status-text');
    if (statusText) {
        statusText.textContent = message;
    }
}

/**
 * Toggle between Edit and Preview modes
 */
async function togglePreview() {
    const textarea = document.getElementById('markdown-editor');
    const previewContainer = document.getElementById('preview-container');
    const previewContent = document.getElementById('preview-content');
    const btnPreview = document.getElementById('btn-preview');

    if (!textarea || !previewContainer || !previewContent || !btnPreview) {
        return;
    }

    if (isPreviewMode) {
        // Switch to Edit mode
        previewContainer.classList.add('hidden');
        textarea.classList.remove('hidden');
        btnPreview.textContent = '👁️ Preview';
        isPreviewMode = false;

        // Restore appropriate status based on dirty flag
        if (editSession && editSession.isDirty) {
            updateStatus('Modified - unsaved changes');
        } else {
            updateStatus('Edit mode');
        }
    } else {
        // Switch to Preview mode
        updateStatus('Rendering preview...');
        btnPreview.disabled = true;

        try {
            const content = getEditorContent();
            const startTime = performance.now();

            const response = await fetch('/api/edit/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: content })
            });

            const data = await response.json();
            const renderTime = performance.now() - startTime;

            if (response.ok && data.success) {
                // Update preview content
                previewContent.innerHTML = data.html;

                // Switch to preview mode
                textarea.classList.add('hidden');
                previewContainer.classList.remove('hidden');
                btnPreview.textContent = '✏️ Edit';
                isPreviewMode = true;

                updateStatus(`Preview rendered in ${renderTime.toFixed(0)}ms`);
            } else {
                alert(`Preview failed: ${data.error || 'Unknown error'}`);
                updateStatus('Preview failed');
            }
        } catch (error) {
            alert(`Preview error: ${error.message}`);
            updateStatus('Preview error');
        } finally {
            btnPreview.disabled = false;
        }
    }
}

// Export functions to window for access from HTML
window.startEditSession = startEditSession;
window.endEditSession = endEditSession;
window.getEditorContent = getEditorContent;
window.handleSave = handleSave;
window.handleCancel = handleCancel;
window.updateStatus = updateStatus;
window.togglePreview = togglePreview;
