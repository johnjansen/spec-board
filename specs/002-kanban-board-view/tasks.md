---

description: "Task list for Kanban Board View implementation"
---

# Tasks: Kanban Board View for Task Progress Visualization

**Input**: Design documents from `/specs/002-kanban-board-view/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Not included (per constitution Principle IV - prototype exception)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single project structure: `src/`, `templates/`, `static/` at repository root
- All paths shown below use project root as base

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing project structure for extension

- [x] T001 Verify existing FastAPI/Jinja2/HTMX infrastructure is functional
- [x] T002 Verify existing MarkdownRenderer service can be extended

**Checkpoint**: Infrastructure ready for board view extension

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core parsing service that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create TaskBoardParser service in src/services/task_board_parser.py with Phase dataclass
- [x] T004 Implement regex-based phase extraction from tasks.md in task_board_parser.py
- [x] T005 Create Task dataclass in task_board_parser.py with parsing logic
- [x] T006 Implement task parsing with checkbox state extraction in task_board_parser.py
- [x] T007 Create Board dataclass in task_board_parser.py for coordinating phases
- [x] T008 Implement board creation logic with phase grouping in task_board_parser.py
- [x] T009 Add completion percentage calculation per phase in task_board_parser.py
- [x] T010 Add graceful error handling for malformed markdown in task_board_parser.py

**Checkpoint**: TaskBoardParser service complete - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Task Progress in Board Format (Priority: P1) 🎯 MVP

**Goal**: Display tasks grouped by phase with completion indicators in a visual board layout

**Independent Test**: Navigate to any feature's tasks.md, click "Board View" button, verify tasks appear in phase columns with IDs, descriptions, labels, and checkmarks

### Implementation for User Story 1

- [x] T011 [P] [US1] Create board_view.html template in src/templates/components/ with CSS Grid container
- [x] T012 [P] [US1] Create board_phase_column.html template in src/templates/components/ with header and task list
- [x] T013 [P] [US1] Create board_task_card.html template in src/templates/components/ with card layout
- [x] T014 [US1] Add CSS Grid layout styles to static/styles.css for horizontal scrolling columns
- [x] T015 [US1] Add task card styles to static/styles.css with Tailwind utilities
- [x] T016 [US1] Add phase column header styles to static/styles.css with completion percentage display
- [x] T017 [US1] Integrate TaskBoardParser with MarkdownRenderer in src/services/markdown_renderer.py
- [x] T018 [US1] Add render_board_view method to MarkdownRenderer in src/services/markdown_renderer.py
- [x] T019 [US1] Handle empty phases with placeholder message in board_phase_column.html
- [x] T020 [US1] Handle ungrouped tasks with fallback column in board_view.html

**Checkpoint**: At this point, User Story 1 should be fully functional - board view displays with phase columns and task cards

---

## Phase 4: User Story 2 - Toggle Between List and Board Views (Priority: P1) 🎯 MVP

**Goal**: Enable users to switch between traditional list view and board view without page reload

**Independent Test**: Open tasks.md in list view, click "Board View" button to switch to board, click "List View" button to return, verify both views show same data

### Implementation for User Story 2

- [x] T021 [US2] Add GET /artifacts/{feature_id}/tasks/board route to src/web/routes.py
- [x] T022 [US2] Implement board route handler in src/web/routes.py calling TaskBoardParser
- [x] T023 [US2] Add 404 error handling for missing tasks.md in board route handler
- [x] T024 [US2] Add "Board View" button to column_content.html with hx-get to board route
- [x] T025 [US2] Add "List View" button to board_view.html with hx-get to list route
- [x] T026 [US2] Configure HTMX target and swap behavior for view toggle buttons
- [x] T027 [US2] Add transition animations for view switching in static/styles.css
- [x] T028 [US2] Verify list view remains unchanged and functional

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users can toggle between list and board views

---

## Phase 5: User Story 3 - Identify Current and Next Phases (Priority: P2)

**Goal**: Highlight the currently active phase and indicate the next upcoming phase

**Independent Test**: View board with mixed completion status, verify first incomplete phase has "Current Phase" badge, next phase has "Next Up" badge

### Implementation for User Story 3

- [x] T029 [US3] Add current phase identification logic to task_board_parser.py (first phase with incomplete tasks)
- [x] T030 [US3] Add next phase identification logic to task_board_parser.py (phase after current)
- [x] T031 [US3] Add is_current and is_next boolean fields to Phase dataclass in task_board_parser.py
- [x] T032 [US3] Add "Current Phase" badge to board_phase_column.html when is_current=True
- [x] T033 [US3] Add "Next Up" badge to board_phase_column.html when is_next=True
- [x] T034 [US3] Add visual highlighting styles for current phase in static/styles.css (border, shadow)
- [x] T035 [US3] Add visual indicator styles for next phase in static/styles.css (subtle highlight)
- [x] T036 [US3] Handle edge case when all phases complete with success message in board_view.html

**Checkpoint**: All user stories should now be independently functional - board view shows phase indicators

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T037 [P] Add responsive design CSS for mobile/tablet screens in static/styles.css
- [x] T038 [P] Add loading spinner for board view rendering in board_view.html
- [x] T039 [P] Handle very long task descriptions with ellipsis truncation in board_task_card.html
- [x] T040 [P] Handle 10+ phases with smooth horizontal scroll in board_view.html CSS
- [x] T041 [P] Add documentation for board view to README.md
- [x] T042 Verify board view with actual 001-spec-dashboard tasks.md (real data test)
- [x] T043 Verify board view performance with 100 tasks across 10 phases
- [x] T044 Validate all success criteria from spec.md are met

**Checkpoint**: Feature complete and polished

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 3 (P2): Can start after Foundational - No dependencies on other stories
  - Stories can proceed in parallel (if staffed) or sequentially in priority order
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - creates board view display
- **User Story 2 (P1)**: Independent - adds toggle mechanism (works with US1 but doesn't modify it)
- **User Story 3 (P2)**: Independent - adds phase indicators (enhances US1 but doesn't break it)

### Within Each User Story

- TaskBoardParser must be complete before any user story (Phase 2 foundational)
- Templates before route integration
- CSS before template rendering
- Core implementation before edge cases
- Story complete before moving to next priority

### Parallel Opportunities

- Setup tasks (T001, T002) can run in parallel
- Foundational tasks within Phase 2 can run sequentially (build on each other)
- User Story 1 templates (T011, T012, T013) can be created in parallel
- User Story 1 CSS tasks (T014, T015, T016) can be created in parallel
- Once User Story 1 core is complete (T011-T018), User Story 2 can start in parallel with US1 polish (T019-T020)
- User Story 3 can start once TaskBoardParser supports is_current/is_next fields
- Polish tasks (T037-T041) can all run in parallel

---

## Parallel Example: User Story 1 Templates

```bash
# Launch all template creation tasks together:
Task: "Create board_view.html template in src/templates/components/"
Task: "Create board_phase_column.html template in src/templates/components/"
Task: "Create board_task_card.html template in src/templates/components/"

# Then launch all CSS tasks together:
Task: "Add CSS Grid layout styles to static/styles.css"
Task: "Add task card styles to static/styles.css"
Task: "Add phase column header styles to static/styles.css"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (verify infrastructure)
2. Complete Phase 2: Foundational (TaskBoardParser - CRITICAL)
3. Complete Phase 3: User Story 1 (board view display)
4. Complete Phase 4: User Story 2 (toggle mechanism)
5. **STOP and VALIDATE**: Test board view with toggle on real tasks.md files
6. Deploy/demo if ready (US3 is enhancement, not essential)

### Incremental Delivery

1. Complete Setup + Foundational → Parser ready
2. Add User Story 1 → Test board display → Demo working board view
3. Add User Story 2 → Test toggle → Deploy MVP (P1 complete!)
4. Add User Story 3 → Test indicators → Deploy enhanced version (P2 complete)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (blocking work)
2. Once TaskBoardParser is done:
   - Developer A: User Story 1 (board view templates and CSS)
   - Developer B: User Story 2 (routes and toggle buttons)
   - Developer C: User Story 3 (phase indicators)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No tests included (per constitution Principle IV - prototype exception)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- TaskBoardParser (Phase 2) is foundational - blocks all stories
- Board view is read-only - no drag-and-drop or editing
- All parsing happens server-side - no JavaScript beyond HTMX
- Reuses existing dashboard styling and components for consistency
