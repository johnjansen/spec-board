# Data Model: Validation-Ready Indicator

**Feature**: 004-validation-ready-indicator
**Phase**: 1 (Design)
**Date**: 2026-02-14

## Overview

This feature extends the existing `Feature` entity from feature 003 to track validation status. No new entities are required - all changes are property additions to the existing data model.

## Entity: Feature (Extended)

**Location**: `src/models/feature.py`
**Action**: Add validation-related properties

### Existing Properties (from feature 003)
```python
@dataclass
class Feature:
    # ... existing properties ...
    completion_percentage: Optional[float] = None  # 0.0-100.0 or None if no tasks
    total_tasks: int = 0                           # Total task count from tasks.md
    completed_tasks: int = 0                       # Completed task count
```

### New Properties (this feature)
```python
@dataclass
class Feature:
    # ... existing properties ...

    # Validation status properties
    is_validation_ready: bool = False              # True if only validation tasks remain
    validation_tasks_remaining: int = 0            # Count of incomplete validation tasks
    implementation_tasks_remaining: int = 0        # Count of incomplete implementation tasks
```

### Property Specifications

#### `is_validation_ready`
- **Type**: `bool`
- **Default**: `False`
- **Purpose**: Flag indicating feature is implementation-complete and ready for validation
- **Derivation Logic**:
  ```python
  is_validation_ready = (
      implementation_tasks_remaining == 0 and
      validation_tasks_remaining > 0
  )
  ```
- **Use Case**: Template condition for showing "V" indicator

#### `validation_tasks_remaining`
- **Type**: `int`
- **Default**: `0`
- **Purpose**: Count of incomplete validation tasks (tasks starting with "Manual validation:")
- **Calculation**: Sum of unchecked validation task checkboxes in tasks.md
- **Use Case**: Tooltip detail ("3 validation tasks remaining")

#### `implementation_tasks_remaining`
- **Type**: `int`
- **Default**: `0`
- **Purpose**: Count of incomplete non-validation tasks (all other tasks)
- **Calculation**: Sum of unchecked non-validation task checkboxes in tasks.md
- **Use Case**: Determine if implementation is blocking validation

### Indicator Display Logic

The template uses these properties to determine which indicator to show:

```python
if completion_percentage == 100.0:
    # All tasks complete (both implementation and validation)
    display("✓")  # Green checkmark
elif is_validation_ready:
    # Implementation complete, validation pending
    display("V")  # Yellow/amber V
else:
    # Implementation incomplete or no tasks
    display(nothing)
```

### Validation Rules

1. **Consistency Check**:
   ```python
   assert (completed_tasks + validation_tasks_remaining +
           implementation_tasks_remaining) == total_tasks
   ```

2. **Validation-Ready Condition**:
   ```python
   if is_validation_ready:
       assert implementation_tasks_remaining == 0
       assert validation_tasks_remaining > 0
   ```

3. **Completion Condition**:
   ```python
   if completion_percentage == 100.0:
       assert validation_tasks_remaining == 0
       assert implementation_tasks_remaining == 0
   ```

## Entity: Task (Extended - Informal)

**Note**: No formal Task dataclass exists in the codebase. Tasks are parsed on-the-fly from tasks.md. This section documents the classification logic.

### Task Classification

Each task checkbox in tasks.md is classified as either:
- **Validation Task**: Description starts with "Manual validation:" (case-insensitive)
- **Implementation Task**: All other tasks

### Classification Algorithm
```python
def classify_task(task_description: str) -> str:
    """
    Classify task as 'validation' or 'implementation'.

    Args:
        task_description: Full task description text

    Returns:
        'validation' if task starts with "Manual validation:" (case-insensitive)
        'implementation' otherwise
    """
    normalized = task_description.lower().strip()
    if normalized.startswith("manual validation:"):
        return "validation"
    return "implementation"
```

### Examples

**Validation Tasks** (classified as validation):
```markdown
- [ ] Manual validation: Verify V indicator appears
- [ ] manual validation: Test tooltip hover behavior
- [ ] MANUAL VALIDATION: Check color distinction
```

**Implementation Tasks** (classified as implementation):
```markdown
- [ ] Add validation detection to task_board_parser.py
- [ ] Validate user input before saving  # "validate" in middle, not prefix
- [ ] Update Feature model with validation properties
- [ ] Test the validation logic  # "validation" in middle, not prefix
```

## Data Flow

```text
1. tasks.md (file)
   ↓ [TaskBoardParser.calculate_completion_percentage()]
2. Task counts by category
   ↓ [feature_repository._load_feature_basic()]
3. Feature entity (with validation properties)
   ↓ [Jinja2 template rendering]
4. HTML indicator display (V or ✓ or nothing)
```

### Detailed Flow

1. **Parse**: Read tasks.md, extract all task checkboxes
2. **Classify**: For each task, check if description starts with "Manual validation:"
3. **Count**:
   - Total tasks
   - Completed tasks (checkbox marked [x])
   - Incomplete validation tasks (validation + unchecked)
   - Incomplete implementation tasks (implementation + unchecked)
4. **Calculate**:
   - `completion_percentage = (completed_tasks / total_tasks) * 100`
   - `is_validation_ready = (implementation_tasks_remaining == 0 and validation_tasks_remaining > 0)`
5. **Store**: Assign all values to Feature entity
6. **Display**: Template conditionally shows indicator based on properties

## Edge Cases

### Case 1: Feature with Only Validation Tasks
```markdown
# tasks.md
- [ ] Manual validation: Test scenario 1
- [ ] Manual validation: Test scenario 2
```
**Result**:
- `total_tasks = 2`
- `completed_tasks = 0`
- `validation_tasks_remaining = 2`
- `implementation_tasks_remaining = 0`
- `is_validation_ready = True` → Show "V" indicator

### Case 2: Feature with Only Implementation Tasks
```markdown
# tasks.md
- [ ] Create model
- [ ] Create service
```
**Result**:
- `total_tasks = 2`
- `completed_tasks = 0`
- `validation_tasks_remaining = 0`
- `implementation_tasks_remaining = 2`
- `is_validation_ready = False` → Show nothing

### Case 3: Mixed Tasks (Both Incomplete)
```markdown
# tasks.md
- [ ] Create model (implementation)
- [x] Create service (implementation - complete)
- [ ] Manual validation: Test model
```
**Result**:
- `total_tasks = 3`
- `completed_tasks = 1`
- `validation_tasks_remaining = 1`
- `implementation_tasks_remaining = 1`
- `is_validation_ready = False` → Show nothing (blocked on implementation)

### Case 4: Implementation Complete, Validation Pending
```markdown
# tasks.md
- [x] Create model (complete)
- [x] Create service (complete)
- [ ] Manual validation: Test model
- [ ] Manual validation: Test service
```
**Result**:
- `total_tasks = 4`
- `completed_tasks = 2`
- `validation_tasks_remaining = 2`
- `implementation_tasks_remaining = 0`
- `is_validation_ready = True` → Show "V" indicator

### Case 5: All Complete
```markdown
# tasks.md
- [x] Create model
- [x] Create service
- [x] Manual validation: Test model
- [x] Manual validation: Test service
```
**Result**:
- `total_tasks = 4`
- `completed_tasks = 4`
- `completion_percentage = 100.0`
- `validation_tasks_remaining = 0`
- `implementation_tasks_remaining = 0`
- `is_validation_ready = False` → Show "✓" indicator (completion takes precedence)

### Case 6: No Tasks or Missing File
```markdown
# tasks.md missing or empty
```
**Result**:
- `completion_percentage = None`
- `total_tasks = 0`
- `completed_tasks = 0`
- `validation_tasks_remaining = 0`
- `implementation_tasks_remaining = 0`
- `is_validation_ready = False` → Show nothing

## Database Schema

**Not Applicable**: This feature uses file-based storage (tasks.md). All validation status is derived at runtime from parsing task files. No database changes required.

## Performance Considerations

### Memory Impact
- 3 new boolean/integer properties per Feature instance
- Negligible: ~12 bytes per feature (bool + 2 ints)
- For 50 features: ~600 bytes total overhead

### Computation Impact
- Single pass through tasks.md lines (already done for completion calculation)
- Additional per-task: 1 prefix check (~5-10ms per 50 tasks)
- Total overhead: <10% of existing calculation time

## Migration

**Not Required**: These are new optional properties with default values. Existing Feature instances will have:
- `is_validation_ready = False`
- `validation_tasks_remaining = 0`
- `implementation_tasks_remaining = 0`

No migration script needed. Properties are populated on next feature load.

## Summary

This data model extends the existing Feature entity with three properties to support validation-ready status. The design reuses the existing task parsing infrastructure and adds minimal computational overhead. All validation logic is stateless and derived from tasks.md at runtime.
