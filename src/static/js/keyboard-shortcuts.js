/**
 * Keyboard-shortcuts.js - Keyboard shortcuts for markdown formatting
 * Feature: 005-markdown-editor (User Story 3)
 */

/**
 * Shortcut map: key combination -> formatting function
 */
const shortcutMap = {
    'b': insertBold,      // Ctrl/Cmd+B
    'i': insertItalic,    // Ctrl/Cmd+I
    'k': insertLink       // Ctrl/Cmd+K
};

/**
 * Handle keydown events for keyboard shortcuts
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeydown(event) {
    // Check for Ctrl (Windows/Linux) or Cmd (Mac) key
    const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform);
    const modifierKey = isMac ? event.metaKey : event.ctrlKey;

    if (!modifierKey) {
        return; // Not a shortcut
    }

    const key = event.key.toLowerCase();

    if (shortcutMap[key]) {
        event.preventDefault(); // Prevent default browser behavior
        shortcutMap[key]();
    }
}

/**
 * Get current selection or cursor position in textarea
 * @returns {Object} Selection info with start, end, selectedText
 */
function getSelection() {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return null;

    return {
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
        selectedText: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
    };
}

/**
 * Insert text at cursor position or wrap selection
 * @param {string} before - Text to insert before selection
 * @param {string} after - Text to insert after selection
 * @param {string} placeholder - Placeholder if no selection
 */
function insertFormatting(before, after, placeholder = '') {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;

    const selection = getSelection();
    if (!selection) return;

    const textToWrap = selection.selectedText || placeholder;
    const replacement = before + textToWrap + after;

    // Replace selection with formatted text
    textarea.setRangeText(replacement, selection.start, selection.end, 'end');

    // If there was a placeholder, select it for easy editing
    if (!selection.selectedText && placeholder) {
        textarea.selectionStart = selection.start + before.length;
        textarea.selectionEnd = selection.start + before.length + placeholder.length;
    }

    // Focus back on textarea
    textarea.focus();

    // Mark as dirty
    if (window.editSession) {
        window.editSession.isDirty = true;
        window.updateStatus('Modified - unsaved changes');
    }
}

/**
 * Insert bold formatting (Ctrl/Cmd+B)
 */
function insertBold() {
    insertFormatting('**', '**', 'bold text');
}

/**
 * Insert italic formatting (Ctrl/Cmd+I)
 */
function insertItalic() {
    insertFormatting('*', '*', 'italic text');
}

/**
 * Insert link formatting (Ctrl/Cmd+K)
 */
function insertLink() {
    const selection = getSelection();
    if (!selection) return;

    let linkText = selection.selectedText || 'link text';
    let linkUrl = 'https://example.com';

    // Prompt for URL
    const url = prompt('Enter URL:', linkUrl);
    if (url === null) return; // User cancelled

    insertFormatting('[', `](${url})`, linkText);
}

/**
 * Initialize keyboard shortcuts
 * Called when editor loads
 */
function initKeyboardShortcuts() {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;

    textarea.addEventListener('keydown', handleKeydown);
}

// Export functions to window
window.initKeyboardShortcuts = initKeyboardShortcuts;
window.insertBold = insertBold;
window.insertItalic = insertItalic;
window.insertLink = insertLink;
window.handleKeydown = handleKeydown;
window.insertFormatting = insertFormatting;
