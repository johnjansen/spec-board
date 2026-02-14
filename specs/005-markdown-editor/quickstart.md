# Quickstart: Inline Markdown Editor

**Feature**: 005-markdown-editor
**Purpose**: Manual validation scenarios for the inline markdown editor feature
**Prerequisite**: Existing spec-board application with markdown display capability

## Test Environment Setup

1. Start the spec-board server:
   ```bash
   # From repo root
   uvx --from . spec-board
   # Or if installed: spec-board
   ```

2. Open browser to: `http://localhost:8000`

3. Ensure you have test markdown files in `specs/` directories for testing

## Validation Scenarios

### Scenario 1: Basic Edit and Save (US1 - MVP)

**Goal**: Verify core edit/save workflow works end-to-end

**Setup**:
1. Navigate to any feature's spec.md in the display panel
2. Note the current content

**Test Steps**:
1. Click "Edit" button in display panel
2. Observe panel switches to editable textarea with markdown content
3. Modify some text (add/edit/delete content)
4. Click "Save" button
5. Observe success confirmation appears
6. Observe panel returns to view mode with rendered markdown
7. Refresh page and verify changes persisted

**Expected Result**:
- ✅ Edit button visible in view mode
- ✅ Click Edit switches to textarea (<1s per SC-001)
- ✅ Textarea contains exact markdown content (FR-003)
- ✅ Save button and Cancel button visible in edit mode (FR-004)
- ✅ Save completes within 2 seconds (SC-002)
- ✅ Success message/indicator shown (FR-008)
- ✅ Changes persist after page reload

**Validation**:
- [ ] Edit button appears in view mode
- [ ] Edit mode switch <1 second
- [ ] Content preserves whitespace/formatting
- [ ] Save shows confirmation
- [ ] Changes persist after refresh

---

### Scenario 2: Cancel Discard Changes (US1 - MVP)

**Goal**: Verify cancel operation discards edits without saving

**Setup**:
1. Open any spec.md in display panel
2. Note the original content

**Test Steps**:
1. Click "Edit" button
2. Make significant changes to content
3. Click "Cancel" button
4. If changes made, observe "Discard changes?" prompt
5. Confirm discard
6. Observe panel returns to view mode
7. Verify original content is displayed (no changes saved)

**Expected Result**:
- ✅ Cancel button visible in edit mode (FR-004)
- ✅ Cancel with no changes: immediate return to view mode
- ✅ Cancel with changes: shows discard confirmation (FR-006)
- ✅ Confirm discard: original content restored (FR-006)
- ✅ No changes persisted to file

**Validation**:
- [ ] Cancel works without changes
- [ ] Cancel with changes prompts for confirmation
- [ ] Discard confirmed restores original content
- [ ] No file modifications after cancel

---

### Scenario 3: External File Modification - Conflict Detection (US1 - MVP)

**Goal**: Verify system detects external file changes and shows conflict modal

**Setup**:
1. Open spec.md in editor (click "Edit")
2. Make some edits in the browser editor
3. **Without saving**, open the same spec.md file in external editor (VS Code, vim, etc.)
4. Modify and save the file in external editor

**Test Steps**:
1. Return to browser editor with unsaved changes
2. Click "Save" button
3. Observe conflict modal appears (FR-011)
4. Modal shows "Reload" and "Keep Editing" options
5. Test "Reload" option: Click "Reload"
6. Observe editor reloads with external file changes (your browser edits discarded)
7. Repeat test, but choose "Keep Editing"
8. Observe editor stays open with your content (can save to overwrite external changes)

**Expected Result**:
- ✅ Conflict detected when file modified externally (FR-011, SC-007 100%)
- ✅ Modal shows with "Reload" and "Keep Editing" buttons (Q1 clarification)
- ✅ "Reload" discards browser edits, loads external changes
- ✅ "Keep Editing" preserves browser content, allows overwrite save

**Validation**:
- [ ] Conflict modal appears on external modification
- [ ] "Reload" button discards edits
- [ ] "Keep Editing" button preserves current content
- [ ] 100% detection rate (SC-007)

---

### Scenario 4: Browser Crash Recovery - Auto-Save Draft (US1 - MVP)

**Goal**: Verify localStorage draft auto-save recovers from browser crash

**Setup**:
1. Open spec.md in editor
2. Make significant edits
3. **Do not click Save** - wait for auto-save

**Test Steps**:
1. Make edits and wait 30+ seconds for auto-save (Q2: every 30 seconds)
2. Close browser tab (simulating crash - do NOT click Save or Cancel)
3. Reopen spec-board in new tab/window
4. Navigate to the same spec.md file
5. Observe "Resume draft?" prompt or automatic draft restoration
6. Verify draft content matches your edits from step 1

**Expected Result**:
- ✅ Draft auto-saved to localStorage every 30 seconds (FR-011a, Q2)
- ✅ Draft restored on next page load (FR-011b)
- ✅ Draft content matches unsaved edits
- ✅ User can choose to resume or discard draft

**Validation**:
- [ ] Edits preserved after browser close (within 30s of last edit)
- [ ] Draft restoration prompt appears on reload
- [ ] Draft content matches unsaved work
- [ ] Can discard draft and load original file

---

### Scenario 5: Large File Warning (US1 - MVP)

**Goal**: Verify large file warning appears for files ≥5MB

**Setup**:
1. Create or find a markdown file ≥5MB (use lorem ipsum generator or duplicate content)
2. Place in specs/ directory

**Test Steps**:
1. Navigate to large file (≥5MB) in display panel
2. Click "Edit" button
3. Observe warning modal appears (FR-010a, Q4)
4. Modal shows "File is large, editing may be slow" message
5. Modal has "Edit Anyway" button
6. Click "Edit Anyway"
7. Verify editor opens (may have slight delay)

**Expected Result**:
- ✅ Files ≥5MB trigger warning modal (Q4: 5MB threshold)
- ✅ Warning shows size and performance message (FR-010a)
- ✅ "Edit Anyway" button allows proceeding
- ✅ Editor opens after confirming (handles up to 10MB per FR-010)

**Validation**:
- [ ] 5MB+ file shows warning modal
- [ ] Warning message clear and actionable
- [ ] "Edit Anyway" opens editor
- [ ] 10MB file editable (typing response <100ms per SC-003)

---

### Scenario 6: Save Error with Retry (US1 - MVP)

**Goal**: Verify error handling for save failures

**Setup**:
1. Simulate save failure (e.g., make file read-only or use mock error)
2. Or manually test by disconnecting network during save

**Test Steps**:
1. Open spec.md in editor
2. Make edits
3. Click "Save" (with simulated failure condition)
4. Observe error modal appears (FR-009, Q3)
5. Modal shows error message and "Retry" button
6. Verify editor content still present (no data loss per FR-009)
7. Click "Retry"
8. If still failing, observe error persists and content preserved

**Expected Result**:
- ✅ Save failure shows blocking modal dialog (Q3: modal dialog pattern)
- ✅ Modal displays error message and "Retry" button (FR-009)
- ✅ Editor content preserved during error (no data loss)
- ✅ Retry button attempts save again
- ✅ User can copy content if retry fails repeatedly

**Validation**:
- [ ] Error modal appears on save failure
- [ ] Error message descriptive
- [ ] "Retry" button functional
- [ ] Content never lost during error handling

---

### Scenario 7: UTF-8 Encoding Validation (US1 - MVP)

**Goal**: Verify UTF-8 enforcement and unicode handling

**Setup**:
1. Test with markdown file containing unicode/emoji
2. Test with non-UTF-8 encoded file (if available)

**Test Steps - Valid UTF-8**:
1. Open file with unicode characters (e.g., "Привет", "你好", "🎯")
2. Click "Edit"
3. Observe content loads correctly in editor
4. Make edits
5. Save file
6. Verify unicode preserved exactly (FR-003)

**Test Steps - Non-UTF-8 File**:
1. Create file with ISO-8859-1 or other non-UTF-8 encoding
2. Click "Edit" on this file
3. Observe error message (FR-003a, Q5: UTF-8 only)
4. Error indicates encoding issue

**Expected Result**:
- ✅ UTF-8 files with unicode/emoji load and save correctly
- ✅ Non-UTF-8 files show error message (Q5: UTF-8 only enforcement)
- ✅ All characters preserved exactly (FR-003)

**Validation**:
- [ ] Unicode characters display correctly in editor
- [ ] Emoji and special characters preserved on save
- [ ] Non-UTF-8 files show clear error message

---

### Scenario 8: Navigate Away Prompt (US1 - MVP)

**Goal**: Verify unsaved changes prompt before navigation

**Setup**:
1. Open spec.md in editor

**Test Steps**:
1. Make edits in editor (don't save)
2. Attempt to navigate away (click different feature, close tab, etc.)
3. Observe "Unsaved changes" prompt appears (FR-007)
4. Prompt shows "Save" / "Discard" / "Cancel" options
5. Test "Cancel" - stays in editor
6. Test "Discard" - navigates away, changes lost
7. Test "Save" - saves changes, then navigates

**Expected Result**:
- ✅ Navigation with unsaved changes triggers prompt (FR-007, SC-006 100%)
- ✅ User can save before leaving
- ✅ User can discard and leave
- ✅ User can cancel and stay in editor

**Validation**:
- [ ] Prompt appears on navigation with unsaved changes
- [ ] All three options functional
- [ ] 100% prompt rate (SC-006)

---

### Scenario 9: Live Preview Toggle (US2 - P2)

**Goal**: Verify preview mode renders markdown correctly

**Setup**:
1. Open spec.md in editor

**Test Steps**:
1. Make edits including markdown formatting:
   - Headers (# ## ###)
   - Lists (-, *, 1.)
   - Code blocks (```)
   - Bold/italic (**text**, *text*)
2. Click "Preview" button (FR-012)
3. Observe panel shows rendered HTML (FR-013)
4. Verify formatting rendered correctly
5. Click "Edit" button to return to source view
6. Verify can toggle between Edit and Preview multiple times
7. Make more edits in Edit mode
8. Toggle to Preview and verify new changes reflected (acceptance scenario 4)

**Expected Result**:
- ✅ "Preview" button visible in edit mode (FR-012)
- ✅ Preview renders markdown as HTML (FR-013)
- ✅ Preview renders within 500ms for <1MB files (SC-005)
- ✅ Toggle between Edit and Preview seamless
- ✅ Preview reflects current editor content (even unsaved)

**Validation**:
- [ ] Preview button appears in edit mode
- [ ] Markdown renders correctly (headers, lists, code, etc.)
- [ ] Preview <500ms for typical files (SC-005)
- [ ] Toggle works smoothly
- [ ] Unsaved changes visible in preview

---

### Scenario 10: Keyboard Shortcuts (US3 - P3)

**Goal**: Verify keyboard shortcuts insert correct markdown syntax

**Setup**:
1. Open spec.md in editor

**Test Steps**:
1. Select text and press Ctrl+B (or Cmd+B on Mac)
2. Verify text wrapped in `**text**` (bold markdown)
3. Select text and press Ctrl+I
4. Verify text wrapped in `*text*` (italic markdown)
5. Press Ctrl+K
6. Verify link dialog appears or link syntax inserted
7. Test other shortcuts as documented (FR-014)

**Expected Result**:
- ✅ Ctrl+B wraps selection in bold markdown (FR-014, acceptance scenario 1)
- ✅ Ctrl+I wraps selection in italic markdown
- ✅ Ctrl+K inserts link syntax (acceptance scenario 3)
- ✅ Shortcuts work on Mac (Cmd) and Windows/Linux (Ctrl)

**Validation**:
- [ ] Bold shortcut (Ctrl/Cmd+B) works
- [ ] Italic shortcut (Ctrl/Cmd+I) works
- [ ] Link shortcut (Ctrl/Cmd+K) works
- [ ] Other documented shortcuts functional

---

### Scenario 11: Formatting Toolbar (US3 - P3)

**Goal**: Verify toolbar buttons insert markdown formatting

**Setup**:
1. Open spec.md in editor
2. Observe toolbar above/below editor

**Test Steps**:
1. Click "Heading" button in toolbar
2. Verify dropdown shows H1-H6 options (FR-015, acceptance scenario 2)
3. Click H2 - verify `## ` inserted at cursor
4. Click "Code Block" button
5. Verify fenced code block (\`\`\`) inserted (acceptance scenario 4)
6. Test other toolbar buttons (lists, links, bold, italic, etc.)

**Expected Result**:
- ✅ Toolbar visible with formatting buttons (FR-015)
- ✅ "Heading" shows H1-H6 dropdown
- ✅ Each button inserts correct markdown syntax
- ✅ Cursor positioned correctly after insertion

**Validation**:
- [ ] Toolbar displays all expected buttons
- [ ] Heading dropdown shows H1-H6
- [ ] Code block button inserts ``` fences
- [ ] All toolbar buttons functional

---

## Edge Case Scenarios

### EC-1: Empty File Editing

**Test**: Open empty markdown file, add content, save
**Expected**: Editor handles empty files gracefully (edge case)

### EC-2: Very Long Lines

**Test**: Edit file with 10,000+ character single line
**Expected**: Typing response stays <100ms (SC-003)

### EC-3: Rapid Saves

**Test**: Click Save repeatedly (stress test)
**Expected**: Each save completes successfully or queues appropriately

### EC-4: localStorage Quota Exceeded

**Test**: Fill localStorage to quota, then try auto-save
**Expected**: Graceful error handling, auto-save disabled, user warned

### EC-5: File Deleted Externally

**Test**: Delete file while editing, then attempt to save
**Expected**: Error modal with clear message (file not found)

---

## Success Criteria Validation

Map these scenarios to success criteria from spec.md:

- **SC-001** (Edit mode switch <1s): Scenario 1
- **SC-002** (Save confirmation <2s): Scenario 1, 6
- **SC-003** (10MB file, typing <100ms): Scenario 5, EC-2
- **SC-004** (95% success rate): All scenarios (manual aggregate)
- **SC-005** (Preview <500ms): Scenario 9
- **SC-006** (Unsaved prompt 100%): Scenario 8
- **SC-007** (External modification detection 100%): Scenario 3

---

## Acceptance Checklist

Before marking feature complete, all core scenarios must pass:

- [ ] Scenario 1: Basic edit and save works
- [ ] Scenario 2: Cancel discards changes
- [ ] Scenario 3: External conflict detection works
- [ ] Scenario 4: Auto-save draft recovery works
- [ ] Scenario 5: Large file warning appears
- [ ] Scenario 6: Save error with retry works
- [ ] Scenario 7: UTF-8 enforcement works
- [ ] Scenario 8: Navigate away prompt works
- [ ] Scenario 9: Live preview toggle works (P2)
- [ ] Scenario 10: Keyboard shortcuts work (P3)
- [ ] Scenario 11: Formatting toolbar works (P3)

---

## Notes

- **Manual testing only**: No automated tests per constitution principle IV
- **Browser**: Test in primary browser only (prototype phase)
- **Auto-save interval**: 30 seconds (Q2 clarification)
- **Conflict resolution**: "Reload" or "Keep Editing" modal (Q1 clarification)
- **Large file threshold**: 5MB warning, 10MB maximum (Q4 clarification)
- **Encoding**: UTF-8 only (Q5 clarification)
- **Error pattern**: Modal dialog with "Retry" (Q3 clarification)

---

## Test Data Setup

### Create Test Files

```bash
# Small file (<1MB)
cp specs/004-validation-ready-indicator/spec.md specs/test-small.md

# Medium file (2-3MB)
yes "Lorem ipsum dolor sit amet..." | head -50000 > specs/test-medium.md

# Large file (6MB - triggers warning)
yes "Lorem ipsum dolor sit amet..." | head -150000 > specs/test-large.md

# Very large file (9MB - near limit)
yes "Lorem ipsum dolor sit amet..." | head -230000 > specs/test-very-large.md

# Unicode file
echo "# Test 🎯\n\nПривет мир\n\n你好世界" > specs/test-unicode.md
```

### Browser DevTools Monitoring

For performance validation:
1. Open Chrome DevTools → Performance tab
2. Record while editing/saving
3. Verify typing response <100ms (SC-003)
4. Verify save operation <2s (SC-002)

For localStorage inspection:
1. Open DevTools → Application tab → Local Storage
2. Look for keys starting with `draft:`
3. Verify draft format (JSON with content, timestamp, mtime)
