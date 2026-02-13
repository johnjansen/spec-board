# Implementation Plan: Validation-Ready Indicator

**Branch**: `004-validation-ready-indicator` | **Date**: 2026-02-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-validation-ready-indicator/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Display a "V" indicator on feature list items when only manual validation tasks remain incomplete (implementation complete). This distinguishes "implementation-complete, awaiting validation" (V) from "fully complete" (✓) and "in-progress" (no indicator). Validation tasks are identified by the "Manual validation:" prefix (case-insensitive) at the start of task descriptions. This extends the existing completion indicator from feature 003 with additional logic to classify tasks as validation vs implementation.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI 0.109+, Jinja2 3.1+, HTMX (via CDN), Tailwind CSS (via CDN)
**Storage**: File-based (reads tasks.md from feature directories)
**Testing**: Manual validation per constitution principle IV (prototype phase - no automated tests)
**Target Platform**: Web application (local development server, future uvx distribution)
**Project Type**: Single project with web application structure (backend + templates)
**Performance Goals**: <200ms for task parsing and classification per feature
**Constraints**: Must reuse existing task_board_parser.py service, graceful degradation for missing/malformed files, leverage existing 3-second auto-refresh polling
**Scale/Scope**: Small-scale local dashboard (10-50 features), single-user development tool

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Principle I: Modern Python Tooling** ✅ PASS
- Using Python 3.11+ features
- Type hints will be added to all new/modified functions
- PEP 8 compliance maintained
- Virtual environment via uv

**Principle II: Minimal Simplicity (Prototype)** ✅ PASS
- Extends existing task_board_parser.py (no new abstractions)
- Simple prefix-based classification logic (no NLP, no complex patterns)
- Direct implementation without speculative features
- Reuses existing Feature model from feature 003

**Principle III: One Class Per File** ✅ PASS
- Extends TaskBoardParser in task_board_parser.py (existing file)
- Extends Feature model in feature.py (existing file)
- No new classes required - adds methods to existing classes

**Principle IV: No Tests (Prototype Exception)** ✅ PASS
- Manual validation via quickstart.md test scenarios
- No automated tests required per constitution
- Focus on rapid iteration and validation

**Overall Gate Status**: ✅ PASS - No constitution violations, proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── models/
│   └── feature.py                          # [MODIFY] Add validation status properties
├── services/
│   ├── task_board_parser.py                # [MODIFY] Add validation detection logic
│   └── feature_repository.py               # [MODIFY] Populate validation status
├── templates/
│   └── components/
│       └── column_features.html            # [MODIFY] Add "V" indicator HTML
└── web/
    ├── app.py                              # [NO CHANGE] Existing FastAPI app
    └── routes.py                           # [NO CHANGE] Existing routes

specs/004-validation-ready-indicator/
├── spec.md                                 # [EXISTS] Feature specification
├── plan.md                                 # [THIS FILE] Implementation plan
├── data-model.md                           # [PHASE 1] Entity model
├── quickstart.md                           # [PHASE 1] Test scenarios
└── checklists/
    └── requirements.md                     # [EXISTS] Spec quality checklist
```

**Structure Decision**: Single project structure with web application components. This feature extends the existing spec-board codebase by modifying four existing files (no new files required). The implementation follows the same pattern as feature 003 (completion indicator), adding parallel logic for validation detection.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - this section is intentionally empty. All constitution gates passed.

---

## Phase 0: Research (✅ Complete)

**Output**: `research.md`

**Key Decisions**:
1. ✅ Task classification: Prefix matching with "Manual validation:" (case-insensitive)
2. ✅ Indicator logic: Three-state system (V / ✓ / nothing)
3. ✅ Data model: Extend Feature with 3 new properties
4. ✅ Parser extension: Extend existing `calculate_completion_percentage()` method
5. ✅ Visual design: Yellow/amber "V" vs green "✓" for distinction

**Status**: All technical decisions resolved, no blocking unknowns

---

## Phase 1: Design & Contracts (✅ Complete)

**Outputs**:
- ✅ `data-model.md` - Feature entity extension with validation properties
- ✅ `quickstart.md` - 10 manual validation scenarios
- ✅ `contracts/` - Not applicable (no new API endpoints, UI-only extension)
- ✅ `CLAUDE.md` - Agent context updated with tech stack

**Key Artifacts**:
1. Feature model extension: `is_validation_ready`, `validation_tasks_remaining`, `implementation_tasks_remaining`
2. Task classification algorithm: Prefix-based validation detection
3. Indicator display logic: Conditional rendering based on task status
4. Test coverage: 10 scenarios covering user stories, edge cases, auto-refresh

**Status**: Design complete, ready for Phase 2 (tasks generation)

---

## Constitution Re-Check (Post-Phase 1)

*Required: Re-validate gates after design artifacts are complete*

**Principle I: Modern Python Tooling** ✅ PASS
- No changes to tooling requirements
- Type hints specified for all new properties
- PEP 8 compliance maintained

**Principle II: Minimal Simplicity (Prototype)** ✅ PASS
- Simple prefix matching (no regex complexity)
- Extends existing parser (no new classes)
- Three boolean/integer properties (minimal data model change)
- No speculative features added

**Principle III: One Class Per File** ✅ PASS
- No new files created
- Extensions to existing classes only:
  - `Feature` in `feature.py`
  - `TaskBoardParser` in `task_board_parser.py`
  - `FeatureRepository` in `feature_repository.py`

**Principle IV: No Tests (Prototype Exception)** ✅ PASS
- Manual validation via quickstart.md (10 scenarios)
- No automated test files created
- Focus on rapid iteration

**Overall Gate Status**: ✅ PASS - No constitution violations, design approved

**Changes Since Pre-Research Check**: None - all gates remain green

---

## Next Steps

✅ Phase 0 (Research): Complete
✅ Phase 1 (Design): Complete
⏭️ **Phase 2 (Tasks)**: Run `/speckit.tasks` to generate tasks.md with implementation breakdown
⏭️ **Phase 3 (Implementation)**: Run `/speckit.implement` to execute tasks

**Estimated Complexity**: LOW
- Similar to feature 003 (completion indicator)
- Extends existing infrastructure
- No new dependencies or files
- 4 files modified, ~100 LOC total
