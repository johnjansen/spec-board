# Tasks: Validation-Ready Indicator

**Input**: Design documents from `/specs/004-validation-ready-indicator/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: None - manual validation per constitution (prototype phase)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

**Status**: ✅ COMPLETE - Existing spec-board project

No tasks required - extending existing codebase from feature 003.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Status**: ✅ COMPLETE - All prerequisites exist

No tasks required - reusing existing:
- task_board_parser.py service (will extend with validation detection)
- Feature model (will extend with validation properties)
- feature_repository.py (will extend with validation logic)
- column_features.html template (will extend with V indicator HTML)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Validation-Ready Visual Indicator (Priority: P1) 🎯 MVP

**Goal**: Display a "V" indicator on feature list items when only manual validation tasks remain incomplete (implementation complete, validation pending)

**Independent Test**: Create a feature with implementation tasks complete but validation tasks incomplete, view feature list, verify "V" indicator appears. Features with incomplete implementation or all tasks complete should not show "V".

### Implementation for User Story 1

- [x] T001 [P] [US1] Add validation detection method to src/services/task_board_parser.py
  - Method: `classify_task(task_description: str) -> str`
  - Returns "validation" if task starts with "Manual validation:" (case-insensitive)
  - Returns "implementation" otherwise
  - Add type hints

- [x] T002 [P] [US1] Extend completion calculation in src/services/task_board_parser.py
  - Modify `calculate_completion_percentage()` to return validation breakdown
  - New signature: `Tuple[Optional[float], int, int, int, int]`
  - Returns: (percentage, total_tasks, completed_tasks, validation_incomplete, implementation_incomplete)
  - Use classify_task() to categorize each task
  - Handle edge cases: empty file, no tasks, malformed markdown

- [x] T003 [P] [US1] Add validation properties to src/models/feature.py
  - Add `is_validation_ready: bool = False`
  - Add `validation_tasks_remaining: int = 0`
  - Add `implementation_tasks_remaining: int = 0`
  - Add type hints and docstrings

- [x] T004 [US1] Update src/services/feature_repository.py to populate validation data
  - In `_load_feature_basic()` method, unpack extended tuple from calculate_completion_percentage()
  - Calculate `is_validation_ready = (implementation_incomplete == 0 and validation_incomplete > 0)`
  - Assign validation_tasks_remaining and implementation_tasks_remaining to feature
  - Handle None case gracefully (no error shown to user)
  - Dependencies: T002, T003

- [x] T005 [US1] Add V indicator HTML to src/templates/components/column_features.html
  - Add conditional block after existing completion indicator (line ~93)
  - Show "V" only if `feature.is_validation_ready == True`
  - Use yellow/amber color (e.g., `text-amber-600` or `text-yellow-600`)
  - Same font size and weight as ✓ indicator (`text-xs`, `font-bold`)
  - Position: Same location as ✓ (after artifact dots, with separator)
  - Include basic title attribute (e.g., "Validation ready")
  - Dependencies: T003, T004

**Checkpoint**: At this point, "V" indicators should appear for features with only validation tasks remaining

---

## Phase 4: User Story 2 - Validation Status Tooltip (Priority: P2)

**Goal**: Show detailed validation information in a tooltip when hovering over the "V" indicator

**Independent Test**: Hover over a "V" indicator and verify tooltip shows validation task count (e.g., "2 validation tasks remaining")

### Implementation for User Story 2

- [x] T006 [US2] Update V indicator tooltip in src/templates/components/column_features.html
  - Modify title attribute added in T005 to show detailed information
  - Format: "{validation_tasks_remaining} validation task{'s' if != 1 else ''} remaining"
  - Alternative format if helpful: "Implementation complete - {count} validation tasks pending"
  - Ensure tooltip appears on hover and disappears on mouse leave
  - Position tooltip to be readable (not cut off by viewport)
  - Dependencies: T005

**Checkpoint**: Hovering over "V" indicators should now show detailed validation task counts

---

## Phase 5: User Story 3 - Visual Distinction (Priority: P2)

**Goal**: Ensure "V" validation indicator is visually distinct from "✓" completion indicator to prevent user confusion

**Independent Test**: View feature list with both "V" and "✓" indicators present (different features) and verify they are clearly distinguishable at a glance.

### Implementation for User Story 3

- [x] T007 [US3] Review and refine indicator styling in src/templates/components/column_features.html
  - Test with features having different indicator states side-by-side
  - Ensure "V" and "✓" use clearly different visual elements:
    - "V" = yellow/amber color (`text-amber-600` or `text-yellow-600`)
    - "✓" = green color (`text-emerald-600`) - existing from feature 003
    - Both same size (`text-xs`) and weight (`font-bold`)
    - Both use same positioning (border-left separator, margin-left, padding-left)
  - Add CSS classes if needed for better distinction
  - Test all combinations: V indicator, ✓ indicator, no indicator
  - Verify no confusion between validation-ready (V) and complete (✓) states
  - Dependencies: T005, T006

**Checkpoint**: All three user stories should now be independently functional with clear visual distinction

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, documentation, and refinements

- [x] T008 [P] Run manual validation using quickstart.md test scenarios
  - Execute all 10 scenarios from quickstart.md
  - Scenario 1: V indicator appears (implementation complete, validation pending)
  - Scenario 2: ✓ indicator persists (all tasks complete)
  - Scenario 3: No indicator (implementation incomplete)
  - Scenario 4: Validation tooltip (hover details)
  - Scenario 5: Visual distinction (V vs ✓)
  - Scenario 6: Edge case - only validation tasks
  - Scenario 7: Edge case - no validation tasks (backward compatibility)
  - Scenario 8: Edge case - missing or empty tasks.md
  - Scenario 9: Auto-refresh updates
  - Scenario 10: Case insensitivity
  - Document any issues found

- [x] T009 [P] Update README.md or documentation with validation-ready indicator feature
  - Add section describing the validation-ready indicator
  - Explain difference between status badge, ✓ indicator (feature 003), and V indicator (feature 004)
  - Document the "Manual validation:" prefix convention
  - Include screenshot or description of what indicators look like

- [x] T010 Code review and cleanup
  - Review all modified files for code quality
  - Ensure type hints are present on all new/modified functions
  - Verify PEP 8 compliance
  - Add docstrings where missing
  - Remove any debug logging
  - Verify graceful error handling for edge cases

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ✅ Complete - no work needed
- **Foundational (Phase 2)**: ✅ Complete - no work needed
- **User Stories (Phase 3-5)**: Can proceed immediately
  - US1 (P1) must complete before US2/US3 can start
  - US2 (P2) and US3 (P2) depend on US1 completion but can proceed in parallel after US1
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - can start immediately
  - Internal dependencies: T001, T002, T003 (parallel) → T004 → T005
- **User Story 2 (P2)**: Depends on US1 (T005 specifically) - extends tooltip
  - Internal dependencies: T006 (single task, extends T005)
- **User Story 3 (P2)**: Depends on US1 (T005) and US2 (T006) - refines styling
  - Internal dependencies: T007 (single task, refines T005 and T006)

### Within Each User Story

- **US1**: T001 (classify method), T002 (extend calculation), T003 (model) run in parallel → T004 (repository) → T005 (template)
- **US2**: T006 (tooltip) after US1 complete
- **US3**: T007 (styling) after US1 + US2 complete

### Parallel Opportunities

- **Phase 3**: T001, T002, and T003 can run in parallel (different methods/files, no dependencies on each other)
- **Phase 6**: T008 and T009 can run in parallel (documentation tasks)
- **Between stories**: Once US1 completes, if staffed, could do US2 and US3 in parallel (different aspects)

---

## Parallel Example: User Story 1

```bash
# Launch parallel tasks for US1:
Task: "Add validation detection method to src/services/task_board_parser.py"
Task: "Extend completion calculation in src/services/task_board_parser.py"
Task: "Add validation properties to src/models/feature.py"

# Wait for all three to complete, then sequential:
Task: "Update feature_repository.py to populate validation data"  # Depends on T002, T003
Task: "Add V indicator HTML to column_features.html"             # Depends on T003, T004
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. ✅ Setup + Foundational complete (existing codebase)
2. Complete Phase 3 (US1): T001, T002, T003 (parallel) → T004 → T005
3. **STOP and VALIDATE**: Test using quickstart.md Scenarios 1, 3, 6, 10
4. Verify "V" indicator appears for validation-ready features
5. Verify no indicator for incomplete implementation
6. **Deploy/demo if ready** - core value delivered!

### Incremental Delivery

1. ✅ Foundation ready (existing codebase)
2. Add User Story 1 (T001-T005) → Test independently → **MVP deployed!**
3. Add User Story 2 (T006) → Test independently → **Enhanced with tooltips**
4. Add User Story 3 (T007) → Test independently → **Polished visual distinction**
5. Polish (T008-T010) → Final validation → **Production ready**

### Sequential Solo Strategy

For single developer:

1. Complete US1 fully (T001, T002, T003 parallel → T004 → T005)
2. Validate US1 with quickstart.md scenarios 1, 3, 6, 10
3. Complete US2 (T006)
4. Validate US2 with quickstart.md scenario 4
5. Complete US3 (T007)
6. Validate US3 with quickstart.md scenario 5
7. Polish (T008 → T009 → T010)

---

## Notes

- **No tests**: Manual validation per constitution principle IV (prototype phase)
- **Type hints**: Required on all new/modified functions per constitution
- **PEP 8**: All code must be PEP 8 compliant
- **Error handling**: Graceful degradation - no user-visible errors for malformed files
- **Performance**: Task classification adds <10% overhead to existing parsing (<250ms total)
- **Auto-refresh**: Leverages existing 3-second polling (no changes needed)
- **Case insensitivity**: Validation task detection must be case-insensitive
- **Prefix matching**: Task classification uses strict prefix match ("Manual validation:" at start)
- Each user story delivers independent value and can be deployed separately
- US1 is the MVP - provides core functionality
- US2 and US3 are enhancements that can be skipped if time-constrained
- Similar pattern to feature 003 (completion indicator) but with task classification logic

---

## Test Validation Tasks (for demonstration)

These tasks demonstrate the V indicator functionality:

- [ ] Manual validation: Verify V indicator appears when only validation tasks remain
- [ ] Manual validation: Test tooltip shows correct validation count
- [ ] Manual validation: Confirm visual distinction between V and ✓ indicators
