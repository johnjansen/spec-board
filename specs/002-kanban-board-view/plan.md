# Implementation Plan: Kanban Board View for Task Progress Visualization

**Branch**: `002-kanban-board-view` | **Date**: 2026-02-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-kanban-board-view/spec.md`

## Summary

Add a read-only Kanban board visualization for tasks.md files that displays task progress organized by implementation phases. Users can toggle between traditional list view and a visual board view with columns representing phases (Setup, Foundation, User Stories, Polish). Each phase column shows completion percentage and task cards with IDs, descriptions, story labels, and status indicators. This provides at-a-glance progress tracking without modifying the read-only principle of the dashboard.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: Existing (FastAPI, Jinja2, python-markdown, HTMX, Tailwind CSS)
**New Dependencies**: None (uses existing stack)
**Storage**: File system (read tasks.md, parse in memory)
**Testing**: None (per constitution Principle IV - prototype exception)
**Target Platform**: Web browser (desktop, tablet)
**Project Type**: Enhancement to existing Spec-Board Dashboard
**Performance Goals**: <1s board rendering for 100 tasks, <2s view toggle, <5s visual comprehension
**Constraints**: Read-only, no state persistence, server-side rendering only, no JavaScript frameworks
**Scale/Scope**: Single user, local project, up to 100 tasks across 10 phases

**Architecture Approach**:
- Extend existing MarkdownRenderer with task parsing capability
- Create new TaskBoardParser service to extract phases and group tasks
- Add new route `/artifacts/{feature_id}/tasks/board` for board view
- Create board template components for phase columns and task cards
- Use HTMX for toggle between list/board views (no page reload)
- Maintain all existing list view functionality unchanged

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Modern Python Tooling
✅ **PASS** - Python 3.11+, uv, type hints on all new services

### Principle II: Minimal Simplicity (Prototype)
✅ **PASS** - Extends existing dashboard without introducing new frameworks or databases, read-only visualization only, no complex state management

### Principle III: One Class Per File
✅ **PASS** - TaskBoardParser in separate file, follows existing pattern

### Principle IV: No Tests (Prototype Exception)
✅ **PASS** - No test files planned, manual validation during development

### Technology Stack Alignment
✅ **PASS** - Uses existing FastAPI/Jinja2/HTMX stack, no new dependencies required

**Constitution Status**: All gates passed - proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/002-kanban-board-view/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output (parsing strategies)
├── data-model.md        # Phase 1 output (Phase, Task, Board entities)
├── quickstart.md        # Phase 1 output (testing instructions)
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
src/
├── services/
│   ├── markdown_renderer.py        # MODIFY: Add board view rendering
│   └── task_board_parser.py        # NEW: Parse phases and tasks
├── web/
│   └── routes.py                    # MODIFY: Add board view route
└── templates/
    └── components/
        ├── column_content.html       # MODIFY: Add view toggle buttons
        ├── board_view.html           # NEW: Board layout container
        ├── board_phase_column.html   # NEW: Phase column component
        └── board_task_card.html      # NEW: Task card component

static/
└── styles.css                        # MODIFY: Add board styles
```

## Phase 0: Research & Decisions

### Task Parsing Strategy

**Decision**: Regex-based phase extraction from tasks.md markdown

**Rationale**:
- tasks.md has consistent structure ("## Phase N: Description")
- Regex is simple, fast, and adequate for prototype
- Avoids complexity of full markdown AST parsing
- Can reuse existing checkbox/task ID patterns from MarkdownRenderer

**Alternatives Considered**:
- Full markdown AST parsing (overkill for simple structure)
- Line-by-line text processing (less reliable for edge cases)

**Implementation**:
```python
# Pattern: ## Phase 1: Setup
phase_pattern = r'^##\s+Phase\s+(\d+):\s*(.+)$'
# Extract tasks within each phase section
# Track completion status per phase
```

### Board Layout Approach

**Decision**: CSS Grid + horizontal scrolling for phase columns

**Rationale**:
- Native CSS Grid provides clean column layout
- Horizontal scroll handles 10+ phases gracefully
- No JavaScript required for layout
- Responsive and performant

**Alternatives Considered**:
- Flexbox (less control over column sizing)
- JavaScript-based virtual scrolling (unnecessary complexity)

### View Toggle Mechanism

**Decision**: HTMX hx-get with different routes

**Rationale**:
- Consistent with existing dashboard HTMX patterns
- Server-side rendering maintains architecture consistency
- No client-side state management needed
- Clean separation: /tasks for list, /tasks/board for board

**Alternatives Considered**:
- Query parameter (?view=board) (less RESTful)
- Client-side JavaScript toggle (breaks no-JS principle)

## Phase 1: Data Model & Contracts

### Data Model

See [data-model.md](./data-model.md) for detailed entity definitions.

**Key Entities**:
- **Phase**: Group of tasks with name, description, completion percentage
- **Task**: Individual work item with ID, status, labels, phase membership
- **Board**: Container coordinating phase columns and overall progress

### API Contracts

**New Route**: `GET /artifacts/{feature_id}/tasks/board`

**Purpose**: Render tasks.md in board view format

**Request**:
- `feature_id` (path parameter): Feature identifier (e.g., "001-spec-dashboard")

**Response**: HTML board view component

**Behavior**:
1. Load tasks.md content via FeatureRepository
2. Parse phases and tasks via TaskBoardParser
3. Calculate completion percentages per phase
4. Identify current phase (first with incomplete tasks)
5. Render board_view.html template with phase columns

**Error Handling**:
- 404 if feature not found
- 404 if tasks.md doesn't exist
- Graceful degradation if no phases found (single "Ungrouped Tasks" column)

### Integration Points

**Existing Components Used**:
- `FeatureRepository.get_feature()` - Load feature and tasks.md
- `Artifact.load_content()` - Read tasks.md file
- HTMX routing and partial updates
- Tailwind CSS styling system

**New Components Required**:
- `TaskBoardParser` - Extract phases and tasks from markdown
- Board view templates - Render phase columns and task cards
- Toggle buttons in content header
- Board-specific CSS for grid layout and cards

## Phase 2: Constitution Check (Post-Design)

**Re-evaluation after completing data model and contracts:**

### Principle I: Modern Python Tooling
✅ **PASS** - TaskBoardParser uses type hints, dataclasses for entities

### Principle II: Minimal Simplicity (Prototype)
✅ **PASS** - No new dependencies, simple regex parsing, leverages existing infrastructure

### Principle III: One Class Per File
✅ **PASS** - TaskBoardParser in task_board_parser.py, one class per file maintained

### Principle IV: No Tests (Prototype Exception)
✅ **PASS** - Manual testing strategy documented in quickstart.md

**Final Status**: ✅ All constitution principles upheld in design

## Complexity Assessment

**Estimated Complexity**: **LOW-MEDIUM**

**Justification**:
- Extends existing functionality rather than creating new system
- Uses proven patterns from dashboard implementation
- Regex parsing is straightforward for consistent structure
- HTMX toggle reuses existing mechanisms
- No new dependencies or technologies
- Clear scope boundaries (read-only, no persistence)

**Risk Areas**:
- Edge cases in phase parsing (mitigated by testing with actual tasks.md files)
- Horizontal scroll UX (mitigated by CSS overflow patterns)
- Performance with 100+ tasks (mitigated by server-side rendering, no DOM manipulation)

**Mitigation Strategies**:
- Test with 001-spec-dashboard tasks.md (real data)
- Handle missing phases gracefully (ungrouped column)
- Limit initial scope to P1 stories (board view + toggle)
- P2 story (phase indicators) can be added incrementally

## Implementation Phases

### MVP Scope (P1 Stories)
1. Create TaskBoardParser service
2. Add board view route
3. Create board templates (container, column, card)
4. Add toggle buttons to content header
5. Add board CSS styling
6. Test with actual tasks.md

### Enhanced Scope (P2 Story)
7. Add current phase identification logic
8. Add next phase indicator
9. Add visual highlighting for active phases

**Recommended Approach**: Implement MVP first, validate with user, then add P2 enhancements

## Quickstart Reference

See [quickstart.md](./quickstart.md) for detailed setup and testing instructions.

**Quick Test**:
1. Start dashboard: `uv run uvicorn src.web.app:app --reload`
2. Navigate to any feature's tasks.md
3. Click "Board View" button
4. Verify phases appear as columns with task cards
5. Click "List View" to return to original view

---

**Next Steps**: Proceed to tasks.md generation with `/speckit.tasks`
