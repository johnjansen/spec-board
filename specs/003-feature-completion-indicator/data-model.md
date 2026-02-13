# Data Model: Feature Completion Indicator

## Overview

This feature extends the existing `Feature` model to include task completion data without modifying the core model structure. Completion data is calculated on-demand from tasks.md files.

## Entities

### Feature (Extended)

**Purpose**: Represents a feature directory in the specs/ folder. Extended to include completion percentage.

**Attributes** (additions only):
- `completion_percentage`: float (0.0-100.0) - Calculated percentage of completed tasks
  - Derived from tasks.md parsing
  - Null/None if tasks.md doesn't exist or is malformed
  - Calculated via task_board_parser service

**Relationships**:
- Has one tasks.md Artifact (existing)
- Has one Task Completion Status (derived, not persisted)

**Validation Rules**:
- completion_percentage must be between 0.0 and 100.0
- completion_percentage is None if tasks.md missing/malformed
- No validation errors shown to user - graceful degradation

### Task Completion Status (Derived Data)

**Purpose**: Represents the parsed completion state from tasks.md. Not a persistent entity - calculated on each feature load.

**Attributes**:
- `total_tasks`: int - Total number of tasks found in tasks.md
- `completed_tasks`: int - Number of tasks marked complete ([x])
- `completion_percentage`: float - Percentage of completion (completed/total * 100)
- `is_complete`: bool - True if completion_percentage == 100.0

**Source**: Parsed from tasks.md using existing task_board_parser logic

**Calculation Logic**:
1. Parse tasks.md for all task checkboxes (`- [ ]` and `- [x]`)
2. Count total tasks (both checked and unchecked)
3. Count completed tasks (only `- [x]`)
4. Calculate percentage: (completed / total) * 100
5. If total == 0 or file malformed, return None

## State Transitions

No state transitions - this is read-only derived data.

## Edge Cases

| Case | Handling |
|------|----------|
| tasks.md missing | completion_percentage = None, no indicator shown |
| tasks.md empty | completion_percentage = None, no indicator shown |
| tasks.md malformed | completion_percentage = None, no indicator shown, log warning |
| Zero tasks | completion_percentage = None (empty file case) |
| All tasks complete | completion_percentage = 100.0, show indicator |
| Partial completion | completion_percentage = X% (0-99), no indicator shown |

## Implementation Notes

- No database changes required
- No new files created
- Extends existing Feature model with calculated property
- Reuses task_board_parser.py for parsing logic
- Caching not required - leverages existing 3-second auto-refresh
