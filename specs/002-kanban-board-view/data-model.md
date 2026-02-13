# Data Model: Kanban Board View

**Feature**: 002-kanban-board-view
**Date**: 2026-02-13

## Overview

The board view requires parsing tasks.md into structured data representing phases, tasks, and the overall board state. All entities exist in-memory only (no persistence) and are created from markdown parsing each time the board view is requested.

---

## Entity: Phase

Represents a section of tasks grouped by implementation phase.

**Attributes**:
- `number`: Integer phase number (e.g., 1, 2, 3)
- `name`: String phase name (e.g., "Setup", "User Story 1")
- `full_title`: String complete title from markdown (e.g., "Phase 1: Setup")
- `tasks`: List[Task] - ordered list of tasks in this phase
- `completed_count`: Integer count of completed tasks
- `total_count`: Integer total tasks in phase
- `completion_percentage`: Float (0.0 to 100.0)
- `is_current`: Boolean - first phase with incomplete tasks
- `is_next`: Boolean - next phase after current
- `order`: Integer for sorting phases

**Relationships**:
- Contains many **Tasks** (one-to-many)
- Part of one **Board** (many-to-one)

**Derived Properties**:
```python
completion_percentage = (completed_count / total_count) * 100 if total_count > 0 else 0
is_empty = total_count == 0
is_complete = completed_count == total_count
```

**Example**:
```python
Phase(
    number=3,
    name="User Story 1",
    full_title="Phase 3: User Story 1 - View Features",
    tasks=[...],  # List of Task objects
    completed_count=8,
    total_count=10,
    completion_percentage=80.0,
    is_current=True,
    is_next=False,
    order=3
)
```

---

## Entity: Task

Represents an individual work item from tasks.md.

**Attributes**:
- `id`: String task identifier (e.g., "T020")
- `description`: String task description text
- `is_complete`: Boolean completion status
- `story_label`: Optional[String] user story label (e.g., "US1", "US2")
- `is_parallel`: Boolean parallel execution marker
- `raw_line`: String original markdown line
- `phase`: Phase reference to containing phase

**Relationships**:
- Belongs to one **Phase** (many-to-one)

**Parsing Rules**:
```python
# Checkbox states
- [ ] → is_complete = False
- [x] or [X] → is_complete = True

# Task ID extraction
T\d{3} → e.g., T001, T020, T055

# Story label extraction
\[US\d+\] → e.g., [US1], [US2]

# Parallel marker
\[P\] → is_parallel = True
```

**Example**:
```python
Task(
    id="T020",
    description="Create dashboard.html template with 4-column layout",
    is_complete=True,
    story_label="US1",
    is_parallel=False,
    raw_line="- [x] T020 [US1] Create dashboard.html template...",
    phase=phase3  # Reference to Phase object
)
```

---

## Entity: Board

Represents the complete Kanban board state for a feature's tasks.md.

**Attributes**:
- `feature_id`: String feature identifier (e.g., "001-spec-dashboard")
- `phases`: List[Phase] - ordered list of all phases
- `total_tasks`: Integer total task count across all phases
- `completed_tasks`: Integer completed task count
- `overall_completion`: Float percentage (0.0 to 100.0)
- `current_phase`: Optional[Phase] - first phase with incomplete tasks
- `next_phase`: Optional[Phase] - phase after current
- `has_ungrouped_tasks`: Boolean - tasks found outside phase sections

**Relationships**:
- Contains many **Phases** (one-to-many)

**Derived Properties**:
```python
overall_completion = (completed_tasks / total_tasks) * 100 if total_tasks > 0 else 0
is_complete = completed_tasks == total_tasks
active_phase_count = count(phases where completion < 100%)
```

**Example**:
```python
Board(
    feature_id="001-spec-dashboard",
    phases=[phase1, phase2, phase3, phase4],  # List of Phase objects
    total_tasks=45,
    completed_tasks=35,
    overall_completion=77.8,
    current_phase=phase4,  # Phase 4 has incomplete tasks
    next_phase=phase5,     # Phase 5 is next
    has_ungrouped_tasks=False
)
```

---

## Entity Relationships Diagram

```text
Board (1) ──────┬───────> Phase (N)
                │           │
                │           ├─ number
                │           ├─ name
                │           ├─ completion_percentage
                │           └─ is_current
                │
                └───────> Phase ──────> Task (N)
                                          │
                                          ├─ id
                                          ├─ description
                                          ├─ is_complete
                                          └─ story_label
```

---

## Data Flow

### Parsing Flow

```text
1. Load tasks.md file content (via FeatureRepository)
   │
   ├─> 2. Extract phase boundaries (regex: ## Phase N:)
   │   │
   │   └─> 3. Create Phase objects with metadata
   │
   ├─> 4. Extract tasks (regex: - [x] TXXX)
   │   │
   │   └─> 5. Create Task objects with parsed fields
   │
   ├─> 6. Associate tasks with their containing phase
   │   │
   │   └─> 7. Calculate phase completion percentages
   │
   └─> 8. Create Board object with all phases and totals
       │
       └─> 9. Identify current phase and next phase
```

### Rendering Flow

```text
Board object
   │
   ├─> Template: board_view.html
   │      │
   │      └─> For each phase:
   │             │
   │             ├─> Component: board_phase_column.html
   │             │      │
   │             │      └─> For each task:
   │             │             │
   │             │             └─> Component: board_task_card.html
   │             │
   │             └─> Render column with header and cards
   │
   └─> Final HTML sent to browser
```

---

## Validation Rules

### Phase Validation
- ✅ Phase number must be positive integer
- ✅ Phase name must not be empty
- ✅ Completion percentage must be 0-100
- ✅ Only one phase can be marked as current
- ✅ Next phase must come after current phase

### Task Validation
- ✅ Task ID must match T\d{3} pattern
- ✅ Description must not be empty
- ✅ Story label (if present) must match US\d+ pattern
- ⚠️  Tasks without IDs are gracefully handled (ID shown as "---")

### Board Validation
- ✅ Board must have at least one phase or ungrouped tasks
- ✅ Total tasks equals sum of all phase task counts
- ✅ Completed tasks equals sum of all phase completed counts
- ✅ Current phase logic: first phase where completion < 100%

---

## State Transitions

**Phase States**:
- `Not Started` → completion = 0%
- `In Progress` → 0% < completion < 100%
- `Complete` → completion = 100%

**Phase Indicators**:
- `is_current = True` → First incomplete phase
- `is_next = True` → Phase immediately after current
- Both `False` → Either completed or future phase

**Board States**:
- `Empty` → total_tasks = 0
- `In Progress` → 0 < completed_tasks < total_tasks
- `Complete` → completed_tasks = total_tasks

---

## Example Data Structure

```python
board = Board(
    feature_id="001-spec-dashboard",
    phases=[
        Phase(
            number=1,
            name="Setup",
            full_title="Phase 1: Setup",
            tasks=[
                Task(id="T001", description="Initialize uv project", is_complete=True, story_label=None),
                Task(id="T002", description="Add dependencies", is_complete=True, story_label=None),
            ],
            completed_count=2,
            total_count=2,
            completion_percentage=100.0,
            is_current=False,
            is_next=False
        ),
        Phase(
            number=3,
            name="User Story 1",
            full_title="Phase 3: User Story 1 - View Features",
            tasks=[
                Task(id="T020", description="Create dashboard", is_complete=True, story_label="US1"),
                Task(id="T021", description="Add column layout", is_complete=False, story_label="US1"),
            ],
            completed_count=1,
            total_count=2,
            completion_percentage=50.0,
            is_current=True,
            is_next=False
        ),
    ],
    total_tasks=4,
    completed_tasks=3,
    overall_completion=75.0,
    current_phase=phases[1],  # Phase 3
    next_phase=None
)
```

---

## Implementation Notes

**Language**: Python with dataclasses and type hints

**Storage**: In-memory only (no database)

**Lifecycle**: Created on each board view request, discarded after response sent

**Performance**: O(n) parsing where n = number of lines in tasks.md

**Error Handling**: Graceful degradation for malformed tasks (skip, don't break rendering)
