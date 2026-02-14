# Implementation Plan: Inline Markdown Editor

**Branch**: `005-markdown-editor` | **Date**: 2026-02-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-markdown-editor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add inline markdown editing capability to the spec-board markdown display panel, enabling users to click an "Edit" button to modify spec documents directly in the browser without external editors. The editor supports save/cancel operations, external file modification detection with modal conflict resolution, auto-save drafts to localStorage every 30 seconds for crash recovery, large file warnings (≥5MB), and UTF-8 encoding enforcement. Enhanced features include live preview toggle (P2) and keyboard shortcuts with formatting toolbar (P3).

## Technical Context

**Language/Version**: Python 3.11+ (backend), JavaScript ES6+ (frontend)
**Primary Dependencies**: FastAPI 0.109+ (existing), Jinja2 3.1+ (existing), HTMX (existing via CDN), Tailwind CSS (existing via CDN), [NEEDS CLARIFICATION: Frontend markdown editor library - CodeMirror 6, Monaco Editor, or textarea with syntax utilities]
**Storage**: File-based (local filesystem, read/write markdown files in specs/ directories)
**Testing**: Manual validation per constitution principle IV (prototype phase - no automated tests)
**Target Platform**: Web application (browser-based editor, modern browsers with localStorage support)
**Project Type**: Web application (extends existing spec-board single-project structure with FastAPI backend + Jinja2/HTMX frontend)
**Performance Goals**: <1s edit mode switch, <2s save operation, <100ms typing response, <500ms preview render (files <1MB), 10MB file support
**Constraints**: UTF-8 encoding only, manual save workflow, single-user environment, local filesystem storage, no collaborative editing
**Scale/Scope**: Single-user local tool, 10-50 spec files typically, individual files up to 10MB

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Principle I: Modern Python Tooling** ✅ PASS
- Python 3.11+ features used
- uv for package management
- Type hints will be added to all new backend code
- PEP 8 compliance maintained
- Virtual environment via uv

**Principle II: Minimal Simplicity (Prototype)** ⚠️ REVIEW NEEDED
- Extends existing web application (not adding new project)
- [NEEDS CLARIFICATION: Frontend editor library choice - direct textarea vs. library like CodeMirror]
- Auto-save to localStorage (30-second interval) adds complexity but required for data loss prevention (SC-004)
- External file detection adds complexity but required for FR-011
- **Justification for complexity**: Data loss prevention and file conflict handling are critical for user trust in editing capability

**Principle III: One Class Per File** ✅ PASS
- Backend: Will create new classes in existing structure (one per file)
  - Likely additions: EditService (save/load operations), FileConflictDetector (external modification check)
- Frontend: JavaScript modules follow similar pattern (one responsibility per file)

**Principle IV: No Tests (Prototype Exception)** ✅ PASS
- Manual validation via quickstart.md test scenarios
- No automated tests required per constitution
- Focus on rapid iteration and validation

**Overall Gate Status**: ✅ PASS (with Phase 0 research needed for editor library choice)

**Complexity Justification**:
- Auto-save localStorage: Required for SC-004 (95% success rate) and crash recovery
- External file detection: Required for FR-011 and data integrity
- Both complexities are essential for data safety, not speculative features

## Project Structure

### Documentation (this feature)

```text
specs/005-markdown-editor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api-save.md      # POST /api/edit/save endpoint
│   ├── api-load.md      # GET /api/edit/load endpoint
│   └── api-check.md     # GET /api/edit/check-modified endpoint
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── models/
│   └── edit_session.py          # [NEW] EditSession model for tracking active edits
├── services/
│   ├── edit_service.py           # [NEW] File read/write operations for editing
│   ├── file_conflict_detector.py # [NEW] External modification detection
│   └── markdown_renderer.py      # [EXISTING] Reused for preview mode
├── web/
│   ├── app.py                    # [MODIFY] Add edit endpoints
│   └── routes.py                 # [MODIFY] Add /edit routes
└── templates/
    ├── components/
    │   ├── markdown_display.html  # [MODIFY] Add "Edit" button
    │   └── markdown_editor.html   # [NEW] Editor component
    └── partials/
        └── edit_modals.html       # [NEW] Conflict/error modals

static/
├── js/
│   ├── editor.js                 # [NEW] Editor initialization and event handlers
│   ├── autosave.js               # [NEW] localStorage draft auto-save (30s interval)
│   └── edit-modals.js            # [NEW] Modal dialog handlers (conflict, error, large file)
└── css/
    └── editor.css                # [NEW] Editor-specific styles (if needed beyond Tailwind)
```

**Structure Decision**: Single web application structure. This feature extends the existing spec-board FastAPI + Jinja2/HTMX application. All backend code follows existing src/ layout with one-class-per-file. Frontend JavaScript is organized by responsibility (editor core, auto-save, modals). No new projects or services required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Auto-save to localStorage (Principle II: adds complexity) | Required for SC-004 (95% success rate) and crash recovery. User clarification Q2 confirmed this requirement. | Manual-save-only approach rejected: Creates unacceptable data loss risk from browser crashes/accidental tab closes. 30-second interval balances protection with performance. |
| External file detection (Principle II: adds complexity) | Required for FR-011 and data integrity. User clarification Q1 confirmed modal workflow. | No-detection approach rejected: Would cause silent data loss when file modified externally (e.g., VS Code edit during spec-board viewing). Critical safety feature. |

---

## Phase 0: Research (Output: research.md)

**Status**: ⏳ In Progress

**Unknowns to Resolve**:

1. **Frontend markdown editor library choice** (from Technical Context NEEDS CLARIFICATION):
   - Research options: CodeMirror 6, Monaco Editor, SimpleMDE, plain textarea with syntax utilities
   - Decision criteria: Bundle size, performance on 10MB files, UTF-8 handling, keyboard shortcut support
   - Recommendation needed for P3 (formatting toolbar) compatibility

2. **External file modification detection strategy** (from FR-011):
   - Research approaches: Timestamp comparison (mtimems), file hash (MD5/SHA), file watcher APIs
   - Decision criteria: Performance impact, reliability, cross-platform support
   - Integration with FastAPI backend

3. **localStorage API best practices** (from FR-011a/b/c):
   - Research: Storage limits, quota handling, cleanup strategies, cross-tab behavior
   - Decision: Draft format (JSON structure), uniqueness key (file path hash?)

4. **Modal dialog patterns in existing codebase** (from Q1/Q3 clarifications):
   - Research: Current modal implementation (if any), HTMX patterns for modals
   - Consistency with existing UX (e.g., task board, feature list)

**Output**: `research.md` with decisions, rationale, and alternatives for each unknown

---

## Phase 1: Design & Contracts (Output: data-model.md, contracts/, quickstart.md)

**Status**: ⏸️ Waiting (depends on Phase 0)

**Prerequisites**: research.md complete with all NEEDS CLARIFICATION resolved

### Design Artifacts

1. **data-model.md**:
   - EditSession entity (original content, current content, timestamp, file path, dirty flag)
   - MarkdownFile entity (file path, content, encoding, size, last modified)
   - State transitions: View → Edit → Save/Cancel
   - Validation rules: UTF-8 enforcement, 10MB size limit, file path validation

2. **contracts/**:
   - `api-save.md`: POST /api/edit/save (file path, content) → success/error
   - `api-load.md`: GET /api/edit/load (file path) → content + metadata
   - `api-check.md`: GET /api/edit/check-modified (file path, timestamp) → conflict boolean + latest timestamp
   - Request/response schemas, error codes, validation rules

3. **quickstart.md**:
   - 10 manual validation scenarios from spec acceptance criteria
   - Test data setup (sample markdown files)
   - Expected outcomes for each scenario
   - Coverage: US1 (edit/save), US2 (preview), US3 (toolbar), edge cases (large files, conflicts, UTF-8)

### Agent Context Update

- Run `.specify/scripts/bash/update-agent-context.sh claude`
- Add technology choices from research.md (editor library, detection strategy)
- Preserve existing spec-board context

**Output**: data-model.md, /contracts/*.md, quickstart.md, updated .claude/CLAUDE.md

---

## Constitution Re-Check (Post-Phase 1)

*Required: Re-validate gates after design artifacts are complete*

**Status**: ⏸️ Waiting (after Phase 1)

**Re-evaluation Criteria**:
- Did research.md resolve all NEEDS CLARIFICATION without violating Principle II (simplicity)?
- Does data model stay minimal (no speculative entities)?
- Are API contracts straightforward REST patterns?
- Does overall design maintain prototype velocity?

**Expected Outcome**: ✅ PASS with complexity justifications documented above

---

## Next Steps

✅ Phase 0 (Research): Run research tasks and document findings → research.md
⏸️ Phase 1 (Design): Generate design artifacts → data-model.md, contracts/, quickstart.md
⏸️ Constitution Re-Check: Validate design against principles
⏭️ **Phase 2 (Tasks)**: Run `/speckit.tasks` to generate tasks.md with implementation breakdown
⏭️ **Phase 3 (Implementation)**: Run `/speckit.implement` to execute tasks

**Estimated Complexity**: MEDIUM

- Frontend editor integration (library choice affects complexity)
- Auto-save localStorage (30-second polling, draft recovery)
- External conflict detection (file system monitoring or timestamp polling)
- Modal dialog workflows (conflict, error, large file warnings)
- 3 user stories (P1 MVP: edit/save, P2: preview, P3: toolbar)
- Extends existing web app (no new projects)
- ~8-12 backend files, ~6-8 frontend files estimated
