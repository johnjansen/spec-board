# Quickstart: Manual Testing for Feature Completion Indicator

## Prerequisites

- spec-board running locally (`spec-board` or `uvx --from git+... spec-board`)
- At least one feature in specs/ with a tasks.md file

## Test Scenarios

### Scenario 1: Feature with 100% Completion (US1-P1)

**Setup**:
1. Create or modify a feature's tasks.md to have all tasks completed:
   ```markdown
   ## Phase 1: Setup
   - [x] Task 1 completed
   - [x] Task 2 completed

   ## Phase 2: Implementation
   - [x] Task 3 completed
   ```

**Expected**:
- Feature list shows a visual completion indicator (checkmark/icon) next to the feature
- Indicator is distinct from status badge (different position or style)

**Validation**:
- [ ] Completion indicator appears within 3 seconds
- [ ] Indicator is visually distinct from status badge
- [ ] Other features without 100% completion do not show indicator

---

### Scenario 2: Feature with Partial Completion (US1-P1)

**Setup**:
1. Modify a feature's tasks.md to have mixed completion:
   ```markdown
   ## Phase 1: Setup
   - [x] Task 1 completed
   - [ ] Task 2 incomplete
   - [ ] Task 3 incomplete
   ```

**Expected**:
- No completion indicator shown for this feature
- Status badge may show "In Progress" but no completion indicator

**Validation**:
- [ ] No completion indicator appears
- [ ] Feature still appears in list normally
- [ ] Other UI elements unchanged

---

### Scenario 3: Feature without tasks.md (US1-P1)

**Setup**:
1. View a feature that has only spec.md (no tasks.md file)

**Expected**:
- No completion indicator shown
- No errors displayed
- Feature list loads normally

**Validation**:
- [ ] No completion indicator appears
- [ ] No error messages in console or UI
- [ ] Feature list functions normally

---

### Scenario 4: Completion Tooltip (US2-P2)

**Setup**:
1. Use feature from Scenario 1 (100% complete)
2. Hover mouse over the completion indicator

**Expected**:
- Tooltip appears showing "X/X tasks completed (100%)"
- Tooltip disappears when mouse moves away

**Validation**:
- [ ] Tooltip shows correct task count
- [ ] Tooltip shows "100%" percentage
- [ ] Tooltip disappears on mouse leave
- [ ] Tooltip positioning is readable (not cut off)

---

### Scenario 5: Visual Distinction from Status Badge (US3-P2)

**Setup**:
1. Create feature with:
   - status="Complete" in spec.md frontmatter
   - tasks.md with only 50% completion
2. Create another feature with:
   - status="In Progress" in spec.md
   - tasks.md with 100% completion

**Expected Case 1** (Complete status, incomplete tasks):
- Green "Complete" badge visible
- No completion indicator

**Expected Case 2** (In Progress status, complete tasks):
- Yellow "In Progress" badge visible
- Completion indicator visible

**Validation**:
- [ ] Both indicators can coexist without confusion
- [ ] Status badge and completion indicator are clearly different
- [ ] User can distinguish manual status from actual completion

---

### Scenario 6: Edge Case - Malformed tasks.md

**Setup**:
1. Create a tasks.md with malformed content:
   ```markdown
   This is not valid markdown
   No checkboxes here!
   ```

**Expected**:
- No completion indicator shown
- No error displayed to user
- Feature list loads normally
- (Optional) Warning logged to console

**Validation**:
- [ ] No completion indicator appears
- [ ] No user-visible errors
- [ ] Application continues to function

---

### Scenario 7: Auto-Refresh (FR-007)

**Setup**:
1. Have spec-board open showing feature list
2. Modify a feature's tasks.md externally (text editor)
3. Change completion from partial to 100%

**Expected**:
- Within 3 seconds, completion indicator appears automatically
- No manual page refresh needed

**Validation**:
- [ ] Indicator appears within 3 seconds of file save
- [ ] Existing 3-second polling mechanism works
- [ ] No need to manually refresh browser

---

## Quick Validation Checklist

After implementation, run through all scenarios:

- [ ] US1-P1: Visual indicator for 100% complete features
- [ ] US1-P1: No indicator for partial/no tasks
- [ ] US2-P2: Tooltip shows completion details on hover
- [ ] US3-P2: Completion indicator distinct from status badge
- [ ] FR-006: Graceful handling of missing/malformed tasks.md
- [ ] FR-007: Auto-refresh within 3 seconds
- [ ] Edge cases handled without errors

## Performance Check

- [ ] Feature list loads within 200ms (unchanged from baseline)
- [ ] No console errors or warnings (except optional malformed file logs)
- [ ] Browser memory usage unchanged (lightweight indicator)
