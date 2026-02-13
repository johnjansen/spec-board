"""Task board parsing service for Kanban visualization.

Parses tasks.md files to extract phases, tasks, and board structure
for visual progress tracking in board view.
"""

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Tuple


@dataclass
class Task:
    """Represents an individual task from tasks.md.

    Attributes:
        id: Task identifier (e.g., "T001", "T020")
        description: Task description text
        is_complete: Whether task is completed
        story_label: User story label if present (e.g., "US1", "US2")
        is_parallel: Whether task can run in parallel ([P] marker)
        raw_line: Original markdown line
    """
    id: str
    description: str
    is_complete: bool
    story_label: Optional[str] = None
    is_parallel: bool = False
    raw_line: str = ""

    @classmethod
    def from_markdown_line(cls, line: str) -> Optional['Task']:
        """Parse a task from a markdown checkbox line.

        Args:
            line: Markdown line containing task checkbox

        Returns:
            Task object if line matches task pattern, None otherwise
        """
        # Pattern: - [ ] or - [x] or - [X]
        # Then optional: TXXX [P?] [US#?] Description
        checkbox_pattern = r'^\s*-\s+\[([ xX])\]\s+(.+)$'
        match = re.match(checkbox_pattern, line)

        if not match:
            return None

        checkbox_state = match.group(1)
        task_content = match.group(2)

        # Extract task ID (TXXX pattern)
        task_id_match = re.search(r'\b(T\d{3})\b', task_content)
        task_id = task_id_match.group(1) if task_id_match else "---"

        # Extract story label ([US#] pattern)
        story_match = re.search(r'\[US(\d+)\]', task_content)
        story_label = f"US{story_match.group(1)}" if story_match else None

        # Check for parallel marker ([P])
        is_parallel = '[P]' in task_content

        # Extract description (remove markers)
        description = task_content
        # Remove task ID
        if task_id != "---":
            description = re.sub(r'\b' + re.escape(task_id) + r'\b', '', description, count=1)
        # Remove markers
        description = re.sub(r'\[P\]', '', description)
        if story_label:
            description = re.sub(r'\[' + re.escape(story_label) + r'\]', '', description)
        # Clean up extra whitespace
        description = ' '.join(description.split()).strip()

        return cls(
            id=task_id,
            description=description,
            is_complete=(checkbox_state.lower() == 'x'),
            story_label=story_label,
            is_parallel=is_parallel,
            raw_line=line
        )


@dataclass
class Phase:
    """Represents a phase grouping of tasks.

    Attributes:
        number: Phase number (1, 2, 3, etc.)
        name: Phase name (e.g., "Setup", "User Story 1")
        full_title: Complete title from markdown
        tasks: List of tasks in this phase
        order: Sort order for display
        is_current: Whether this is the current active phase
        is_next: Whether this is the next upcoming phase
    """
    number: int
    name: str
    full_title: str
    tasks: List[Task] = field(default_factory=list)
    order: int = 0
    is_current: bool = False
    is_next: bool = False

    @property
    def total_count(self) -> int:
        """Total number of tasks in phase."""
        return len(self.tasks)

    @property
    def completed_count(self) -> int:
        """Number of completed tasks in phase."""
        return sum(1 for task in self.tasks if task.is_complete)

    @property
    def completion_percentage(self) -> float:
        """Completion percentage (0.0 to 100.0)."""
        if self.total_count == 0:
            return 0.0
        return (self.completed_count / self.total_count) * 100.0

    @property
    def is_empty(self) -> bool:
        """Whether phase has no tasks."""
        return self.total_count == 0

    @property
    def is_complete(self) -> bool:
        """Whether all tasks in phase are complete."""
        return self.total_count > 0 and self.completed_count == self.total_count


@dataclass
class Board:
    """Represents the complete board state for a feature.

    Attributes:
        feature_id: Feature identifier (e.g., "001-spec-dashboard")
        phases: List of all phases
        has_ungrouped_tasks: Whether there are tasks outside phases
    """
    feature_id: str
    phases: List[Phase] = field(default_factory=list)
    has_ungrouped_tasks: bool = False

    @property
    def total_tasks(self) -> int:
        """Total task count across all phases."""
        return sum(phase.total_count for phase in self.phases)

    @property
    def completed_tasks(self) -> int:
        """Completed task count across all phases."""
        return sum(phase.completed_count for phase in self.phases)

    @property
    def overall_completion(self) -> float:
        """Overall completion percentage (0.0 to 100.0)."""
        if self.total_tasks == 0:
            return 0.0
        return (self.completed_tasks / self.total_tasks) * 100.0

    @property
    def current_phase(self) -> Optional[Phase]:
        """First phase with incomplete tasks."""
        for phase in self.phases:
            if not phase.is_complete and phase.total_count > 0:
                return phase
        return None

    @property
    def next_phase(self) -> Optional[Phase]:
        """Phase after current phase."""
        current = self.current_phase
        if current is None:
            return None

        # Find current phase index
        current_index = None
        for i, phase in enumerate(self.phases):
            if phase.number == current.number:
                current_index = i
                break

        # Return next phase if exists
        if current_index is not None and current_index + 1 < len(self.phases):
            return self.phases[current_index + 1]

        return None

    @property
    def is_complete(self) -> bool:
        """Whether all tasks are complete."""
        return self.total_tasks > 0 and self.completed_tasks == self.total_tasks

    @property
    def active_phase_count(self) -> int:
        """Count of phases with incomplete tasks."""
        return sum(1 for phase in self.phases if not phase.is_complete and phase.total_count > 0)


class TaskBoardParser:
    """Parses tasks.md files into structured board data.

    Extracts phase boundaries, groups tasks by phase, calculates
    completion statistics, and identifies current/next phases.
    """

    def __init__(self):
        """Initialize the parser with regex patterns."""
        # Pattern: ## Phase 1: Setup
        self.phase_pattern = re.compile(r'^##\s+Phase\s+(\d+):\s*(.+)$', re.MULTILINE)

    def parse(self, content: str, feature_id: str) -> Board:
        """Parse tasks.md content into a Board object.

        Args:
            content: Raw tasks.md file content
            feature_id: Feature identifier for the board

        Returns:
            Board object with phases and tasks
        """
        try:
            board = Board(feature_id=feature_id)

            # Extract phase boundaries
            phase_matches = list(self.phase_pattern.finditer(content))

            if not phase_matches:
                # No phases found - create ungrouped tasks phase
                ungrouped_phase = Phase(
                    number=0,
                    name="Ungrouped Tasks",
                    full_title="Ungrouped Tasks",
                    order=0
                )
                tasks = self._extract_tasks_from_section(content, 0, len(content))
                ungrouped_phase.tasks = tasks
                board.phases = [ungrouped_phase]
                board.has_ungrouped_tasks = True
                return board

            # Process each phase
            for i, match in enumerate(phase_matches):
                phase_number = int(match.group(1))
                phase_name = match.group(2).strip()
                full_title = match.group(0).replace('##', '').strip()

                # Determine section boundaries
                section_start = match.end()
                section_end = phase_matches[i + 1].start() if i + 1 < len(phase_matches) else len(content)

                # Extract tasks for this phase
                section_content = content[section_start:section_end]
                tasks = self._extract_tasks_from_section(section_content, section_start, section_end)

                # Create phase
                phase = Phase(
                    number=phase_number,
                    name=phase_name,
                    full_title=full_title,
                    tasks=tasks,
                    order=i
                )

                board.phases.append(phase)

            # Identify current and next phases
            self._mark_current_and_next_phases(board)

            return board

        except Exception as e:
            # Graceful error handling - return empty board
            return Board(
                feature_id=feature_id,
                phases=[Phase(
                    number=0,
                    name="Error",
                    full_title=f"Error parsing tasks.md: {str(e)}",
                    order=0
                )]
            )

    def _extract_tasks_from_section(self, content: str, start_pos: int, end_pos: int) -> List[Task]:
        """Extract all tasks from a markdown section.

        Args:
            content: Section content to parse
            start_pos: Start position in original content
            end_pos: End position in original content

        Returns:
            List of Task objects found in section
        """
        tasks = []
        lines = content.split('\n')

        for line in lines:
            task = Task.from_markdown_line(line)
            if task:
                tasks.append(task)

        return tasks

    def _mark_current_and_next_phases(self, board: Board) -> None:
        """Mark current and next phases on the board.

        Args:
            board: Board to update with current/next markers
        """
        # Find first incomplete phase
        current = board.current_phase
        next_phase = board.next_phase

        # Mark phases
        for phase in board.phases:
            if current and phase.number == current.number:
                phase.is_current = True
            if next_phase and phase.number == next_phase.number:
                phase.is_next = True

    def classify_task(self, task_description: str) -> str:
        """Classify task as validation or implementation.

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

    def calculate_completion_percentage(self, tasks_md_path: Path) -> Tuple[Optional[float], int, int, int, int]:
        """Calculate task completion percentage and counts from tasks.md file.

        Args:
            tasks_md_path: Absolute path to tasks.md file

        Returns:
            Tuple of (percentage, total_tasks, completed_tasks, validation_incomplete, implementation_incomplete):
            - percentage: 0.0-100.0 or None if file missing/malformed
            - total_tasks: Total number of tasks found
            - completed_tasks: Number of completed tasks
            - validation_incomplete: Number of incomplete validation tasks
            - implementation_incomplete: Number of incomplete implementation tasks

        Examples:
            - All complete: (100.0, 10, 10, 0, 0)
            - Partial: (50.0, 10, 5, 2, 3)
            - No tasks: (None, 0, 0, 0, 0)
            - File missing: (None, 0, 0, 0, 0)
        """
        try:
            # Check if file exists
            if not tasks_md_path.exists():
                return (None, 0, 0, 0, 0)

            # Read file content
            content = tasks_md_path.read_text(encoding='utf-8')

            # Pattern: - [ ] or - [x] or - [X], followed by task description
            checkbox_pattern = r'^\s*-\s+\[([ xX])\]\s+(.*)$'

            # Extract all checkboxes
            lines = content.split('\n')
            total_tasks = 0
            completed_tasks = 0
            validation_incomplete = 0
            implementation_incomplete = 0

            for line in lines:
                match = re.match(checkbox_pattern, line)
                if match:
                    total_tasks += 1
                    checkbox_state = match.group(1)
                    task_description = match.group(2)

                    is_complete = checkbox_state.lower() == 'x'
                    if is_complete:
                        completed_tasks += 1
                    else:
                        # Task is incomplete - classify it
                        task_type = self.classify_task(task_description)
                        if task_type == "validation":
                            validation_incomplete += 1
                        else:
                            implementation_incomplete += 1

            # Return (None, 0, 0, 0, 0) if no tasks found (empty or malformed file)
            if total_tasks == 0:
                return (None, 0, 0, 0, 0)

            # Calculate percentage
            percentage = (completed_tasks / total_tasks) * 100.0
            return (percentage, total_tasks, completed_tasks, validation_incomplete, implementation_incomplete)

        except Exception:
            # Graceful error handling - return (None, 0, 0, 0, 0) for any parsing errors
            return (None, 0, 0, 0, 0)
