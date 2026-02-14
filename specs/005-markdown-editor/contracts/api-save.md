# API Contract: Save File from Editor

**Endpoint**: `POST /api/edit/save`
**Purpose**: Save edited markdown content to file with conflict detection
**User Story**: US1 (Inline Content Editing)

## Request

### HTTP Method
```
POST /api/edit/save
```

### Request Body

```json
{
  "filepath": "/Users/johnjansen/Documents/GitHub/johnjansen/spec-board/specs/005-markdown-editor/spec.md",
  "content": "# Feature Specification: Inline Markdown Editor\n\n**Updated content...**",
  "originalMtime": 1707890400.123456
}
```

### Request Schema

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| filepath | string | Yes | Absolute path to markdown file | Must be within specs/ directory |
| content | string | Yes | Updated markdown content | Must be valid UTF-8 |
| originalMtime | number | Yes | File mtime when editing started | Used for conflict detection |

### Example Request
```http
POST /api/edit/save HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Accept: application/json

{
  "filepath": "/Users/johnjansen/Documents/GitHub/johnjansen/spec-board/specs/005-markdown-editor/spec.md",
  "content": "# Updated Content\n\nNew paragraph here...",
  "originalMtime": 1707890400.123456
}
```

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "mtime": 1707891000.654321,
  "sizeBytes": 15500
}
```

### Conflict Response (409 Conflict)

```json
{
  "success": false,
  "conflict": true,
  "message": "File was modified externally. Choose 'Reload' to discard your changes, or 'Keep Editing' to overwrite.",
  "currentMtime": 1707890900.999999
}
```

### Error Responses

**400 Bad Request** - Missing required field
```json
{
  "success": false,
  "error": "Missing required field: content"
}
```

**400 Bad Request** - UTF-8 encoding error
```json
{
  "success": false,
  "error": "Content contains invalid UTF-8 characters. Cannot save."
}
```

**403 Forbidden** - File outside specs/ directory
```json
{
  "success": false,
  "error": "Access denied: File must be within specs/ directory"
}
```

**404 Not Found** - File doesn't exist
```json
{
  "success": false,
  "error": "File not found: /specs/005-markdown-editor/missing.md"
}
```

**500 Internal Server Error** - Write failure (disk full, permissions)
```json
{
  "success": false,
  "error": "Failed to save file: Disk quota exceeded",
  "retryable": true
}
```

---

## Validation Rules

### Request Validation

1. **filepath**: MUST be present, absolute path, within specs/
2. **content**: MUST be present, valid UTF-8 string
3. **originalMtime**: MUST be present, number (float)
4. **Content size**: Resulting file MUST be ≤ 10MB after save

### Conflict Detection (FR-011)

```python
current_mtime = filepath.stat().st_mtime
if current_mtime != request.originalMtime:
    return ConflictResponse(409)  # File modified externally
```

### Write Validation

1. **UTF-8 encoding**: Content MUST be writable as UTF-8
2. **File permissions**: User MUST have write permission
3. **Disk space**: System MUST have sufficient disk space

---

## Business Logic

```python
def save_file_from_editor(request: SaveFileRequest) -> SaveFileResponse:
    """Save edited markdown content with conflict detection.

    1. Validate filepath is within specs/
    2. Check file exists
    3. Detect external modifications (compare mtime)
    4. If conflict: return 409 Conflict
    5. Write content to file as UTF-8
    6. Return new mtime
    """

    # Security: Validate path is within specs/
    if not is_within_specs_directory(request.filepath):
        raise ForbiddenError("File must be within specs/ directory")

    # Load current file for conflict check
    try:
        markdown_file = MarkdownFile.load(Path(request.filepath))
    except FileNotFoundError:
        raise NotFoundError(f"File not found: {request.filepath}")

    # Conflict detection (FR-011)
    if markdown_file.check_modified(request.originalMtime):
        return {
            "success": False,
            "conflict": True,
            "message": "File was modified externally. Choose 'Reload' or 'Keep Editing'.",
            "currentMtime": markdown_file.mtime
        }, 409

    # Save content
    try:
        markdown_file.save(request.content)
    except UnicodeEncodeError:
        raise BadRequestError("Content contains invalid UTF-8 characters")
    except OSError as e:
        raise InternalServerError(f"Failed to save file: {e}", retryable=True)

    return {
        "success": True,
        "mtime": markdown_file.mtime,
        "sizeBytes": markdown_file.size_bytes
    }
```

---

## Frontend Integration

### JavaScript Example
```javascript
async function saveFile(filepath, content, originalMtime) {
  const response = await fetch('/api/edit/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filepath, content, originalMtime })
  })

  const data = await response.json()

  if (data.success) {
    // Save successful
    showSuccessToast("File saved successfully")
    clearLocalStorageDraft()
    endEditSession()
    return { success: true, mtime: data.mtime }
  }

  if (data.conflict) {
    // Show conflict modal (FR-011)
    const action = await showConflictModal()
    if (action === 'reload') {
      // Discard edits, reload file
      location.reload()
    } else {
      // Keep editing (user stays in editor with stale content)
      return { success: false, conflict: true }
    }
  }

  // Other error - show error modal with retry
  const retry = await showErrorModal(data.error)
  if (retry) {
    return saveFile(filepath, content, originalMtime)  // Retry
  }

  return { success: false, error: data.error }
}
```

---

## Error Handling

### Client-Side Handling

| Status Code | Client Action |
|-------------|---------------|
| 200 OK | Show success confirmation, clear draft, return to view mode |
| 409 Conflict | Show conflict modal: "Reload" / "Keep Editing" (FR-011) |
| 400 Bad Request | Show error modal with message, keep editor open |
| 403 Forbidden | Show error modal: "Access denied" |
| 404 Not Found | Show error modal: "File not found" |
| 500 Internal Server Error | Show error modal with "Retry" button (FR-009) |

### Retry Logic (FR-009)

For retryable errors (500, network timeout):
1. Show modal dialog with error message and "Retry" button
2. Preserve editor content (don't lose user work)
3. On "Retry", call save endpoint again with same parameters
4. Limit retries to 3 attempts, then show "Copy content" option

---

## Conflict Resolution Workflow (FR-011)

**Scenario**: User is editing file, external process (VS Code, git pull) modifies the same file

```
1. User clicks "Save"
2. Backend detects mtime mismatch (current != original)
3. Backend returns 409 Conflict
4. Frontend shows modal:
   ┌─────────────────────────────────────────┐
   │  File Modified Externally               │
   │                                         │
   │  This file has been modified outside    │
   │  the editor. Choose an option:          │
   │                                         │
   │  [Reload]  [Keep Editing]               │
   └─────────────────────────────────────────┘

5a. If "Reload": Discard edits, reload file, return to view mode
5b. If "Keep Editing": Stay in editor, user can attempt save again (will overwrite external changes)
```

**User Clarification Q1**: Modal offers "Reload" (discard edits) or "Keep Editing" (continue with stale content)

---

## Performance Considerations

- **Conflict check**: Single stat() syscall (<1ms)
- **File write**: Atomic write recommended (write to temp file, then rename)
- **UTF-8 encoding**: Built-in Python codec (fast)
- **Request size**: Matches content size (up to 10MB)

**Expected latency**: <100ms for typical files (<1MB), <500ms for large files (5-10MB)

**Success Criteria**: SC-002 requires save confirmation within 2 seconds

---

## Atomic Write Pattern

To prevent data loss on write failure:

```python
def atomic_write(filepath: Path, content: str) -> None:
    """Write file atomically to prevent partial writes."""
    temp_path = filepath.with_suffix('.tmp')
    try:
        temp_path.write_text(content, encoding='utf-8')
        temp_path.replace(filepath)  # Atomic on POSIX systems
    except Exception:
        if temp_path.exists():
            temp_path.unlink()  # Clean up temp file
        raise
```

---

## Security Considerations

1. **Path Traversal**: Validate filepath is within specs/ directory
2. **Symlink Attacks**: Resolve symlinks and validate resolved path
3. **File Permissions**: Respect filesystem permissions (return 500 if unwritable)
4. **Content Injection**: No special handling needed - markdown is text content, not code
5. **CSRF Protection**: Consider CSRF token for POST requests if adding authentication

---

## Testing Scenarios

From quickstart.md:

1. **Scenario 1-2**: Save edited spec.md successfully
2. **Scenario 3**: Cancel edit without saving (no API call)
3. **Scenario 6**: Save file with validation tasks (external conflict)
4. **Scenario 9**: Save after auto-refresh (verify mtime updated)
5. **Conflict**: Modify file externally during edit, then save (expect 409)
6. **Error**: Simulate disk full (expect 500 with retry)
7. **Large file**: Save 6MB file (expect success if < 2 seconds)
8. **UTF-8**: Save file with unicode/emoji (expect success)
