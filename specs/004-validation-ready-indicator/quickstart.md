# Quickstart: Validation-Ready Indicator

**Feature**: 004-validation-ready-indicator
**Purpose**: Manual validation scenarios for the validation-ready indicator feature
**Prerequisite**: Feature 003 (completion indicator) must be implemented and working

## Test Environment Setup

1. Start the spec-board server:
   ```bash
   # From repo root
   uvx --from . spec-board
   # Or if installed: spec-board
   ```

2. Open browser to: `http://localhost:8000`

3. Ensure you have test features in `specs/` directory with tasks.md files

## Validation Scenarios

### Scenario 1: V Indicator Appears (Implementation Complete, Validation Pending)

**Goal**: Verify "V" indicator appears when only validation tasks remain incomplete

**Setup**:
1. Create or modify a test feature's tasks.md:
   ```markdown
   - [x] T001 Create data model
   - [x] T002 Create service layer
   - [x] T003 Add UI components
   - [ ] Manual validation: Test data model
   - [ ] Manual validation: Test service layer
   ```

**Expected Result**:
- ✅ Feature shows "V" indicator (yellow/amber color)
- ✅ No "✓" indicator shown
- ✅ V indicator appears in same position as artifact dots (●●●)

**Validation**:
- [ ] V indicator visible and distinct from other UI elements
- [ ] Indicator appears within 3 seconds of saving tasks.md (auto-refresh)
- [ ] Indicator persists on page refresh

---

### Scenario 2: ✓ Indicator Persists (All Tasks Complete)

**Goal**: Verify existing "✓" indicator from feature 003 still works correctly

**Setup**:
1. Modify test feature's tasks.md to complete all tasks including validation:
   ```markdown
   - [x] T001 Create data model
   - [x] T002 Create service layer
   - [x] T003 Add UI components
   - [x] Manual validation: Test data model
   - [x] Manual validation: Test service layer
   ```

**Expected Result**:
- ✅ Feature shows "✓" indicator (green color)
- ✅ No "V" indicator shown
- ✅ Checkmark takes precedence over V indicator

**Validation**:
- [ ] Green ✓ indicator visible
- [ ] No yellow V indicator present
- [ ] Tooltip shows "X/X tasks completed (100%)"

---

### Scenario 3: No Indicator (Implementation Incomplete)

**Goal**: Verify no indicator shows when implementation tasks remain incomplete

**Setup**:
1. Modify test feature's tasks.md with incomplete implementation:
   ```markdown
   - [x] T001 Create data model
   - [ ] T002 Create service layer (incomplete implementation)
   - [x] T003 Add UI components
   - [ ] Manual validation: Test data model
   - [x] Manual validation: Test service layer (validation complete, but implementation not)
   ```

**Expected Result**:
- ✅ No V indicator shown
- ✅ No ✓ indicator shown
- ✅ Implementation tasks block validation indicator

**Validation**:
- [ ] No indicator displayed next to feature name
- [ ] Artifact dots (●●●) still visible
- [ ] Feature appears "in progress" visually

---

### Scenario 4: Validation Tooltip (Hover Details)

**Goal**: Verify tooltip displays validation task details on hover

**Setup**:
1. Use feature from Scenario 1 (V indicator showing)
2. Hover mouse over the "V" indicator

**Expected Result**:
- ✅ Tooltip appears showing validation details
- ✅ Example text: "2 validation tasks remaining" or similar
- ✅ Tooltip disappears when mouse leaves

**Validation**:
- [ ] Tooltip appears on hover within 200ms
- [ ] Tooltip content is readable and clear
- [ ] Tooltip doesn't get cut off by viewport edges
- [ ] Tooltip disappears when cursor moves away

---

### Scenario 5: Visual Distinction (V vs ✓)

**Goal**: Verify V and ✓ indicators are clearly distinguishable

**Setup**:
1. Create two test features side by side:
   - Feature A: Only validation tasks remaining (show V)
   - Feature B: All tasks complete (show ✓)

**Expected Result**:
- ✅ V indicator uses yellow/amber color (`text-amber-600` or `text-yellow-600`)
- ✅ ✓ indicator uses green color (`text-emerald-600`)
- ✅ Different symbols (V vs ✓) are immediately distinguishable
- ✅ Both indicators same size and font weight

**Validation**:
- [ ] Can instantly tell which feature is validation-ready vs complete
- [ ] Color difference is noticeable (not too subtle)
- [ ] Indicators align visually (same baseline)
- [ ] No confusion between states

---

### Scenario 6: Edge Case - Only Validation Tasks

**Goal**: Verify behavior when feature has only validation tasks (no implementation)

**Setup**:
1. Create test feature with only validation tasks:
   ```markdown
   - [ ] Manual validation: Test integration with external service
   - [ ] Manual validation: Verify error handling
   - [ ] Manual validation: Check edge cases
   ```

**Expected Result**:
- ✅ V indicator shows (since implementation_tasks_remaining = 0)
- ✅ Tooltip shows validation task count
- ✅ System treats this as "implementation complete" (vacuous truth)

**Validation**:
- [ ] V indicator appears
- [ ] No errors or warnings
- [ ] Behavior is logical and expected

---

### Scenario 7: Edge Case - No Validation Tasks

**Goal**: Verify backward compatibility when feature has no validation tasks

**Setup**:
1. Use feature from feature 003 era (no "Manual validation:" tasks):
   ```markdown
   - [x] T001 Create model
   - [x] T002 Create service
   - [x] T003 Add template
   ```

**Expected Result**:
- ✅ ✓ indicator shows (100% complete, as in feature 003)
- ✅ No V indicator ever shows (no validation tasks exist)
- ✅ Feature 003 behavior is preserved

**Validation**:
- [ ] Green ✓ shows when all tasks complete
- [ ] No indicator when tasks incomplete
- [ ] No errors or confusion

---

### Scenario 8: Edge Case - Missing or Empty tasks.md

**Goal**: Verify graceful degradation when tasks.md is missing or malformed

**Setup**:
1. Test feature with no tasks.md file
2. Test feature with empty tasks.md file
3. Test feature with malformed tasks.md (no valid checkboxes)

**Expected Result**:
- ✅ No V indicator shown
- ✅ No ✓ indicator shown
- ✅ No errors displayed to user
- ✅ Feature appears normal (just without indicator)

**Validation**:
- [ ] Application doesn't crash
- [ ] No error messages in UI
- [ ] Feature list still functional
- [ ] Other features unaffected

---

### Scenario 9: Auto-Refresh Updates

**Goal**: Verify indicator updates automatically when tasks.md changes

**Setup**:
1. Open spec-board in browser
2. View feature with V indicator
3. Open tasks.md in editor
4. Complete remaining validation tasks (mark [x])
5. Save file
6. Wait 3 seconds (auto-refresh interval)

**Expected Result**:
- ✅ V indicator disappears
- ✅ ✓ indicator appears
- ✅ Update happens without manual page refresh
- ✅ Transition is smooth (no flashing or errors)

**Validation**:
- [ ] Indicator updates within 3 seconds
- [ ] No page flicker or layout shift
- [ ] Other UI elements remain stable
- [ ] Polling doesn't cause performance issues

---

### Scenario 10: Case Insensitivity

**Goal**: Verify validation task detection is case-insensitive

**Setup**:
1. Create tasks.md with various case patterns:
   ```markdown
   - [x] T001 Implementation task
   - [ ] Manual validation: lowercase prefix
   - [ ] MANUAL VALIDATION: uppercase prefix
   - [ ] Manual Validation: title case prefix
   - [ ] mAnUaL vAlIdAtIoN: mixed case prefix
   ```

**Expected Result**:
- ✅ All four validation tasks are detected correctly
- ✅ V indicator shows (1 implementation complete, 4 validation incomplete)
- ✅ Case variations don't affect classification

**Validation**:
- [ ] V indicator appears
- [ ] Tooltip shows "4 validation tasks remaining"
- [ ] All case patterns recognized

---

## Success Criteria Validation

Map these scenarios to the success criteria from spec.md:

- **SC-001** (Identify validation-ready at a glance): Scenarios 1, 5
- **SC-002** (Updates within 3 seconds): Scenario 9
- **SC-003** (Zero false positives): Scenarios 3, 7, 8
- **SC-004** (Zero false negatives): Scenarios 1, 6, 10
- **SC-005** (Visual distinction): Scenario 5

## Acceptance Checklist

Before marking feature complete, all scenarios must pass:

- [ ] Scenario 1: V indicator shows for validation-ready features
- [ ] Scenario 2: ✓ indicator still works for complete features
- [ ] Scenario 3: No indicator for incomplete implementation
- [ ] Scenario 4: Tooltip displays validation details
- [ ] Scenario 5: Visual distinction between V and ✓ is clear
- [ ] Scenario 6: Edge case - only validation tasks handled
- [ ] Scenario 7: Edge case - backward compatibility with no validation tasks
- [ ] Scenario 8: Edge case - graceful degradation for missing/malformed files
- [ ] Scenario 9: Auto-refresh updates indicator correctly
- [ ] Scenario 10: Case-insensitive validation task detection

## Notes

- **Manual testing only**: No automated tests per constitution principle IV
- **Auto-refresh interval**: 3 seconds (configured in feature 001)
- **Performance target**: Each validation calculation must complete in <200ms
- **Browser compatibility**: Test in primary browser only (prototype phase)
