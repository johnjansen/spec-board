# Tasks: Feature Completion Indicator

**Input**: Design documents from `/specs/003-feature-completion-indicator/`
**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md

**Tests**: None - manual validation per constitution (prototype phase)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

**Status**: ✅ COMPLETE - Existing spec-board project

No tasks required - extending existing codebase.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Status**: ✅ COMPLETE - All prerequisites exist

No tasks required - reusing existing:
- task_board_parser.py service (for parsing tasks.md)
- Feature model (will extend with property)
- feature_repository.py (will extend with completion logic)
- column_features.html template (will extend with indicator HTML)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Quick Visual Identification (Priority: P1) 🎯 MVP

**Goal**: Display a visual completion indicator on feature list items when tasks.md shows 100% completion

**Independent Test**: Create a feature with all tasks completed, view feature list, verify indicator appears. Features without 100% completion should not show indicator.

### Implementation for User Story 1

- [ ] T001 [P] [US1] Add completion calculation method to src/services/task_board_parser.py
  - Method: `calculate_completion_percentage(tasks_md_path: Path) -> Optional[float]`
  - Parse tasks.md for checkboxes (`- [ ]` and `- [x]`)
  - Return percentage (0.0-100.0) or None if file missing/malformed
  - Handle edge cases: empty file, no checkboxes, malformed markdown

- [ ] T002 [P] [US1] Add completion_percentage property to src/models/feature.py
  - Add `completion_percentage: Optional[float]` attribute to Feature class
  - Add type hints (float or None)
  - Document property purpose in docstring

- [ ] T003 [US1] Update src/services/feature_repository.py to populate completion data
  - In `_load_feature_basic()` method, call task_board_parser.calculate_completion_percentage()
  - Assign result to feature.completion_percentage
  - Handle None case gracefully (no error shown to user)
  - Dependencies: T001, T002

- [ ] T004 [US1] Add completion indicator HTML to src/templates/components/column_features.html
  - Add conditional block after artifact indicators (line ~89)
  - Show indicator only if `feature.completion_percentage == 100.0`
  - Use checkmark icon or emoji (✓ or ✅)
  - Style distinct from status badge (different position/color)
  - Include title attribute with basic text (e.g., "Implementation complete")
  - Dependencies: T002, T003

**Checkpoint**: At this point, completion indicators should appear for features with 100% task completion

---

## Phase 4: User Story 2 - Completion Status Tooltip (Priority: P2)

**Goal**: Show detailed completion information in a tooltip when hovering over the completion indicator

**Independent Test**: Hover over a completion indicator and verify tooltip shows "X/X tasks completed (100%)"

### Implementation for User Story 2

- [ ] T005 [US2] Extend task_board_parser to return detailed completion stats
  - Modify calculate_completion_percentage() to also return total_tasks and completed_tasks
  - Return tuple: `(percentage, total, completed)` or `(None, 0, 0)`
  - Update type hints accordingly
  - Dependencies: T001

- [ ] T006 [US2] Update Feature model to store task counts
  - Add `total_tasks: int` and `completed_tasks: int` attributes
  - Default to 0 when completion_percentage is None
  - Dependencies: T002, T005

- [ ] T007 [US2] Update feature_repository to populate task counts
  - Modify T003 code to unpack tuple from calculate_completion_percentage()
  - Assign total_tasks and completed_tasks to feature
  - Dependencies: T003, T005, T006

- [ ] T008 [US2] Add tooltip to completion indicator in column_features.html
  - Replace title attribute with Tailwind CSS tooltip implementation
  - Show: "{completed_tasks}/{total_tasks} tasks completed (100%)"
  - Ensure tooltip appears on hover and disappears on mouse leave
  - Position tooltip to be readable (not cut off by viewport)
  - Dependencies: T004, T006, T007

**Checkpoint**: Hovering over completion indicators should now show detailed task counts

---

## Phase 5: User Story 3 - Visual Distinction (Priority: P2)

**Goal**: Ensure completion indicator is visually distinct from the existing status badge to prevent user confusion

**Independent Test**: View feature with status="Complete" but incomplete tasks (should show badge, no indicator). View feature with status="In Progress" but complete tasks (should show both, clearly distinguishable).

### Implementation for User Story 3

- [ ] T009 [US3] Review and refine indicator styling in column_features.html
  - Test with features having different status badges + completion states
  - Ensure indicator and badge use different visual elements:
    - Different icons (status uses colored badges, completion uses checkmark)
    - Different positions (status in metadata row, completion in artifact indicators row)
    - Different colors (status uses green/yellow/blue, completion uses distinct color)
  - Add CSS classes if needed for better distinction
  - Test all combinations: Complete+100%, Complete+50%, InProgress+100%, InProgress+50%
  - Dependencies: T004, T008

**Checkpoint**: All three user stories should now be independently functional with clear visual distinction

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, documentation, and refinements

- [ ] T010 [P] Run manual validation using quickstart.md test scenarios
  - Execute all 7 scenarios from quickstart.md
  - Verify edge cases: missing tasks.md, empty tasks.md, malformed tasks.md
  - Verify auto-refresh works (indicator updates within 3 seconds)
  - Document any issues found

- [ ] T011 [P] Update README or documentation with completion indicator feature
  - Add section describing the completion indicator
  - Include screenshot or description of what it looks like
  - Explain difference between status badge and completion indicator

- [ ] T012 Code review and cleanup
  - Review all modified files for code quality
  - Ensure type hints are present on all new/modified functions
  - Verify PEP 8 compliance
  - Add docstrings where missing
  - Remove any debug logging

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ✅ Complete - no work needed
- **Foundational (Phase 2)**: ✅ Complete - no work needed
- **User Stories (Phase 3-5)**: Can proceed immediately
  - US1 (P1) foundational tasks must complete before US2/US3
  - US2 (P2) and US3 (P2) can proceed in parallel after US1 core is done
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - can start immediately
  - Internal dependencies: T001, T002 → T003 → T004
- **User Story 2 (P2)**: Depends on US1 core (T001-T004) - extends tooltip functionality
  - Internal dependencies: T005, T006 → T007 → T008
- **User Story 3 (P2)**: Depends on US1 indicator (T004) and US2 tooltip (T008)
  - Refines visual styling to ensure distinction

### Within Each User Story

- **US1**: T001 (parser) and T002 (model) run in parallel → T003 (repository) → T004 (template)
- **US2**: T005 (parser), T006 (model) parallel → T007 (repository) → T008 (template)
- **US3**: T009 (styling review) after US1 + US2 complete

### Parallel Opportunities

- **Phase 3**: T001 and T002 can run in parallel (different files)
- **Phase 4**: T005 and T006 can run in parallel (different files, extending Phase 3 work)
- **Phase 6**: T010 and T011 can run in parallel (documentation tasks)
- **Between stories**: US2 and US3 can partially overlap if staffed

---

## Parallel Example: User Story 1

```bash
# Launch parallel tasks:
Task: "Add completion calculation method to src/services/task_board_parser.py"
Task: "Add completion_percentage property to src/models/feature.py"

# Then sequential:
Task: "Update feature_repository.py to populate completion data"  # Depends on both above
Task: "Add completion indicator HTML to column_features.html"     # Depends on repository
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. ✅ Setup + Foundational complete (existing codebase)
2. Complete Phase 3 (US1): T001 → T002 → T003 → T004
3. **STOP and VALIDATE**: Test using quickstart.md Scenarios 1-3
4. Verify indicator appears for 100% complete features
5. Verify no indicator for partial or missing tasks.md
6. **Deploy/demo if ready** - core value delivered!

### Incremental Delivery

1. ✅ Foundation ready (existing codebase)
2. Add User Story 1 (T001-T004) → Test independently → **MVP deployed!**
3. Add User Story 2 (T005-T008) → Test independently → **Enhanced with tooltips**
4. Add User Story 3 (T009) → Test independently → **Polished visual distinction**
5. Polish (T010-T012) → Final validation → **Production ready**

### Sequential Solo Strategy

For single developer:

1. Complete US1 fully (T001 → T002 → T003 → T004)
2. Validate US1 with quickstart.md scenarios 1-3
3. Complete US2 fully (T005 → T006 → T007 → T008)
4. Validate US2 with quickstart.md scenario 4
5. Complete US3 (T009)
6. Validate US3 with quickstart.md scenario 5
7. Polish (T010 → T011 → T012)

---

## Notes

- **No tests**: Manual validation per constitution principle IV (prototype phase)
- **Type hints**: Required on all new/modified functions per constitution
- **PEP 8**: All code must be PEP 8 compliant
- **Error handling**: Graceful degradation - no user-visible errors for malformed files
- **Performance**: Each completion calculation must complete in <200ms
- **Auto-refresh**: Leverages existing 3-second polling (no changes needed)
- Each user story delivers independent value and can be deployed separately
- US1 is the MVP - provides core functionality
- US2 and US3 are enhancements that can be skipped if time-constrained
