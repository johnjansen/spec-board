# Data Model: Inline Markdown Editor

**Feature**: 005-markdown-editor
**Phase**: 1 (Design)
**Date**: 2026-02-14

## Overview

This feature introduces two primary entities for managing markdown file editing sessions: `EditSession` (client-side state) and `MarkdownFile` (server-side representation). No database storage is required - all data is derived from filesystem and browser localStorage.

## Entity: MarkdownFile (Server-Side)

**Location**: `src/models/markdown_file.py` (new file)
**Purpose**: Represents a markdown file being edited, with metadata for conflict detection and validation

###Properties

```python
@dataclass
class MarkdownFile:
    """Represents a markdown file with editing metadata.

    Attributes:
        filepath: Absolute path to markdown file in specs/ directory
        content: UTF-8 decoded file content
        size_bytes: File size in bytes
        mtime: Last modification timestamp (seconds since epoch)
        encoding: Character encoding (always 'utf-8')
    """
    filepath: Path
    content: str
    size_bytes: int
    mtime: float  # From pathlib.Path.stat().st_mtime
    encoding: str = 'utf-8'
```

### Validation Rules

- **filepath**: Must be absolute path, must exist, must be within specs/ directory
- **content**: Must be valid UTF-8 (validation on read/write per FR-003a)
- **size_bytes**: Must be ≤ 10MB (10,485,760 bytes) per FR-010
- **mtime**: Used for conflict detection per FR-011
- **encoding**: Always 'utf-8', raise error if file cannot be decoded

### Methods

```python
@classmethod
def load(cls, filepath: Path) -> 'MarkdownFile':
    """Load markdown file from filesystem.

    Args:
        filepath: Absolute path to markdown file

    Returns:
        MarkdownFile instance

    Raises:
        FileNotFoundError: If file doesn't exist
        UnicodeDecodeError: If file is not UTF-8 encoded (per FR-003a)
        ValueError: If file size > 10MB (per FR-010)
    """
    # Implementation validates all constraints

def save(self, content: str) -> None:
    """Save content to file, updating mtime.

    Args:
        content: UTF-8 content to write

    Raises:
        UnicodeEncodeError: If content contains non-UTF-8 characters
        OSError: If file cannot be written (permissions, disk full)
    """
    # Updates self.content, self.mtime, self.size_bytes after write

def check_modified(self, original_mtime: float) -> bool:
    """Check if file was modified externally since original_mtime.

    Args:
        original_mtime: Timestamp from when editing started

    Returns:
        True if file was modified externally (conflict detected)
    """
    current_mtime = self.filepath.stat().st_mtime
    return current_mtime != original_mtime
```

---

## Entity: EditSession (Client-Side)

**Location**: JavaScript object in `static/js/editor.js` (not a Python class)
**Purpose**: Tracks active editing session state in browser, including original content for cancel operation and auto-save drafts

### Properties

```javascript
const editSession = {
  filepath: string,           // Absolute path to file being edited
  originalContent: string,    // Content when edit started (for cancel)
  originalMtime: number,      // File mtime when edit started (for conflict detection)
  isDirty: boolean,           // True if user modified content
  autoSaveTimer: number,      // setInterval ID for 30-second auto-save
  draftKey: string            // localStorage key for draft (draft:base64filepath)
}
```

### Lifecycle

**Created**: When user clicks "Edit" button in view mode
**Updated**: On every keystroke (sets `isDirty = true`)
**Destroyed**: When user clicks "Save" (successful) or "Cancel"

### State Transitions

```
[View Mode]
    ↓ (click "Edit")
[Edit Mode - Clean] (isDirty=false, originalContent stored)
    ↓ (user types)
[Edit Mode - Dirty] (isDirty=true, auto-save starts)
    ↓ (every 30s)
[Auto-Save to localStorage] (draft stored)
    ↓ (click "Save")
[Conflict Check] → If conflict: show modal, else: save file
    ↓ (save success)
[View Mode] (session destroyed, draft cleared)

Alternative path:
[Edit Mode - Dirty]
    ↓ (click "Cancel")
[Confirm Discard] → show prompt if isDirty
    ↓ (confirm)
[View Mode] (session destroyed, draft cleared)
```

### Methods

```javascript
// Initialize edit session
function startEditSession(filepath, content, mtime) {
  editSession.filepath = filepath
  editSession.originalContent = content
  editSession.originalMtime = mtime
  editSession.isDirty = false
  editSession.draftKey = `draft:${btoa(filepath)}`

  // Start auto-save timer (every 30 seconds)
  editSession.autoSaveTimer = setInterval(autoSaveDraft, 30000)

  // Check for existing draft
  restoreDraftIfExists()
}

// Auto-save to localStorage
function autoSaveDraft() {
  const draft = {
    content: getEditorContent(),
    timestamp: Date.now(),
    originalMtime: editSession.originalMtime,
    filepath: editSession.filepath
  }
  localStorage.setItem(editSession.draftKey, JSON.stringify(draft))
}

// End edit session
function endEditSession() {
  clearInterval(editSession.autoSaveTimer)
  localStorage.removeItem(editSession.draftKey)
  editSession = null
}
```

---

## Entity: EditDraft (localStorage)

**Location**: Browser localStorage (JSON structure)
**Purpose**: Persistent draft storage for crash recovery per FR-011a/b/c

### Schema

```typescript
interface EditDraft {
  content: string       // Current editor content
  timestamp: number     // When draft was saved (ms since epoch)
  originalMtime: number // File mtime when edit started
  filepath: string      // Absolute path for validation
}
```

### Storage Key Format

```javascript
const key = `draft:${btoa(filepath)}`
// Example: "draft:L3NwZWNzLzAwNS1tYXJrZG93bi1lZGl0b3Ivc3BlYy5tZA=="
```

### Lifecycle

- **Created**: On first auto-save (30 seconds after edit starts)
- **Updated**: Every 30 seconds while editing (if `isDirty = true`)
- **Deleted**: On successful save, cancel, or draft age >7 days

### Validation Rules

- **Restore**: Only if `originalMtime` matches current file mtime (no external modifications)
- **Quota**: Handle `QuotaExceededError` by disabling auto-save and warning user
- **Staleness**: Drafts older than 7 days are automatically deleted on app load

---

## Relationships

```
User
  ↓ clicks "Edit"
EditSession (browser)
  ↓ requests content
MarkdownFile (server)
  ↓ loads from filesystem
File on disk (specs/*/spec.md)

EditSession
  ↓ auto-saves to
EditDraft (localStorage)

EditSession
  ↓ checks conflicts via
MarkdownFile.check_modified()
  ↓ compares mtime
File on disk
```

---

## API Data Transfer Objects

### LoadFileRequest

```typescript
// GET /api/edit/load?filepath=/specs/005-markdown-editor/spec.md
// No request body (filepath in query param)
```

### LoadFileResponse

```typescript
{
  success: boolean
  filepath: string
  content: string
  mtime: number         // File modification timestamp
  sizeBytes: number
  encoding: string      // Always "utf-8"
  error?: string        // Present if success=false
}
```

### SaveFileRequest

```typescript
// POST /api/edit/save
{
  filepath: string
  content: string
  originalMtime: number  // For conflict detection
}
```

### SaveFileResponse

```typescript
{
  success: boolean
  mtime: number         // New mtime after save (if success=true)
  conflict?: boolean    // True if file was modified externally
  error?: string        // Present if success=false
}
```

### CheckModifiedRequest

```typescript
// GET /api/edit/check-modified?filepath=...&mtime=...
// Query params: filepath (string), mtime (number)
```

### CheckModifiedResponse

```typescript
{
  modified: boolean     // True if file changed externally
  currentMtime: number  // Current file mtime
}
```

---

## Database Schema

**Not Applicable**: This feature uses file-based storage only. No database tables or migrations required.

All state is either:
- **Transient**: EditSession (browser memory, cleared on save/cancel)
- **Persistent**: MarkdownFile (filesystem), EditDraft (localStorage)

---

## Validation & Business Rules

### Edit Session Start (FR-010a: Large File Warning)

```python
if markdown_file.size_bytes >= 5 * 1024 * 1024:  # 5MB threshold
    return {"warning": "large_file", "size_mb": markdown_file.size_bytes / 1024 / 1024}
```

### Save Operation (FR-011: Conflict Detection)

```python
if markdown_file.check_modified(request.original_mtime):
    return {"success": False, "conflict": True}
else:
    markdown_file.save(request.content)
    return {"success": True, "mtime": markdown_file.mtime}
```

### UTF-8 Enforcement (FR-003a)

```python
try:
    content = filepath.read_text(encoding='utf-8')
except UnicodeDecodeError:
    raise ValueError("File is not UTF-8 encoded. Cannot edit.")
```

### Size Validation (FR-010)

```python
if filepath.stat().st_size > 10 * 1024 * 1024:  # 10MB limit
    raise ValueError("File exceeds 10MB size limit. Cannot edit.")
```

---

## Performance Considerations

### Memory Impact

- **MarkdownFile**: Holds entire file content in memory. Max 10MB per instance.
- **EditSession**: Holds original + current content. Max ~20MB (10MB × 2) per session.
- **EditDraft**: localStorage limit 5-10MB. Single large file draft uses most quota.

**Mitigation**: Single-user tool with one edit session at a time. Memory usage bounded at ~30MB worst case.

### Timestamp Resolution

- **Filesystem mtime**: Second-precision on most systems, sub-second on modern filesystems
- **Conflict detection**: Uses exact float comparison (`!=`), handles sub-second precision correctly
- **Edge case**: If same-second modification by external editor, content comparison fallback recommended

### localStorage Quota

- **Typical Limit**: 5-10MB per origin
- **Draft Size**: Same as file size (up to 10MB)
- **Handling**: Catch `QuotaExceededError`, disable auto-save, warn user

---

## Migration

**Not Required**: These are new entities. No migration from existing data structures.

Existing `Feature` model (from spec-board) remains unchanged. This feature adds editing capability without modifying core feature browsing functionality.

---

## Summary

This data model defines three entities:
1. **MarkdownFile** (server): File representation with conflict detection
2. **EditSession** (client): Active session state with auto-save
3. **EditDraft** (storage): Persistent draft in localStorage

All entities are lightweight and focused on the editing workflow. No database required - filesystem and localStorage provide sufficient persistence for single-user prototype tool.
