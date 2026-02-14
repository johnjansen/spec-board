# API Contract: Check File Modified

**Endpoint**: `GET /api/edit/check-modified`
**Purpose**: Check if file was modified externally during edit session (optional periodic check)
**User Story**: US1 (Inline Content Editing) - Enhanced UX for conflict detection

## Overview

This endpoint is **optional** for enhanced user experience. The primary conflict detection happens during save (see api-save.md). This endpoint allows proactive conflict detection during editing via periodic polling (e.g., every 30 seconds) to alert users earlier.

**Implementation Priority**: P2 (not required for MVP)

---

## Request

### HTTP Method
```
GET /api/edit/check-modified
```

### Query Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| filepath | string | Yes | Absolute path to markdown file | Must be within specs/ directory |
| mtime | number | Yes | Original file mtime when editing started | Float timestamp |

### Example Request
```http
GET /api/edit/check-modified?filepath=/specs/005-markdown-editor/spec.md&mtime=1707890400.123456 HTTP/1.1
Host: localhost:8000
Accept: application/json
```

---

## Response

### Success Response (200 OK) - No Conflict

```json
{
  "modified": false,
  "currentMtime": 1707890400.123456
}
```

### Success Response (200 OK) - Conflict Detected

```json
{
  "modified": true,
  "currentMtime": 1707890900.654321
}
```

### Error Responses

**404 Not Found** - File doesn't exist
```json
{
  "error": "File not found: /specs/005-markdown-editor/missing.md"
}
```

**403 Forbidden** - File outside specs/ directory
```json
{
  "error": "Access denied: File must be within specs/ directory"
}
```

---

## Business Logic

```python
def check_file_modified(filepath: str, original_mtime: float) -> CheckModifiedResponse:
    """Check if file was modified externally.

    1. Validate filepath is within specs/
    2. Get current file mtime
    3. Compare with original mtime
    4. Return modified flag + current mtime
    """

    # Security: Validate path
    if not is_within_specs_directory(filepath):
        raise ForbiddenError("File must be within specs/ directory")

    # Get current mtime
    try:
        current_mtime = Path(filepath).stat().st_mtime
    except FileNotFoundError:
        raise NotFoundError(f"File not found: {filepath}")

    # Compare timestamps
    modified = (current_mtime != original_mtime)

    return {
        "modified": modified,
        "currentMtime": current_mtime
    }
```

---

## Frontend Integration

### Periodic Polling Example

```javascript
// Poll every 30 seconds during edit session
let conflictCheckInterval = null

function startConflictChecking(filepath, originalMtime) {
  conflictCheckInterval = setInterval(async () => {
    const response = await fetch(
      `/api/edit/check-modified?filepath=${encodeURIComponent(filepath)}&mtime=${originalMtime}`
    )
    const data = await response.json()

    if (data.modified) {
      // Show warning banner (non-blocking)
      showConflictWarning("File was modified externally. Save will show conflict dialog.")
      stopConflictChecking()  // Stop polling once detected
    }
  }, 30000)  // 30 seconds
}

function stopConflictChecking() {
  if (conflictCheckInterval) {
    clearInterval(conflictCheckInterval)
    conflictCheckInterval = null
  }
}
```

### Alternative: Check on Auto-Save

```javascript
// Check conflict when auto-saving draft
async function autoSaveDraft() {
  // First check for conflict
  const conflictResponse = await fetch(
    `/api/edit/check-modified?filepath=${filepath}&mtime=${originalMtime}`
  )
  const conflictData = await conflictResponse.json()

  if (conflictData.modified) {
    showConflictWarning("File modified externally")
    // Still save draft to localStorage (user can decide later)
  }

  // Save draft
  saveDraftToLocalStorage()
}
```

---

## Use Cases

### Use Case 1: Proactive Conflict Warning

**Scenario**: User is editing for 5 minutes. External process modifies file. Periodic check detects conflict before user attempts save.

**Flow**:
1. User opens editor (mtime = 1000)
2. Periodic check runs every 30s (1030, 1060, 1090...)
3. At 1060, external process modifies file (new mtime = 1050)
4. Check at 1090 detects conflict (1050 != 1000)
5. Show non-blocking warning banner: "File modified externally"
6. User can choose to reload now or continue editing
7. When user clicks "Save", save endpoint shows conflict modal

**Benefit**: User is aware of conflict before attempting save, reducing surprise.

### Use Case 2: Combined with Auto-Save

**Scenario**: Check conflict as part of auto-save workflow.

**Flow**:
1. Every 30s, auto-save runs
2. Before saving draft, check if file modified
3. If modified, show warning but still save draft (draft can be discarded later)
4. User decides whether to reload or continue

---

## Error Handling

### Client-Side Handling

| Status Code | Client Action |
|-------------|---------------|
| 200 OK (modified=false) | Continue normally, no conflict |
| 200 OK (modified=true) | Show non-blocking warning banner |
| 404 Not Found | File was deleted externally - show modal, disable save |
| 403 Forbidden | Show error (shouldn't happen if edit session started successfully) |

### Warning Banner UX

```html
<div id="conflict-warning" class="hidden bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
  <p class="text-yellow-700">
    ⚠️ File was modified externally. Save will prompt for conflict resolution.
    <button onclick="reloadFile()" class="underline">Reload now</button>
  </p>
</div>
```

---

## Performance Considerations

- **Request frequency**: 30-second interval = 120 requests per hour per edit session
- **Overhead**: Single stat() syscall (<1ms)
- **Network**: Minimal payload (~50 bytes request, ~70 bytes response)
- **Battery**: Negligible impact on laptop battery (1 request every 30s)

**Expected latency**: <10ms (file stat is very fast)

---

## Implementation Notes

### MVP Approach (Recommended)

For MVP (P1), **skip this endpoint**. Only implement conflict detection in save endpoint (api-save.md). Rationale:
- Simpler implementation (one less endpoint)
- Conflicts are rare in single-user environment
- User will see conflict modal on save anyway
- Reduces backend surface area

### Enhanced UX (P2)

If implementing enhanced conflict detection:
1. Add this endpoint for periodic checks
2. Run checks every 30 seconds during edit (same as auto-save)
3. Show non-blocking warning banner if conflict detected
4. User can choose to reload immediately or continue editing

---

## Alternative: File Watcher Approach

Instead of polling, could use WebSockets + file system watchers:

```python
# Backend: Watch file for changes
import watchdog

def watch_file(filepath):
    observer = watchdog.observers.Observer()
    observer.schedule(FileChangeHandler(), path=filepath.parent)
    observer.start()

    # On file change, push notification via WebSocket
```

**Rejected for MVP**: Over-engineering for prototype. Polling is sufficient.

---

## Security Considerations

1. **Path Traversal**: Validate filepath is within specs/ directory
2. **Information Disclosure**: Endpoint reveals file existence/modification times
3. **DoS**: Rate limit to prevent polling abuse (e.g., max 1 request per 10 seconds)

---

## Testing Scenarios

1. **No conflict**: Check file that hasn't been modified (expect modified=false)
2. **Conflict detected**: Modify file externally, then check (expect modified=true)
3. **File deleted**: Delete file externally, then check (expect 404)
4. **Invalid path**: Check file outside specs/ (expect 403)
5. **Polling stress**: Run 100 consecutive checks (expect all succeed <10ms)

---

## Decision: Implement or Skip?

**Recommendation**: **Skip for MVP (P1)**

**Rationale**:
- Conflict detection in save endpoint (api-save.md) is sufficient
- Single-user environment has low conflict frequency
- Adds complexity (polling, cleanup on session end)
- User can still save and see conflict modal when it happens

**If implementing later (P2)**:
- Integrate with auto-save (check conflict before saving draft)
- Show non-blocking warning, don't force action
- Stop polling once conflict detected (no need to keep checking)
