# API Endpoints: Spec-Kit Visualization Dashboard

**Feature**: 002-spec-dashboard
**Date**: 2026-02-13
**Base URL**: `http://localhost:8000`
**Protocol**: HTTP/1.1
**Content Types**: HTML (server-side rendered), JSON (optional future use)

## Overview

All endpoints return server-side rendered HTML templates. HTMX requests return partial HTML fragments for column updates. No REST API required for prototype - pure HTML rendering with HTMX-driven navigation.

---

## Endpoint: GET /

**Purpose**: Main dashboard page with 4-column Miller columns layout

**Method**: `GET`

**Path**: `/`

**Query Parameters**: None

**Request Headers**:
```
Accept: text/html
```

**Response** (200 OK):
```html
Content-Type: text/html; charset=utf-8

<!DOCTYPE html>
<html>
  <head>
    <title>Spec-Board Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  </head>
  <body>
    <div class="flex h-screen">
      <!-- Column 1: Project Root -->
      <div class="w-1/6 border-r">...</div>

      <!-- Column 2: Features (loaded via HTMX) -->
      <div id="column-features" hx-get="/features" hx-trigger="load">
        Loading...
      </div>

      <!-- Column 3: Artifacts -->
      <div id="column-artifacts">...</div>

      <!-- Column 4: Content -->
      <div id="column-content">...</div>
    </div>
  </body>
</html>
```

**Errors**:
- None (always returns base template)

**Implementation**:
```python
@app.get("/")
async def dashboard(request: Request):
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request}
    )
```

---

## Endpoint: GET /features

**Purpose**: Load feature list into Column 2

**Method**: `GET`

**Path**: `/features`

**Query Parameters**: None

**Request Headers**:
```
HX-Request: true  (indicates HTMX request)
```

**Response** (200 OK):
```html
Content-Type: text/html; charset=utf-8

<div class="p-4">
  <h2 class="font-bold text-lg mb-4">Features</h2>
  <div class="space-y-2">
    <div class="feature-item p-3 hover:bg-blue-50 cursor-pointer rounded"
         hx-get="/features/001-ram-cli-tool/artifacts"
         hx-target="#column-artifacts"
         hx-swap="innerHTML">
      <div class="font-medium">001-ram-cli-tool</div>
      <div class="text-sm text-gray-500">Draft</div>
    </div>
    <div class="feature-item p-3 hover:bg-blue-50 cursor-pointer rounded"
         hx-get="/features/002-spec-dashboard/artifacts"
         hx-target="#column-artifacts"
         hx-swap="innerHTML">
      <div class="font-medium">002-spec-dashboard</div>
      <div class="text-sm text-gray-500">Planning</div>
    </div>
  </div>
</div>
```

**Response** (200 OK - No Features):
```html
<div class="p-4">
  <h2 class="font-bold text-lg mb-4">Features</h2>
  <div class="text-gray-500 text-sm">
    No features found in specs/ directory.
  </div>
</div>
```

**Errors**:
- 500 Internal Server Error: If specs/ directory unreadable

**Implementation**:
```python
@app.get("/features")
async def list_features(request: Request):
    features = feature_repo.list_all()
    return templates.TemplateResponse(
        "components/column_features.html",
        {"request": request, "features": features}
    )
```

---

## Endpoint: GET /features/{feature_id}/artifacts

**Purpose**: Load artifact list for selected feature into Column 3

**Method**: `GET`

**Path**: `/features/{feature_id}/artifacts`

**Path Parameters**:
- `feature_id` (string): Full feature directory name (e.g., "002-spec-dashboard")

**Query Parameters**: None

**Request Headers**:
```
HX-Request: true
```

**Response** (200 OK):
```html
Content-Type: text/html; charset=utf-8

<div class="p-4">
  <h2 class="font-bold text-lg mb-4">Artifacts</h2>
  <div class="space-y-2">
    <!-- spec.md (exists) -->
    <div class="artifact-item p-3 hover:bg-blue-50 cursor-pointer rounded border-l-4 border-green-500"
         hx-get="/artifacts/002-spec-dashboard/spec"
         hx-target="#column-content"
         hx-swap="innerHTML">
      <div class="flex items-center justify-between">
        <span class="font-medium">spec.md</span>
        <span class="text-xs text-green-600">✓</span>
      </div>
      <div class="text-xs text-gray-500">15.2 KB</div>
    </div>

    <!-- plan.md (exists) -->
    <div class="artifact-item p-3 hover:bg-blue-50 cursor-pointer rounded border-l-4 border-green-500"
         hx-get="/artifacts/002-spec-dashboard/plan"
         hx-target="#column-content"
         hx-swap="innerHTML">
      <div class="flex items-center justify-between">
        <span class="font-medium">plan.md</span>
        <span class="text-xs text-green-600">✓</span>
      </div>
      <div class="text-xs text-gray-500">8.4 KB</div>
    </div>

    <!-- tasks.md (doesn't exist yet) -->
    <div class="artifact-item p-3 rounded border-l-4 border-gray-300 opacity-50">
      <div class="flex items-center justify-between">
        <span class="font-medium">tasks.md</span>
        <span class="text-xs text-gray-400">✗</span>
      </div>
      <div class="text-xs text-gray-400">Not created</div>
    </div>
  </div>
</div>
```

**Response** (404 Not Found):
```html
<div class="p-4">
  <h2 class="font-bold text-lg mb-4 text-red-600">Error</h2>
  <p class="text-sm">Feature "003-nonexistent" not found.</p>
</div>
```

**Errors**:
- 404 Not Found: Feature directory doesn't exist
- 500 Internal Server Error: File system read error

**Implementation**:
```python
@app.get("/features/{feature_id}/artifacts")
async def list_artifacts(feature_id: str, request: Request):
    feature = feature_repo.get_feature(feature_id)
    if not feature:
        return templates.TemplateResponse(
            "components/error.html",
            {"request": request, "message": f"Feature {feature_id} not found"},
            status_code=404
        )

    return templates.TemplateResponse(
        "components/column_artifacts.html",
        {"request": request, "feature": feature}
    )
```

---

## Endpoint: GET /artifacts/{feature_id}/{artifact_type}

**Purpose**: Load and render artifact content into Column 4

**Method**: `GET`

**Path**: `/artifacts/{feature_id}/{artifact_type}`

**Path Parameters**:
- `feature_id` (string): Feature directory name (e.g., "002-spec-dashboard")
- `artifact_type` (string): Artifact type - one of: "spec", "plan", "tasks"

**Query Parameters**: None

**Request Headers**:
```
HX-Request: true
```

**Response** (200 OK):
```html
Content-Type: text/html; charset=utf-8

<div class="p-8 max-w-4xl prose prose-slate">
  <!-- Breadcrumb -->
  <div class="text-sm text-gray-500 mb-4">
    002-spec-dashboard &gt; spec.md
  </div>

  <!-- Rendered Markdown -->
  <h1>Feature Specification: Spec-Kit Visualization Dashboard</h1>

  <p><strong>Feature Branch</strong>: <code>002-spec-dashboard</code><br>
  <strong>Created</strong>: 2026-02-13<br>
  <strong>Status</strong>: Draft</p>

  <h2>User Scenarios &amp; Testing</h2>
  <h3>User Story 1 - View All Features (Priority: P1)</h3>
  <p>As a developer, I want to...</p>

  <!-- Full rendered markdown content -->
</div>
```

**Response** (200 OK - File Not Found):
```html
<div class="p-8">
  <div class="bg-yellow-50 border border-yellow-200 rounded p-4">
    <h3 class="font-bold text-yellow-800">Artifact Not Created</h3>
    <p class="text-sm text-yellow-700">
      The file <code>tasks.md</code> hasn't been created yet for this feature.
    </p>
    <p class="text-xs text-yellow-600 mt-2">
      Run <code>/speckit.tasks</code> to generate the task breakdown.
    </p>
  </div>
</div>
```

**Response** (200 OK - Malformed Markdown):
```html
<div class="p-8">
  <div class="bg-red-50 border border-red-200 rounded p-4">
    <h3 class="font-bold text-red-800">Markdown Parsing Error</h3>
    <p class="text-sm text-red-700">
      Failed to render markdown content.
    </p>
    <details class="mt-2">
      <summary class="text-xs cursor-pointer">Error Details</summary>
      <pre class="text-xs bg-gray-100 p-2 mt-1">Error message here...</pre>
    </details>
  </div>

  <!-- Fallback: show raw content -->
  <div class="mt-4">
    <h4 class="font-bold">Raw Content:</h4>
    <pre class="bg-gray-50 p-4 text-xs overflow-auto">
      [Raw markdown content here...]
    </pre>
  </div>
</div>
```

**Errors**:
- 404 Not Found: Feature or artifact type invalid
- 500 Internal Server Error: File read or markdown parsing critical failure

**Implementation**:
```python
@app.get("/artifacts/{feature_id}/{artifact_type}")
async def view_artifact(
    feature_id: str,
    artifact_type: str,
    request: Request
):
    # Validate artifact_type
    if artifact_type not in ["spec", "plan", "tasks"]:
        return templates.TemplateResponse(
            "components/error.html",
            {"request": request, "message": "Invalid artifact type"},
            status_code=404
        )

    # Get feature and artifact
    feature = feature_repo.get_feature(feature_id)
    if not feature:
        return templates.TemplateResponse(
            "components/error.html",
            {"request": request, "message": f"Feature {feature_id} not found"},
            status_code=404
        )

    artifact = feature.artifacts.get(artifact_type)
    if not artifact or not artifact.exists:
        return templates.TemplateResponse(
            "components/artifact_not_found.html",
            {
                "request": request,
                "feature_id": feature_id,
                "artifact_type": artifact_type
            }
        )

    # Render markdown
    try:
        html_content = markdown_renderer.render(artifact)
        return templates.TemplateResponse(
            "components/column_content.html",
            {
                "request": request,
                "feature_id": feature_id,
                "artifact_type": artifact_type,
                "content": html_content
            }
        )
    except Exception as e:
        return templates.TemplateResponse(
            "components/markdown_error.html",
            {
                "request": request,
                "error": str(e),
                "raw_content": artifact.content_raw
            }
        )
```

---

## Static Assets

### GET /static/{path}

**Purpose**: Serve static files (CSS, JS, images)

**Method**: `GET`

**Path**: `/static/{path}`

**Examples**:
- `/static/styles.css` - Custom CSS overrides
- `/static/htmx.min.js` - HTMX library (if not using CDN)

**Response**: File content with appropriate Content-Type

**Implementation**:
```python
from fastapi.staticfiles import StaticFiles

app.mount("/static", StaticFiles(directory="static"), name="static")
```

---

## HTMX Headers & Behaviors

### Request Headers

HTMX adds these headers to identify dynamic requests:

```
HX-Request: true                    # Indicates HTMX request
HX-Target: column-artifacts        # Target element ID
HX-Current-URL: http://localhost:8000/
```

### Response Headers

Server can add these to control HTMX behavior:

```
HX-Push-URL: /features/002         # Update browser URL
HX-Trigger: featureSelected        # Trigger custom event
```

### HTMX Attributes Used

```html
hx-get="/features"              # GET request to URL
hx-target="#column-artifacts"   # Where to insert response
hx-swap="innerHTML"             # How to insert (innerHTML, outerHTML, etc.)
hx-trigger="load"               # When to trigger (load, click, etc.)
```

---

## Error Response Format

All error responses use consistent HTML structure:

```html
<div class="p-4">
  <div class="bg-red-50 border border-red-200 rounded p-4">
    <h3 class="font-bold text-red-800">{Error Type}</h3>
    <p class="text-sm text-red-700">{Error message}</p>
    <p class="text-xs text-gray-600 mt-2">{Suggestion or help text}</p>
  </div>
</div>
```

**Error Types**:
- "Feature Not Found" (404)
- "Artifact Not Created" (200 - expected state)
- "Markdown Parsing Error" (200 - graceful degradation)
- "Permission Denied" (403)
- "Internal Server Error" (500)

---

## Performance Characteristics

**Initial Page Load** (`GET /`):
- Target: <500ms
- Single HTML response
- HTMX and Tailwind loaded from CDN (parallel)

**Column Updates** (HTMX requests):
- Target: <100ms for features list
- Target: <200ms for artifact content
- Partial HTML response only (not full page)

**Large Files**:
- Files >1MB: Add loading spinner
- Files >10MB: Show warning, offer raw view

---

## Future Enhancements (Out of Scope for Prototype)

### REST API (JSON responses)

```http
GET /api/v1/features
Accept: application/json

Response:
{
  "features": [
    {
      "id": "002-spec-dashboard",
      "number": "002",
      "name": "spec-dashboard",
      "status": "Planning",
      "artifacts": {
        "spec": {"exists": true, "size": 15234},
        "plan": {"exists": true, "size": 8432},
        "tasks": {"exists": false}
      }
    }
  ]
}
```

### WebSocket for Live Updates

```javascript
// Future: WebSocket connection for file change notifications
ws://localhost:8000/ws
```

### Search Endpoint

```http
GET /search?q=authentication&type=spec
```

---

## Testing Endpoints (Manual Validation)

### Test 1: Basic Navigation Flow

1. `GET /` → Should load dashboard
2. Verify Column 2 auto-loads features via HTMX
3. Click feature → Column 3 loads artifacts
4. Click artifact → Column 4 renders markdown

### Test 2: Edge Cases

1. Empty specs/ directory → "No features" message
2. Feature with no artifacts → All show "Not created"
3. Malformed markdown → Error message + raw content
4. Non-existent feature ID → 404 error page

### Test 3: Performance

1. Load project with 50 features → <2s initial load
2. Click through multiple features → <200ms per click
3. Open large spec.md (1MB+) → Should render without timeout

---

## Implementation Checklist

- [ ] Define routes in `src/web/routes.py`
- [ ] Create Jinja2 templates in `src/templates/`
- [ ] Add HTMX attributes to templates
- [ ] Implement error handling for all endpoints
- [ ] Test with real spec-kit directory structure
- [ ] Verify Tailwind CSS styling renders correctly
- [ ] Manual validation of all user flows
