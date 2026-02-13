# Implementation Plan: Feature Completion Indicator

**Branch**: `003-feature-completion-indicator` | **Date**: 2026-02-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-feature-completion-indicator/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add a visual completion indicator to feature list items in the spec-board dashboard. The indicator automatically derives completion status from tasks.md phase completion percentages, showing when all implementation tasks are 100% complete. Distinct from the existing manual status badge, this provides real-time progress visibility without requiring navigation into individual features.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI 0.129+, Jinja2 3.1+, existing task_board_parser service
**Storage**: File system (read tasks.md files)
**Testing**: Manual validation (prototype phase - no automated tests per constitution)
**Target Platform**: Web application (localhost, Linux server compatible)
**Project Type**: Single project (extending existing spec-board web app)
**Performance Goals**: <200ms to calculate completion status per feature, compatible with existing 3-second polling
**Constraints**: Must not break existing feature list rendering, must handle malformed tasks.md gracefully
**Scale/Scope**: 10-50 features per repository, lightweight addition to existing codebase

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Modern Python Tooling ✅

- [x] Using Python 3.11+ (project already on 3.11+)
- [x] Using uv for package management (existing project setup)
- [x] Type hints required on new functions
- [x] PEP 8 style compliance

**Status**: PASS - Extends existing compliant codebase

### II. Minimal Simplicity (Prototype) ✅

- [x] Adds single focused feature (completion indicator)
- [x] No new abstractions - extends existing services
- [x] Reuses existing task_board_parser logic
- [x] No speculative features

**Status**: PASS - Minimal addition to existing functionality

### III. One Class Per File ✅

- [x] No new classes required - extends existing Feature model
- [x] New methods added to existing task_board_parser service
- [x] Template changes only (HTML)

**Status**: PASS - Follows existing structure

### IV. No Tests (Prototype Exception) ✅

- [x] No test files will be created
- [x] Manual validation via browser testing
- [x] Documented in acceptance scenarios

**Status**: PASS - Consistent with prototype phase

## Project Structure

### Documentation (this feature)

```text
specs/003-feature-completion-indicator/
├── spec.md              # Feature specification (already created)
├── plan.md              # This file (/speckit.plan command output)
├── data-model.md        # Phase 1 output - extends Feature model
├── quickstart.md        # Phase 1 output - manual testing scenarios
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

**Note**: No research.md or contracts/ needed - extending existing web UI, no API changes.

### Source Code (repository root)

```text
src/
├── models/
│   ├── feature.py           # [MODIFY] Add completion_percentage property
│   └── artifact.py           # [READ] Existing artifact model
│
├── services/
│   ├── task_board_parser.py # [MODIFY] Add get_completion_percentage() method
│   ├── feature_repository.py # [MODIFY] Call parser for completion data
│   └── file_system_reader.py # [READ] Existing file reader
│
├── templates/
│   └── components/
│       └── column_features.html # [MODIFY] Add completion indicator HTML
│
└── web/
    ├── routes.py            # [READ] Existing routes (no changes needed)
    └── app.py               # [READ] Existing app setup (no changes needed)
```

**Structure Decision**: Single project structure (existing spec-board codebase). This feature extends the existing models and services without adding new files, following the minimal simplicity principle. All changes are additive - no breaking changes to existing functionality.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all constitution checks passed. This feature extends existing functionality with minimal additions.

## Planning Phases Summary

### Phase 0: Research ✅

**Status**: Skipped - not needed

**Rationale**: This feature extends existing spec-board functionality with well-understood requirements. No research needed for:
- Task parsing (existing task_board_parser service)
- UI patterns (existing feature list template)
- Technology choices (using current stack)

### Phase 1: Design & Contracts ✅

**Status**: Complete

**Artifacts Generated**:
1. ✅ `data-model.md` - Extended Feature model with completion_percentage property
2. ✅ `quickstart.md` - 7 manual testing scenarios covering all user stories
3. ✅ `CLAUDE.md` - Updated agent context with feature technology

**Design Decisions**:
- Reuse existing task_board_parser for completion calculation
- Add calculated property to Feature model (no database changes)
- Extend column_features.html template for visual indicator
- No new API endpoints needed (UI-only extension)

**Constitution Re-check**: All gates still passing ✅

### Phase 2: Task Generation (Next Step)

Run `/speckit.tasks` to generate implementation tasks organized by user story priority.
