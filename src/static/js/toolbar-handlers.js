/**
 * Toolbar-handlers.js - Formatting toolbar button handlers
 * Feature: 005-markdown-editor (User Story 3)
 */

/**
 * Insert heading at current line
 * @param {number} level - Heading level (1-6)
 */
function insertHeading(level) {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const value = textarea.value;

    // Find start of current line
    let lineStart = value.lastIndexOf('\n', start - 1) + 1;

    // Create heading prefix
    const prefix = '#'.repeat(level) + ' ';

    // Check if line already has heading
    const lineText = value.substring(lineStart, start);
    const headingMatch = lineText.match(/^#+\s/);

    if (headingMatch) {
        // Replace existing heading
        textarea.setRangeText(prefix, lineStart, lineStart + headingMatch[0].length, 'end');
    } else {
        // Insert new heading
        textarea.setRangeText(prefix, lineStart, lineStart, 'end');
    }

    textarea.focus();
    markDirty();
}

/**
 * Insert unordered list item
 */
function insertList() {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const value = textarea.value;

    // Find start of current line
    let lineStart = value.lastIndexOf('\n', start - 1) + 1;

    // Insert list marker
    const prefix = '- ';
    textarea.setRangeText(prefix, lineStart, lineStart, 'end');

    textarea.focus();
    markDirty();
}

/**
 * Insert ordered list item
 */
function insertOrderedList() {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const value = textarea.value;

    // Find start of current line
    let lineStart = value.lastIndexOf('\n', start - 1) + 1;

    // Insert list marker
    const prefix = '1. ';
    textarea.setRangeText(prefix, lineStart, lineStart, 'end');

    textarea.focus();
    markDirty();
}

/**
 * Insert code block (triple backticks)
 */
function insertCodeBlock() {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    // Insert code block with newlines
    const codeBlock = '```\n' + (selectedText || 'code here') + '\n```\n';
    textarea.setRangeText(codeBlock, start, end, 'end');

    // If no selection, position cursor inside code block
    if (!selectedText) {
        textarea.selectionStart = start + 4; // After ```\n
        textarea.selectionEnd = start + 13; // Select "code here"
    }

    textarea.focus();
    markDirty();
}

/**
 * Insert inline code (single backticks)
 */
function insertInlineCode() {
    if (window.insertFormatting) {
        window.insertFormatting('`', '`', 'code');
    }
}

/**
 * Insert blockquote
 */
function insertBlockquote() {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const value = textarea.value;

    // Find start of current line
    let lineStart = value.lastIndexOf('\n', start - 1) + 1;

    // Insert blockquote marker
    const prefix = '> ';
    textarea.setRangeText(prefix, lineStart, lineStart, 'end');

    textarea.focus();
    markDirty();
}

/**
 * Insert horizontal rule
 */
function insertHorizontalRule() {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;

    // Insert horizontal rule with surrounding newlines
    const hr = '\n\n---\n\n';
    textarea.setRangeText(hr, start, start, 'end');

    textarea.focus();
    markDirty();
}

/**
 * Mark editor as dirty (helper function)
 */
function markDirty() {
    if (window.editSession) {
        window.editSession.isDirty = true;
        if (window.updateStatus) {
            window.updateStatus('Modified - unsaved changes');
        }
    }
}

/**
 * Show heading dropdown menu
 */
function showHeadingDropdown() {
    const btn = document.getElementById('btn-heading');
    if (!btn) return;

    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.id = 'heading-dropdown';
    dropdown.className = 'absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg';
    dropdown.innerHTML = `
        <button class="block w-full px-4 py-2 text-left text-lg font-bold hover:bg-gray-100" onclick="window.insertHeading(1); window.closeHeadingDropdown();">H1</button>
        <button class="block w-full px-4 py-2 text-left text-base font-semibold hover:bg-gray-100" onclick="window.insertHeading(2); window.closeHeadingDropdown();">H2</button>
        <button class="block w-full px-4 py-2 text-left text-sm font-semibold hover:bg-gray-100" onclick="window.insertHeading(3); window.closeHeadingDropdown();">H3</button>
        <button class="block w-full px-4 py-2 text-left text-xs font-semibold hover:bg-gray-100" onclick="window.insertHeading(4); window.closeHeadingDropdown();">H4</button>
        <button class="block w-full px-4 py-2 text-left text-xs hover:bg-gray-100" onclick="window.insertHeading(5); window.closeHeadingDropdown();">H5</button>
        <button class="block w-full px-4 py-2 text-left text-xs hover:bg-gray-100" onclick="window.insertHeading(6); window.closeHeadingDropdown();">H6</button>
    `;

    // Position dropdown below button
    const rect = btn.getBoundingClientRect();
    dropdown.style.position = 'absolute';
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = rect.left + 'px';

    document.body.appendChild(dropdown);

    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', closeHeadingDropdown);
    }, 0);
}

/**
 * Close heading dropdown
 */
function closeHeadingDropdown() {
    const dropdown = document.getElementById('heading-dropdown');
    if (dropdown) {
        dropdown.remove();
    }
    document.removeEventListener('click', closeHeadingDropdown);
}

// Export functions to window
window.insertHeading = insertHeading;
window.insertList = insertList;
window.insertOrderedList = insertOrderedList;
window.insertCodeBlock = insertCodeBlock;
window.insertInlineCode = insertInlineCode;
window.insertBlockquote = insertBlockquote;
window.insertHorizontalRule = insertHorizontalRule;
window.showHeadingDropdown = showHeadingDropdown;
window.closeHeadingDropdown = closeHeadingDropdown;
