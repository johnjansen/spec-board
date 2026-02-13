# Research: Spec-Kit Visualization Dashboard

**Feature**: 002-spec-dashboard
**Date**: 2026-02-13
**Purpose**: Technology decisions and patterns for implementation

## Decision 1: FastAPI with Jinja2 for Server-Side Rendering

**Decision**: Use FastAPI with Jinja2 templates for server-side HTML rendering

**Rationale**:
- FastAPI provides excellent type hint integration (aligns with constitution)
- Jinja2 is mature, well-documented, and widely used
- Server-side rendering keeps frontend complexity minimal (prototype principle)
- Built-in async support for potential file I/O operations
- Automatic OpenAPI documentation for future API needs

**Alternatives Considered**:
- **Flask**: More mature but lacks built-in async and type support
- **Django**: Too heavyweight for prototype, violates simplicity principle
- **Starlette** (FastAPI's foundation): Would require more manual setup

**Implementation Notes**:
```python
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

app = FastAPI()
templates = Jinja2Templates(directory="src/templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})
```

## Decision 2: HTMX for Dynamic Column Updates

**Decision**: Use HTMX for partial page updates without full page reloads

**Rationale**:
- Declarative HTML attributes (hx-get, hx-target, hx-swap) keep logic in templates
- No JavaScript framework complexity (React/Vue/Angular)
- Perfect for Miller columns pattern - each column click fetches next column
- Progressive enhancement - works without JavaScript (degrades gracefully)
- Minimal learning curve, aligns with prototype simplicity

**Alternatives Considered**:
- **Vanilla JavaScript**: More code, harder to maintain, violates simplicity
- **Alpine.js**: Adds reactivity we don't need for this use case
- **Full SPA (React/Vue)**: Massive overkill, requires build process, violates constitution

**Implementation Pattern**:
```html
<!-- Column 2: Features list -->
<div id="column-features" class="column">
  <div hx-get="/features" hx-trigger="load" hx-target="#column-features">
    Loading features...
  </div>
</div>

<!-- Column 3: Artifacts (loaded when feature clicked) -->
<div id="column-artifacts" class="column">
  <!-- Populated by HTMX when feature clicked -->
</div>

<!-- Feature click triggers artifact list load -->
<div class="feature-item"
     hx-get="/features/002-spec-dashboard/artifacts"
     hx-target="#column-artifacts"
     hx-swap="innerHTML">
  002-spec-dashboard
</div>
```

## Decision 3: Python-Markdown for Rendering

**Decision**: Use python-markdown library with extensions for full markdown support

**Rationale**:
- Pure Python implementation (no external dependencies)
- Supports extensions (tables, code highlighting, TOC)
- CommonMark compliant (matches spec-kit markdown standard)
- Simple API: `markdown.markdown(text, extensions=[...])`
- Widely used and maintained

**Alternatives Considered**:
- **mistletoe**: Faster but less extension ecosystem
- **commonmark**: Strict CommonMark but fewer features
- **markdown2**: Older, less active development

**Required Extensions**:
```python
import markdown

extensions = [
    'markdown.extensions.fenced_code',  # ```python blocks
    'markdown.extensions.tables',       # GFM tables
    'markdown.extensions.toc',          # Table of contents
    'markdown.extensions.nl2br',        # Newline to <br>
    'markdown.extensions.codehilite',   # Syntax highlighting
]

html = markdown.markdown(markdown_text, extensions=extensions)
```

**Dependencies**:
```bash
uv add "markdown>=3.5"
uv add "pygments"  # For syntax highlighting
```

## Decision 4: Tailwind CSS via CDN

**Decision**: Use Tailwind CSS via CDN link (no build process)

**Rationale**:
- Zero build complexity for prototype
- Utility-first CSS enables rapid UI development
- Responsive utilities (md:, lg:) for column layout
- Consistent design system out of the box
- Can add custom CSS file for overrides if needed

**Alternatives Considered**:
- **Bootstrap**: Component-heavy, harder to customize
- **Custom CSS**: Time-consuming, inconsistent
- **Tailwind CLI**: Adds build step complexity

**Implementation**:
```html
<!-- base.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spec-Board Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
</head>
<body class="bg-gray-50">
    {% block content %}{% endblock %}
</body>
</html>
```

## Decision 5: Miller Columns UI Pattern

**Decision**: Implement 4-column layout with left-to-right drill-down navigation

**Rationale**:
- Familiar pattern (macOS Finder, music players)
- Shows context (previous columns remain visible)
- Natural progression: Project → Features → Artifacts → Content
- HTMX perfect for this (each click loads next column)
- Responsive: can stack vertically on narrow screens

**Column Responsibilities**:
1. **Column 1 (Project)**: Root level - shows specs/ directory path and project name
2. **Column 2 (Features)**: List all feature directories (001-feature-name, 002-another)
3. **Column 3 (Artifacts)**: Show available files (spec.md ✓, plan.md ✓, tasks.md ✗)
4. **Column 4 (Content)**: Rendered markdown content with full formatting

**Layout Structure**:
```html
<div class="flex h-screen overflow-hidden">
  <!-- Column 1: Project Root -->
  <div class="w-1/6 border-r bg-white overflow-y-auto">
    <div class="p-4">
      <h2 class="font-bold">Project</h2>
      <div class="text-sm text-gray-600">specs/</div>
    </div>
  </div>

  <!-- Column 2: Features -->
  <div id="column-features" class="w-1/6 border-r bg-white overflow-y-auto">
    <!-- Loaded via HTMX -->
  </div>

  <!-- Column 3: Artifacts -->
  <div id="column-artifacts" class="w-1/6 border-r bg-white overflow-y-auto">
    <!-- Loaded when feature selected -->
  </div>

  <!-- Column 4: Content -->
  <div id="column-content" class="flex-1 bg-white overflow-y-auto p-8">
    <!-- Loaded when artifact selected -->
  </div>
</div>
```

## Decision 6: File System Scanning Pattern

**Decision**: Scan `specs/` directory on demand (no caching for prototype)

**Rationale**:
- Simplest implementation - os.listdir() and Path.exists()
- No need for file watchers or caching in prototype
- File system reads are fast enough for <50 features
- Avoids complexity of cache invalidation
- Always shows current state (no stale data)

**Implementation Pattern**:
```python
from pathlib import Path
from typing import List

class FileSystemReader:
    def __init__(self, specs_dir: Path):
        self.specs_dir = specs_dir

    def list_features(self) -> List[str]:
        """Scan specs/ directory for feature folders."""
        if not self.specs_dir.exists():
            return []

        features = []
        for item in self.specs_dir.iterdir():
            if item.is_dir() and item.name[0].isdigit():
                features.append(item.name)

        return sorted(features)  # Sort by number prefix

    def get_artifacts(self, feature_name: str) -> dict:
        """Check which artifacts exist for a feature."""
        feature_dir = self.specs_dir / feature_name
        return {
            'spec': (feature_dir / 'spec.md').exists(),
            'plan': (feature_dir / 'plan.md').exists(),
            'tasks': (feature_dir / 'tasks.md').exists(),
        }
```

## Decision 7: Dependency Management with uv

**Decision**: Use uv for all dependency management and project initialization

**Core Dependencies**:
```toml
[project]
name = "spec-board"
version = "0.1.0"
description = "Dashboard for visualizing spec-kit artifacts"
requires-python = ">=3.11"

dependencies = [
    "fastapi>=0.109.0",
    "jinja2>=3.1.2",
    "markdown>=3.5.0",
    "pygments>=2.17.0",
    "uvicorn[standard]>=0.27.0",  # ASGI server
    "python-multipart>=0.0.6",    # Form parsing (if needed)
]

[project.optional-dependencies]
dev = [
    "ruff>=0.1.0",  # Linting and formatting
]
```

**Setup Commands**:
```bash
# Initialize project
uv init

# Add dependencies
uv add fastapi jinja2 markdown pygments "uvicorn[standard]"

# Run development server
uv run uvicorn src.web.app:app --reload
```

## Implementation Sequence

1. **Setup Phase**:
   - Initialize uv project with pyproject.toml
   - Create src/ directory structure
   - Add FastAPI + Jinja2 + HTMX base template

2. **Data Layer**:
   - Implement FileSystemReader class
   - Implement Feature, Artifact models with type hints
   - Implement ArtifactParser for frontmatter extraction

3. **Service Layer**:
   - Implement MarkdownRenderer with extensions
   - Implement FeatureRepository (uses FileSystemReader)

4. **Web Layer**:
   - Create FastAPI app with Jinja2 templates
   - Implement routes for columns (/, /features, /features/{id}/artifacts, /artifacts/{feature}/{type})
   - Create HTML templates for 4-column layout

5. **Styling**:
   - Add Tailwind CSS utilities for Miller columns
   - Add minimal custom CSS for markdown rendering
   - Responsive layout for mobile (stacked columns)

## Risk Assessment

**Low Risk**:
- FastAPI/Jinja2 are proven, well-documented
- HTMX has strong community and examples
- File system operations are straightforward
- No external APIs or databases

**Medium Risk**:
- Markdown rendering edge cases (malformed files)
- Large file handling (10k+ line markdown)
- Frontmatter parsing variations

**Mitigation**:
- Wrap markdown parsing in try/except with clear error messages
- Add file size checks before rendering
- Document expected frontmatter format

## Success Metrics

- [ ] FastAPI server starts in <5 seconds
- [ ] Column updates via HTMX feel instant (<100ms)
- [ ] Markdown renders correctly for all spec-kit templates
- [ ] All 4 columns visible and functional on desktop screens
- [ ] Project with 50 features loads without lag
