# Research: Inline Markdown Editor

**Feature**: 005-markdown-editor
**Phase**: 0 (Research & Technical Decisions)
**Date**: 2026-02-14

## Overview

This research document resolves technical unknowns identified in plan.md Technical Context. Four key decisions are needed: frontend editor library choice, external file modification detection strategy, localStorage implementation, and modal dialog patterns.

## Decision 1: Frontend Markdown Editor Library

**Question**: Which frontend library should be used for the markdown editor component?

**Options Considered**:
1. **CodeMirror 6**: Full-featured code editor, 200KB gzipped, excellent performance, extensive API
2. **Monaco Editor**: VS Code's editor, 1.5MB gzipped, heavyweight, excellent features but large bundle
3. **SimpleMDE**: Lightweight markdown-specific editor, 50KB gzipped, simpler feature set
4. **Plain textarea**: No library, <1KB, minimal features, full manual control

**Decision**: **Plain textarea with minimal JavaScript enhancements**

**Rationale**:
- **Simplicity**: Aligns with constitution Principle II (minimal simplicity). A textarea is sufficient for markdown editing - users don't need syntax highlighting or advanced IDE features for spec documents.
- **Performance**: Zero bundle size for editor library. Textarea handles 10MB files natively without performance concerns.
- **P3 Compatibility**: Formatting toolbar (P3) can be implemented with simple JavaScript functions that insert markdown syntax at cursor position. No library required.
- **UTF-8 Handling**: Native browser textarea handling of UTF-8 is reliable and well-tested.
- **Keyboard Shortcuts**: Can implement P3 shortcuts via keydown event listeners (Ctrl+B, Ctrl+I, etc.) without library dependency.
- **Maintenance**: No external library updates, security patches, or breaking changes to manage.

**Alternatives Rejected**:
- CodeMirror 6: Over-engineering for markdown editing. 200KB for features we won't use (syntax tree, language support, extensions).
- Monaco Editor: 1.5MB is excessive for simple text editing. Designed for full IDE experience, not lightweight markdown.
- SimpleMDE: Still 50KB for features we can implement in <5KB custom code. Adds dependency without sufficient value.

**Implementation Approach**:
- `<textarea>` element with monospace font and resize handling
- JavaScript utilities for cursor position, selection manipulation, text insertion
- CSS for styling (Tailwind classes for consistency)
- P3 toolbar: Buttons that call simple insert functions (e.g., `insertBold()`, `insertHeading()`)

---

## Decision 2: External File Modification Detection

**Question**: How should the system detect when a file has been modified externally while user is editing?

**Options Considered**:
1. **Timestamp comparison (mtimems)**: Compare file modification time on save
2. **File hash (MD5/SHA-256)**: Compare content hash on save
3. **File watcher API (watchdog, inotify)**: Real-time file system monitoring
4. **Periodic polling**: Check file modification time every N seconds during edit

**Decision**: **Timestamp comparison on save attempt** (with optional periodic check for enhanced UX)

**Rationale**:
- **Simplicity**: Checking mtimems requires single stat() call, minimal overhead. No background processes or file watchers needed.
- **Reliability**: File system timestamps are reliable for conflict detection. Race conditions are rare in single-user environment.
- **Performance**: Zero background overhead. Check only happens when user clicks "Save", or optionally on 30-second interval (same as auto-save).
- **Cross-platform**: stat() and mtimems work identically on Linux, macOS, Windows.
- **Integration**: Easy to implement in FastAPI - `pathlib.Path.stat().st_mtime` returns timestamp.

**Alternatives Rejected**:
- File hash: Computational overhead of hashing large files (10MB) is unnecessary. Timestamp is sufficient for conflict detection.
- File watcher API: Over-engineering for single-user tool. Requires background process, resource overhead, complexity managing watcher lifecycle.
- Continuous polling: Unnecessary network overhead. Polling only during edit session (30s interval) is sufficient.

**Implementation Approach**:
- **On Edit Open**: Store file mtimems in EditSession
- **On Save**: Compare current mtimems with stored value
- **If Different**: Show modal dialog with "Reload" (discard edits) or "Keep Editing" (overwrite external changes) options
- **Optional Enhancement**: Periodic check every 30 seconds during edit session (same interval as auto-save) to detect conflicts earlier

**Edge Cases Handled**:
- Clock skew: Compare timestamps with reasonable tolerance (1-second precision)
- Same-second modifications: Hash comparison fallback if timestamps equal but content differs
- Network filesystems: mtimems propagation may be delayed, but single-user environment minimizes risk

---

## Decision 3: localStorage Auto-Save Implementation

**Question**: How should draft auto-save to localStorage be implemented (format, keys, cleanup)?

**Options Considered**:
1. **Simple key-value**: `drafts/{filepath}` → raw content string
2. **JSON structure**: `drafts/{filepath}` → `{content, timestamp, originalTimestamp}`
3. **Indexed structure**: `drafts/index` → array of draft objects
4. **Per-feature storage**: Separate keys per feature directory

**Decision**: **JSON structure with filepath-based keys**

**Rationale**:
- **Structure**: JSON allows storing metadata (timestamp, original file mtimems) alongside content for validation.
- **Uniqueness**: Filepath as key ensures one draft per file. Use base64-encoded filepath to handle special characters.
- **Cleanup**: Explicit cleanup on save/cancel. Stale drafts (>7 days old) cleaned on app start.
- **Size**: localStorage typical limit 5-10MB per origin. Drafts limited to file size (10MB max), but only one draft per edit session.

**Alternatives Rejected**:
- Simple key-value: Lacks metadata for validation (can't detect if file was saved elsewhere after draft created).
- Indexed structure: Over-engineering. No need for list of all drafts - only restore draft for currently viewed file.
- Per-feature storage: Unnecessary namespacing. Filepath uniqueness is sufficient.

**Implementation Approach**:

**Draft Key Format**:
```javascript
const draftKey = `draft:${btoa(filepath)}`  // Base64-encoded filepath
```

**Draft Value Format (JSON)**:
```json
{
  "content": "# Markdown content...",
  "timestamp": 1707890400000,           // When draft was saved (ms since epoch)
  "originalMtime": 1707889000000,       // File mtimems when edit started
  "filepath": "/specs/005-markdown-editor/spec.md"  // Original path for validation
}
```

**Auto-Save Interval**: Every 30 seconds while in edit mode (using `setInterval`)

**Restoration Logic**:
1. On page load, check `localStorage.getItem(draftKey)`
2. If exists, compare `originalMtime` with current file mtimems
3. If match, show "Resume draft?" prompt
4. If mismatch, file was modified externally → discard draft, load latest file

**Cleanup Strategy**:
- **On Save**: Remove draft with `localStorage.removeItem(draftKey)`
- **On Cancel**: Remove draft
- **On App Start**: Remove drafts older than 7 days (scan all `draft:*` keys)
- **Quota Exceeded**: If `QuotaExceededError`, warn user and disable auto-save for session

**Storage Estimate**:
- Typical spec.md: 5-20KB
- Worst case (10MB file): 10MB draft
- localStorage limit: 5-10MB → Can store 1-2 large file drafts safely
- User clarification Q2 confirmed 30-second interval is acceptable

---

## Decision 4: Modal Dialog Patterns

**Question**: What modal dialog pattern should be used for conflicts, errors, and warnings to maintain consistency with existing spec-board UI?

**Options Considered**:
1. **Native browser dialogs**: `alert()`, `confirm()` - simple but not customizable
2. **Custom modal with HTMX**: Server-rendered modal content, HTMX swap
3. **Custom modal with JavaScript**: Client-side modal, Tailwind styling
4. **Third-party modal library**: SweetAlert, Bootstrap modals, etc.

**Decision**: **Custom modal with JavaScript + Tailwind CSS** (no HTMX, no external library)

**Rationale**:
- **Consistency**: Spec-board uses Tailwind CSS for styling. Custom modals can match existing color scheme and design language.
- **Simplicity**: Modal HTML is static (not server-rendered), so HTMX is unnecessary overhead. Pure JavaScript show/hide is simpler.
- **Prototype Velocity**: No external library to integrate or learn. Simple modal implementation <50 lines of JS.
- **Customization**: Need three modal types (conflict, error, large file warning) with different button combinations. Custom implementation is flexible.

**Alternatives Rejected**:
- Native dialogs: Not customizable. `confirm()` only supports "OK"/"Cancel", but we need "Reload"/"Keep Editing" and "Edit Anyway".
- HTMX modals: Over-engineering. Modals don't need server interaction - they're pure client-side UI state.
- SweetAlert/Bootstrap: Adds dependencies. Prototype principle II says no libraries unless solving immediate need. Custom modal solves this.

**Implementation Approach**:

**HTML Structure** (in `edit_modals.html` partial):
```html
<!-- Conflict Modal -->
<div id="conflict-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-6 max-w-md shadow-xl">
    <h3 class="text-lg font-semibold mb-4">File Modified Externally</h3>
    <p class="text-gray-700 mb-6">This file has been modified outside the editor. Choose an option:</p>
    <div class="flex gap-3 justify-end">
      <button id="modal-reload" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Reload</button>
      <button id="modal-keep-editing" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Keep Editing</button>
    </div>
  </div>
</div>

<!-- Error Modal -->
<div id="error-modal" class="hidden ...">
  <!-- Similar structure with Retry button -->
</div>

<!-- Large File Warning Modal -->
<div id="large-file-modal" class="hidden ...">
  <!-- Similar structure with Edit Anyway / Cancel buttons -->
</div>
```

**JavaScript API** (in `edit-modals.js`):
```javascript
// Show conflict modal
showConflictModal((action) => {
  if (action === 'reload') { /* reload file */ }
  else { /* continue editing */ }
})

// Show error modal
showErrorModal(errorMessage, () => { /* retry callback */ })

// Show large file warning
showLargeFileWarning((proceed) => {
  if (proceed) { /* open editor */ }
  else { /* cancel */ }
})
```

**Tailwind Classes**:
- Modal overlay: `fixed inset-0 bg-gray-600 bg-opacity-50` (semi-transparent backdrop)
- Modal content: `bg-white rounded-lg p-6 shadow-xl` (card-style modal)
- Buttons: `bg-blue-600 text-white rounded hover:bg-blue-700` (primary action), `bg-gray-300 text-gray-700 rounded` (secondary)

**Accessibility**:
- Focus trap: Trap keyboard focus within modal while open
- Escape key: Close modal on Escape key press
- ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`

---

## Summary

All technical decisions resolved. No blocking unknowns remain. Ready to proceed to Phase 1 (data model and contracts).

**Key Takeaways**:
1. **Editor**: Plain textarea (no library) - sufficient for markdown editing, maintains simplicity
2. **Conflict Detection**: Timestamp comparison on save (mtimems) - reliable and simple
3. **Auto-Save**: JSON structure in localStorage with 30-second interval - balances safety and performance
4. **Modals**: Custom implementation with Tailwind CSS - consistent with existing UI, no external dependencies

**Technology Choices Locked In**:
- Frontend: Vanilla JavaScript + textarea
- Conflict Detection: `pathlib.Path.stat().st_mtime` comparison
- Storage: localStorage with JSON draft format
- UI: Tailwind CSS for modal styling

**Constitution Compliance**:
- ✅ Principle II: All choices favor simplicity over complexity
- ✅ No external libraries added (CodeMirror, Monaco rejected)
- ✅ Direct implementations preferred over frameworks

**Next**: Generate data-model.md, contracts/, and quickstart.md (Phase 1)
