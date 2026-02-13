# Research: Validation-Ready Indicator

**Feature**: 004-validation-ready-indicator
**Phase**: 0 (Research & Technical Decisions)
**Date**: 2026-02-14

## Overview

This research document captures technical decisions and patterns for implementing the validation-ready indicator feature. Since this extends the existing completion indicator from feature 003, most infrastructure is already in place.

## Decision 1: Task Classification Method

**Question**: How should the system identify validation tasks vs implementation tasks?

**Options Considered**:
1. **Keyword matching**: Check for "validation", "testing", "verify" anywhere in description
2. **Prefix matching**: Require specific prefix like "Manual validation:" or "TEST:"
3. **Phase-based**: Assume all tasks in final phase are validation
4. **Metadata markers**: Use structured markers like `[VALIDATION]` in task descriptions

**Decision**: **Option 2 - Prefix matching with "Manual validation:"** (case-insensitive)

**Rationale**:
- User explicitly requested this pattern in spec clarification
- Unambiguous - no false positives from implementation tasks containing "validate" in different context
- Case-insensitive match provides flexibility ("Manual validation:", "manual validation:", "MANUAL VALIDATION:")
- Consistent with existing task marker patterns like `[P]` for parallel tasks
- Easy to document and explain to users

**Implementation**:
```python
def is_validation_task(task_description: str) -> bool:
    """Check if task is a validation task by prefix."""
    return task_description.lower().strip().startswith("manual validation:")
```

**Alternatives Rejected**:
- Option 1: Too many false positives (e.g., "Validate user input before saving" is implementation, not manual testing)
- Option 3: Assumes specific task organization, breaks if phases are restructured
- Option 4: Requires changing all existing task files, migration burden

## Decision 2: Indicator Logic

**Question**: What conditions should trigger the "V" indicator vs "✓" vs no indicator?

**Decision**: Three-state indicator system:
- **"V"**: All implementation tasks complete AND at least one validation task incomplete
- **"✓"**: All tasks complete (both implementation and validation)
- **No indicator**: Any implementation tasks incomplete (regardless of validation status)

**Rationale**:
- Clear prioritization: Implementation must complete before validation begins
- "V" signals "ready for manual testing" - actionable state for QA/validation
- Prevents confusing state where validation shows complete but implementation incomplete
- Matches natural workflow: build → test → complete

**Edge Cases Handled**:
- Feature with only validation tasks → Show "V" if any incomplete, "✓" if all complete
- Feature with no validation tasks → Behaves like feature 003 (only "✓" or nothing)
- Mixed incomplete (some validation, some implementation) → No indicator (block on implementation)

## Decision 3: Data Model Extension

**Question**: How should validation status be stored in the Feature model?

**Decision**: Add three new properties to Feature dataclass:
- `is_validation_ready: bool` - True if only validation tasks remain
- `validation_tasks_remaining: int` - Count of incomplete validation tasks
- `implementation_tasks_remaining: int` - Count of incomplete implementation tasks

**Rationale**:
- Mirrors existing `completion_percentage`, `total_tasks`, `completed_tasks` from feature 003
- Enables tooltip to show detailed breakdown
- Separates concerns: parser calculates, model stores, template displays
- Type hints maintain safety and IDE support

**Alternatives Rejected**:
- Single `validation_status` enum: Loses granularity for tooltips
- Recalculate on every template render: Performance concern for auto-refresh
- Store task lists: Excessive memory for dashboard display needs

## Decision 4: Parser Extension Pattern

**Question**: Should validation detection be a separate method or integrated into existing calculation?

**Decision**: Extend `calculate_completion_percentage()` to return validation breakdown

**Modified Signature**:
```python
def calculate_completion_percentage(
    self, tasks_md_path: Path
) -> Tuple[Optional[float], int, int, int, int]:
    """
    Returns: (percentage, total_tasks, completed_tasks,
              validation_incomplete, implementation_incomplete)
    """
```

**Rationale**:
- Single file parse pass (performance - avoid reading tasks.md twice)
- Atomic consistency - all counts from same parse operation
- Reuses existing checkbox pattern matching
- Minimal code duplication

**Alternatives Rejected**:
- New `calculate_validation_status()` method: Requires second file read, doubles I/O
- Separate ValidationParser class: Over-engineering for simple prefix check

## Decision 5: Visual Design

**Question**: How should "V" be distinguished from "✓"?

**Decision**: Use different symbols with distinct styling:
- **"V"** indicator: Yellow/orange color (`text-amber-600` or `text-yellow-600`)
- **"✓"** indicator: Green color (`text-emerald-600`) - existing from feature 003
- Both: Font size `text-xs`, font weight `font-bold`, same positioning after artifact dots

**Rationale**:
- Color distinction: Yellow/amber suggests "attention needed" (validation pending)
- Green suggests "complete" (all done)
- Same positioning ensures visual consistency
- Font size matches existing artifact indicators (●●● spec/plan/tasks)

**Alternatives Rejected**:
- Different positions: Breaks visual flow, harder to scan
- Icons instead of letters: Less semantic, requires icon library
- Different sizes: Disrupts alignment and visual harmony

## Implementation Notes

### Performance Considerations
- Task file parsing already <200ms per feature (validated in feature 003)
- Additional validation classification adds ~5-10ms per task (prefix check is O(1))
- Expected total: <250ms for features with 50+ tasks
- No performance optimization needed at this scale

### Graceful Degradation
- Missing tasks.md: Return `(None, 0, 0, 0, 0)` - no indicator shown
- Malformed tasks.md: Same fallback - no errors to user
- Tasks without clear classification: Default to implementation (conservative approach)

### Testing Strategy
- Manual validation via quickstart.md scenarios
- Test combinations: only-validation, only-implementation, mixed, empty
- Verify auto-refresh updates indicator within 3 seconds

## Dependencies

### Existing Infrastructure (Reused)
- `TaskBoardParser.calculate_completion_percentage()` - extend return values
- `Feature` dataclass - add validation properties
- `feature_repository._load_feature_basic()` - unpack extended return
- `column_features.html` - add conditional V indicator block

### No New Dependencies
- No new Python packages required
- No new frontend libraries
- Reuses existing HTMX polling and Tailwind CSS classes

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users forget to use "Manual validation:" prefix | V indicator never shows | Document clearly in README, provide examples in task templates |
| Ambiguous task descriptions | Misclassification | Strict prefix matching reduces ambiguity, conservative defaults |
| Performance degradation with large task files | Slow UI | Already validated <200ms in feature 003, adding <10% overhead |
| Confusion between V and ✓ | User misunderstanding | Clear visual distinction (color), tooltip explanation, documentation |

## Summary

All technical decisions resolved. No blocking unknowns remain. Ready to proceed to Phase 1 (data model and contracts).

**Key Takeaways**:
- Simple prefix matching for task classification
- Three-state indicator logic (none/V/✓)
- Extend existing parser method (single pass)
- Visual distinction via color (yellow vs green)
- No new dependencies or infrastructure
