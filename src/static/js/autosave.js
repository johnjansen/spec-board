/**
 * Autosave.js - localStorage draft auto-save for crash recovery
 * Feature: 005-markdown-editor
 */

/**
 * Auto-save current editor content to localStorage as draft
 * Called every 30 seconds by editor.js timer
 */
function autoSaveDraft() {
    // Access global editSession from editor.js
    if (!window.editSession) return;

    const content = window.getEditorContent();
    const draft = {
        content: content,
        timestamp: Date.now(),
        originalMtime: window.editSession.originalMtime,
        filepath: window.editSession.filepath
    };

    try {
        localStorage.setItem(window.editSession.draftKey, JSON.stringify(draft));
        window.updateStatus('Draft auto-saved');

        // Reset status after 2 seconds
        setTimeout(() => {
            if (window.editSession && window.editSession.isDirty) {
                window.updateStatus('Modified - unsaved changes');
            } else {
                window.updateStatus('Ready to edit');
            }
        }, 2000);
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            // localStorage quota exceeded
            console.error('localStorage quota exceeded - disabling auto-save');
            window.updateStatus('Warning: Auto-save disabled (storage full)');

            // Stop auto-save timer
            if (window.editSession && window.editSession.autoSaveTimer) {
                clearInterval(window.editSession.autoSaveTimer);
                window.editSession.autoSaveTimer = null;
            }

            // Warn user
            alert(
                'Warning: Browser storage is full. Auto-save has been disabled.\n\n' +
                'Please save your work manually to avoid data loss.'
            );
        } else {
            console.error('Failed to save draft:', e);
        }
    }
}

/**
 * Restore draft from localStorage if exists and is valid
 * Called when editor loads
 */
function restoreDraftIfExists() {
    if (!window.editSession) return;

    try {
        const draftJson = localStorage.getItem(window.editSession.draftKey);
        if (!draftJson) {
            return; // No draft exists
        }

        const draft = JSON.parse(draftJson);

        // Validate draft matches current file
        if (draft.filepath !== window.editSession.filepath) {
            // Draft is for a different file - ignore
            return;
        }

        // Check if file was modified externally after draft was created
        if (draft.originalMtime !== window.editSession.originalMtime) {
            // File was modified externally - discard stale draft
            localStorage.removeItem(window.editSession.draftKey);
            return;
        }

        // Check draft age (discard if > 7 days old)
        const draftAge = Date.now() - draft.timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        if (draftAge > maxAge) {
            // Draft is too old - discard
            localStorage.removeItem(window.editSession.draftKey);
            return;
        }

        // Valid draft exists - prompt user to restore
        const draftDate = new Date(draft.timestamp);
        const restore = confirm(
            `A draft from ${draftDate.toLocaleString()} was found.\n\n` +
            'Do you want to resume editing from this draft?'
        );

        if (restore) {
            // Restore draft content
            const textarea = document.getElementById('markdown-editor');
            if (textarea) {
                textarea.value = draft.content;
                window.editSession.isDirty = true;
                window.updateStatus('Draft restored');
            }
        } else {
            // User declined - clear draft
            localStorage.removeItem(window.editSession.draftKey);
        }
    } catch (e) {
        console.error('Failed to restore draft:', e);
        // On error, silently ignore draft
    }
}

/**
 * Clear draft from localStorage
 * Called on successful save or cancel
 */
function clearDraft() {
    if (!window.editSession) return;

    try {
        localStorage.removeItem(window.editSession.draftKey);
    } catch (e) {
        console.error('Failed to clear draft:', e);
    }
}

/**
 * Clean up stale drafts (> 7 days old) on page load
 * Called once when app loads
 */
function cleanupStaleDrafts() {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();

    try {
        // Iterate through all localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            // Only check draft keys
            if (key && key.startsWith('draft:')) {
                try {
                    const draftJson = localStorage.getItem(key);
                    if (draftJson) {
                        const draft = JSON.parse(draftJson);
                        const draftAge = now - draft.timestamp;

                        if (draftAge > maxAge) {
                            // Draft is stale - remove
                            localStorage.removeItem(key);
                            console.log(`Cleaned up stale draft: ${key}`);
                        }
                    }
                } catch (e) {
                    // Invalid draft JSON - remove it
                    localStorage.removeItem(key);
                }
            }
        }
    } catch (e) {
        console.error('Failed to cleanup stale drafts:', e);
    }
}

// Run cleanup on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanupStaleDrafts);
} else {
    cleanupStaleDrafts();
}

// Export functions to window for access from editor.js
window.autoSaveDraft = autoSaveDraft;
window.restoreDraftIfExists = restoreDraftIfExists;
window.clearDraft = clearDraft;
window.cleanupStaleDrafts = cleanupStaleDrafts;
