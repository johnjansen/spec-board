# API Contract: Load File for Editing

**Endpoint**: `GET /api/edit/load`
**Purpose**: Load markdown file content and metadata for editing session
**User Story**: US1 (Inline Content Editing)

## Request

### HTTP Method
```
GET /api/edit/load
```

### Query Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| filepath | string | Yes | Absolute path to markdown file | Must be absolute path within specs/ directory |

### Example Request
```http
GET /api/edit/load?filepath=/Users/johnjansen/Documents/GitHub/johnjansen/spec-board/specs/005-markdown-editor/spec.md HTTP/1.1
Host: localhost:8000
Accept: application/json
```

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "filepath": "/Users/johnjansen/Documents/GitHub/johnjansen/spec-board/specs/005-markdown-editor/spec.md",
  "content": "# Feature Specification: Inline Markdown Editor\n\n**Feature Branch**: `005-markdown-editor`...",
  "mtime": 1707890400.123456,
  "sizeBytes": 15234,
  "encoding": "utf-8"
}
```

### Error Responses

**404 Not Found** - File doesn't exist
```json
{
  "success": false,
  "error": "File not found: /specs/005-markdown-editor/missing.md"
}
```

**400 Bad Request** - File not UTF-8 encoded (FR-003a)
```json
{
  "success": false,
  "error": "File is not UTF-8 encoded. Cannot edit."
}
```

**400 Bad Request** - File too large (FR-010)
```json
{
  "success": false,
  "error": "File exceeds 10MB size limit (actual: 12.5MB). Cannot edit.",
  "sizeBytes": 13107200
}
```

**413 Request Entity Too Large** - File >= 5MB (FR-010a warning threshold)
```json
{
  "success": true,
  "warning": "large_file",
  "warningMessage": "File is large (6.2MB). Editing may be slow.",
  "filepath": "/specs/005-markdown-editor/large-spec.md",
  "content": "...",
  "mtime": 1707890400.123456,
  "sizeBytes": 6500000,
  "encoding": "utf-8"
}
```

**403 Forbidden** - File outside specs/ directory
```json
{
  "success": false,
  "error": "Access denied: File must be within specs/ directory"
}
```

---

## Validation Rules

### Request Validation

1. **filepath parameter**: MUST be present
2. **filepath format**: MUST be absolute path
3. **filepath security**: MUST be within specs/ directory (no path traversal)
4. **filepath existence**: File MUST exist on filesystem

### Response Validation

1. **UTF-8 encoding**: File MUST be decodable as UTF-8 (FR-003a)
2. **Size limit**: File MUST be ≤ 10MB (FR-010)
3. **Size warning**: If file ≥ 5MB, include warning field (FR-010a)
4. **mtime precision**: Return float with sub-second precision for conflict detection

---

## Business Logic

```python
def load_file_for_editing(filepath: str) -> LoadFileResponse:
    """Load markdown file for editing.

    1. Validate filepath is absolute and within specs/
    2. Check file exists
    3. Read file as UTF-8 (raise error if not UTF-8)
    4. Check file size
    5. Get mtime for conflict detection
    6. Return content + metadata
    """

    # Security: Validate path is within specs/
    if not is_within_specs_directory(filepath):
        raise ForbiddenError("File must be within specs/ directory")

    # Load file
    try:
        markdown_file = MarkdownFile.load(Path(filepath))
    except FileNotFoundError:
        raise NotFoundError(f"File not found: {filepath}")
    except UnicodeDecodeError:
        raise BadRequestError("File is not UTF-8 encoded. Cannot edit.")
    except ValueError as e:  # Size > 10MB
        raise BadRequestError(str(e))

    # Check for large file warning
    warning = None
    if markdown_file.size_bytes >= 5 * 1024 * 1024:  # 5MB
        warning = {
            "type": "large_file",
            "message": f"File is large ({markdown_file.size_bytes / (1024*1024):.1f}MB). Editing may be slow."
        }

    return {
        "success": True,
        "filepath": str(markdown_file.filepath),
        "content": markdown_file.content,
        "mtime": markdown_file.mtime,
        "sizeBytes": markdown_file.size_bytes,
        "encoding": markdown_file.encoding,
        "warning": warning
    }
```

---

## Frontend Integration

### HTMX Example
```html
<button hx-get="/api/edit/load?filepath=/specs/005-markdown-editor/spec.md"
        hx-target="#editor-container"
        hx-trigger="click">
  Edit
</button>
```

### JavaScript Example
```javascript
async function loadFileForEditing(filepath) {
  const response = await fetch(`/api/edit/load?filepath=${encodeURIComponent(filepath)}`)
  const data = await response.json()

  if (!data.success) {
    showErrorModal(data.error)
    return null
  }

  if (data.warning?.type === 'large_file') {
    const proceed = await showLargeFileWarning(data.warning.message)
    if (!proceed) return null
  }

  // Initialize editor with data.content, data.mtime
  startEditSession(filepath, data.content, data.mtime)
  return data
}
```

---

## Error Handling

### Client-Side Handling

| Status Code | Client Action |
|-------------|---------------|
| 200 OK | Load content into editor, start auto-save timer |
| 200 OK + warning | Show large file modal, then load editor if user proceeds |
| 400 Bad Request (UTF-8) | Show error modal: "File encoding not supported" |
| 400 Bad Request (size) | Show error modal: "File too large to edit" |
| 403 Forbidden | Show error modal: "Access denied" |
| 404 Not Found | Show error modal: "File not found" |
| 500 Internal Server Error | Show error modal: "Failed to load file. Retry?" |

---

## Performance Considerations

- **File reading**: Async I/O recommended for large files
- **UTF-8 validation**: Built-in Python codec validation (fast)
- **mtime retrieval**: Single stat() syscall (< 1ms)
- **Response size**: Matches file size (up to 10MB response body)

**Expected latency**: <100ms for typical files (<1MB), <500ms for large files (5-10MB)

---

## Security Considerations

1. **Path Traversal**: Validate filepath is within specs/ directory
2. **Symlink Attacks**: Resolve symlinks and validate resolved path
3. **Sensitive Files**: Ensure specs/ directory doesn't contain secrets
4. **File Permissions**: Respect filesystem permissions (return 403 if unreadable)

---

## Testing Scenarios

From quickstart.md:

1. **Scenario 1**: Load spec.md successfully
2. **Scenario 6**: Load file with only validation tasks
3. **Scenario 7**: Load file with no validation tasks
4. **Scenario 8**: Load missing file (expect 404)
5. **Scenario 8**: Load empty file (expect success with empty content)
6. **Scenario 10**: Load file with unicode/emoji (UTF-8 validation)
7. **Large file**: Load 6MB file (expect warning)
8. **Too large**: Load 11MB file (expect 400 error)
