# Implementation Plan: Spec-Kit Visualization Dashboard

**Branch**: `002-spec-dashboard` | **Date**: 2026-02-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-spec-dashboard/spec.md`

## Summary

Build a web-based dashboard to visualize spec-kit artifacts (specs, plans, tasks) using a Miller columns UI pattern. Dashboard reads from local file system `specs/` directory and renders markdown content with full formatting support. Uses FastAPI for backend, server-side rendered HTML with Jinja2, HTMX for dynamic interactions, and Tailwind CSS for styling. Column-based interface shows progression from features → artifacts → content with drill-down navigation.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI (web framework), Jinja2 (templating), python-markdown (markdown parsing), HTMX (frontend interactions), Tailwind CSS (styling)
**Storage**: Local file system (read-only access to `specs/` directory)
**Testing**: None (per constitution Principle IV - prototype exception)
**Target Platform**: Local development server (localhost:8000)
**Project Type**: Web application (single backend, no separate frontend build)
**Performance Goals**: <2s initial page load, <500ms column updates, support 50+ features without degradation
**Constraints**: Prototype scope - minimal complexity, server-side rendering only, no database, no authentication
**Scale/Scope**: Single user, local development, read-only access, up to 50 features per project

**UI Architecture**: Miller columns pattern (4-column layout)
- Column 1: Project/Root (shows specs/ directory)
- Column 2: Features list (001-feature-name, 002-another-feature)
- Column 3: Artifacts (spec.md, plan.md, tasks.md)
- Column 4: Content view (rendered markdown)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Modern Python Tooling
✅ **PASS** - Python 3.11+, uv for package management, type hints on all signatures

### Principle II: Minimal Simplicity (Prototype)
✅ **PASS** - FastAPI is minimal and appropriate for web dashboard, HTMX avoids SPA complexity, no database (reads files directly), no unnecessary abstractions

### Principle III: One Class Per File
✅ **PASS** - Structure enforces: `file_system_reader.py`, `markdown_renderer.py`, `feature_repository.py`, etc.

### Principle IV: No Tests (Prototype Exception)
✅ **PASS** - No test directory or test files planned

### Technology Stack Alignment
✅ **PASS** - FastAPI aligns with Python/modern tooling requirement, server-side rendering keeps implementation simple, Tailwind via CDN avoids build complexity

**Constitution Status**: All gates passed - proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/002-spec-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output (dependencies, patterns)
├── data-model.md        # Phase 1 output (entities, relationships)
├── quickstart.md        # Phase 1 output (setup instructions)
└── contracts/           # Phase 1 output (API endpoints)
    └── endpoints.md
```

### Source Code (repository root)

```text
src/
├── __init__.py
├── models/                    # Data models (one class per file)
│   ├── __init__.py
│   ├── project.py            # Project entity
│   ├── feature.py            # Feature entity
│   ├── artifact.py           # Artifact entity (spec/plan/tasks)
│   └── artifact_metadata.py  # Metadata extraction
├── services/                  # Business logic (one class per file)
│   ├── __init__.py
│   ├── file_system_reader.py       # Reads specs/ directory
│   ├── markdown_renderer.py        # Parses and renders markdown
│   ├── feature_repository.py       # Feature CRUD operations
│   └── artifact_parser.py          # Parses artifact frontmatter
├── web/                       # Web layer
│   ├── __init__.py
│   ├── app.py                # FastAPI application entry point
│   ├── routes.py             # HTTP route handlers
│   └── dependencies.py       # FastAPI dependency injection
└── templates/                 # Jinja2 HTML templates
    ├── base.html             # Base template with Tailwind CDN
    ├── dashboard.html        # Main 4-column dashboard
    ├── components/
    │   ├── column_features.html    # Column 2: features list
    │   ├── column_artifacts.html   # Column 3: artifacts list
    │   └── column_content.html     # Column 4: markdown content
    └── partials/
        └── markdown_body.html      # Rendered markdown partial

static/                        # Static assets (minimal - prototype)
├── styles.css                # Custom CSS overrides (if needed)
└── htmx.min.js              # HTMX library (or use CDN)

pyproject.toml                # uv configuration
README.md                     # Project documentation
.venv/                        # Virtual environment (not committed)
```

**Structure Decision**: Single web application with server-side rendering. No separate frontend build process. FastAPI serves HTML templates with HTMX for dynamic column updates. Tailwind CSS via CDN (no build step). Follows constitution's simple structure with one class per file in models/ and services/.

## Complexity Tracking

> **No violations - all constitution principles followed**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

**Notes**:
- FastAPI chosen over Flask: Better async support, built-in OpenAPI docs, type hints integration
- HTMX chosen over vanilla JS: Minimal JavaScript, declarative, aligns with simplicity principle
- Tailwind CDN: Avoids build step complexity for prototype
- Server-side rendering: Simpler than SPA, better for prototype validation
