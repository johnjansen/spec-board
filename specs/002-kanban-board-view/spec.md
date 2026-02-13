# Feature Specification: Kanban Board View for Task Progress Visualization

**Feature Branch**: `002-kanban-board-view`
**Created**: 2026-02-13
**Status**: Draft
**Input**: User description: "Add a read-only Kanban board view for tasks.md that visualizes task progress across phases. The board should group tasks by phase (Phase 1: Setup, Phase 2: Foundation, Phase 3+: User Stories, etc.) and display them as columns with task cards. Each column shows the phase name, progress percentage, and task cards with their IDs, descriptions, story labels, and completion status. Users should be able to toggle between the existing list view and the new board view. The visualization is read-only - no drag-and-drop or editing - just visual progress tracking to see what's coming up, what phase is active, and what's completed. This helps track multi-dimensional progress: feature lifecycle (spec → plan → tasks → implementation), phase-level progress, and individual task status."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Task Progress in Board Format (Priority: P1)

Users need a visual overview of task progress organized by implementation phases to quickly understand what work is completed, currently active, and upcoming without reading through long task lists.

**Why this priority**: Core value proposition - provides the primary visualization that helps users track progress at a glance. Without this, the feature has no value.

**Independent Test**: Can be fully tested by opening any feature's tasks.md file, clicking "Board View", and verifying that tasks appear grouped by phase with accurate completion indicators.

**Acceptance Scenarios**:

1. **Given** a feature with tasks.md containing multiple phases, **When** user views the board, **Then** tasks are grouped into separate columns by phase
2. **Given** tasks with completion status, **When** displayed in board view, **Then** completed tasks show checkmarks and incomplete tasks show empty boxes
3. **Given** tasks with story labels and IDs, **When** displayed as cards, **Then** each card shows task ID, description, story label, and status
4. **Given** a phase with tasks, **When** displayed as a column, **Then** column header shows phase name and completion percentage (e.g., "Phase 3: User Story 1 - 8/10 completed (80%)")

---

### User Story 2 - Toggle Between List and Board Views (Priority: P1)

Users need the ability to switch between traditional list view and board view to choose their preferred visualization method based on their current needs (detail vs. overview).

**Why this priority**: Essential for adoption - users must be able to return to familiar list view if board view doesn't meet their needs. Also enables different use cases (detailed reading vs. progress tracking).

**Independent Test**: Can be fully tested by opening tasks.md, toggling between views multiple times, and verifying both views display the same data correctly.

**Acceptance Scenarios**:

1. **Given** tasks.md is displayed in list view, **When** user clicks "Board View" button, **Then** view switches to board layout without page reload
2. **Given** tasks.md is displayed in board view, **When** user clicks "List View" button, **Then** view switches back to traditional markdown rendering
3. **Given** user toggles between views, **When** switching, **Then** all task data remains consistent between views
4. **Given** tasks.md is loaded, **When** initial display appears, **Then** list view is shown by default

---

### User Story 3 - Identify Current and Next Phases (Priority: P2)

Users need clear visual indicators showing which phase is currently active (has incomplete tasks) and which phase comes next to understand where work is focused and what's upcoming.

**Why this priority**: Enhances the board's usefulness for progress tracking by highlighting actionable information. Valuable but the basic board visualization (P1) provides core value without this.

**Independent Test**: Can be fully tested by viewing board with partially completed tasks and verifying current phase and next phase are visually distinct from completed and future phases.

**Acceptance Scenarios**:

1. **Given** a board with mixed completion status, **When** displayed, **Then** the first phase with incomplete tasks is highlighted as "Current Phase"
2. **Given** a current phase is identified, **When** displayed, **Then** the next phase with tasks is indicated as "Next Up"
3. **Given** all tasks in all phases are complete, **When** displayed, **Then** board shows "All phases complete" message
4. **Given** a phase is in progress, **When** column is rendered, **Then** column has distinct styling (e.g., highlighted border, badge)

---

### Edge Cases

- What happens when a phase has no tasks? Column should still appear with "No tasks in this phase" message
- What happens when all tasks are complete? Board should show success state with completion indicators
- What happens when tasks.md has no phase boundaries? All tasks should appear in a single "Ungrouped Tasks" column
- How does system handle very long task descriptions? Card descriptions should truncate with ellipsis after 3 lines
- What happens when there are 10+ phases? Columns should scroll horizontally without breaking layout
- How does system handle tasks with missing IDs or labels? Cards display without those elements (graceful degradation)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST parse tasks.md file to extract phase boundaries (sections starting with "## Phase")
- **FR-002**: System MUST group tasks by their containing phase section
- **FR-003**: System MUST display each phase as a separate column in board view
- **FR-004**: System MUST show phase name and task completion percentage in column headers
- **FR-005**: System MUST render each task as a card displaying task ID, description, story label (if present), and completion status
- **FR-006**: System MUST provide toggle buttons to switch between list view and board view
- **FR-007**: Board view MUST be read-only with no drag-and-drop or editing capabilities
- **FR-008**: System MUST preserve all existing task list functionality when in list view mode
- **FR-009**: System MUST display checkboxes on task cards matching completion status from tasks.md
- **FR-010**: System MUST calculate and display completion percentage per phase (completed tasks / total tasks)
- **FR-011**: System MUST handle phases with no tasks by showing placeholder message
- **FR-012**: System MUST identify and highlight the current phase (first phase with incomplete tasks)
- **FR-013**: System MUST indicate the next upcoming phase after the current phase
- **FR-014**: System MUST handle horizontal scrolling when board width exceeds viewport
- **FR-015**: System MUST maintain visual consistency with existing dashboard styling

### Key Entities *(include if feature involves data)*

- **Phase**: Represents a group of tasks (e.g., "Phase 1: Setup", "Phase 3: User Story 1")
  - Attributes: name, description, task count, completion percentage, order

- **Task**: Represents an individual work item from tasks.md
  - Attributes: ID (e.g., T001), description, completion status (boolean), story label (e.g., US1), parallel marker, phase membership

- **Board**: Container for phase columns
  - Attributes: total phases, overall completion, current phase indicator, next phase indicator

- **View Mode**: User's current visualization preference
  - Values: "list" (default) or "board"

## Success Criteria *(mandatory)*

1. **Visual comprehension**: Users can understand overall project progress within 5 seconds of viewing board
2. **Phase identification**: Users can identify current active phase and next phase without reading task details
3. **Data accuracy**: Board view shows 100% accurate task completion status matching source tasks.md file
4. **View switching**: Users can toggle between list and board views in under 2 seconds with no data loss
5. **Performance**: Board renders all phases and tasks within 1 second for features with up to 100 tasks
6. **Visual consistency**: Board styling matches existing dashboard design language (colors, fonts, spacing)
7. **Responsive behavior**: Board remains usable on screens as small as 1024px wide (columns scroll horizontally)

## Scope *(mandatory)*

### In Scope

- Read-only visualization of tasks.md in board format
- Parsing phases from markdown headings
- Displaying tasks as cards with ID, description, labels, status
- Toggle between list and board views
- Progress indicators per phase (percentage, counts)
- Current phase and next phase identification
- Horizontal scrolling for many columns
- Integration with existing tasks.md rendering

### Out of Scope

- Drag-and-drop task reordering
- Editing task status from board view
- Creating or deleting tasks from UI
- Filtering or searching within board view (future enhancement)
- Custom column grouping (always by phase)
- Saving view preference (always defaults to list view)
- Board view for spec.md or plan.md (tasks.md only)
- Real-time updates when tasks.md file changes
- Kanban workflow automation (moving tasks between columns)

## Constraints *(mandatory)*

- Must maintain read-only principle (no file modifications from UI)
- Must not require database or state management (parse from file each time)
- Must work with existing tasks.md format (no new markdown syntax required)
- Must render server-side (consistent with dashboard architecture)
- Must not use JavaScript frameworks (HTMX only for view switching)
- Performance must not degrade with up to 100 tasks across 10 phases

## Dependencies *(mandatory)*

- Existing tasks.md rendering infrastructure
- Task parsing logic from markdown renderer
- Dashboard navigation and routing
- Column layout CSS framework
- Task metadata extraction (IDs, labels, checkboxes)

## Assumptions *(mandatory)*

- tasks.md files follow consistent phase heading format ("## Phase N: Description")
- Task IDs are present and follow T### format
- Completion status is indicated by markdown checkboxes (- [ ] or - [x])
- Users viewing board have already used list view and understand task structure
- Phase order in tasks.md is intentional (Setup → Foundation → User Stories → Polish)
- Board view is supplementary to list view, not a replacement
- Users prefer visual overview for progress tracking, detailed list for task execution

## Open Questions *(mandatory if any)*

None - feature scope is well-defined with reasonable defaults for all aspects.
