"""Feature data model representing a single spec-kit feature directory."""

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .artifact import Artifact


@dataclass
class Feature:
    """A single feature with spec, plan, and tasks artifacts.

    Represents a feature directory (e.g., 001-spec-dashboard) containing
    spec.md, plan.md, and tasks.md files. Immutable read-only entity.
    """

    number: str                          # Feature number (e.g., "001", "002")
    short_name: str                      # Short name (e.g., "spec-dashboard")
    full_name: str                       # Full directory name (e.g., "001-spec-dashboard")
    path: Path                           # Absolute path to feature directory
    artifacts: Dict[str, 'Artifact']     # Available artifacts by type (spec, plan, tasks)
    created_date: Optional[datetime]     # Extracted from spec.md frontmatter
    status: Optional[str]                # Extracted from spec.md frontmatter (Draft, Planning, etc.)

    def __post_init__(self) -> None:
        """Validate feature after initialization."""
        if not self.path.exists():
            raise ValueError(f"Feature path does not exist: {self.path}")

        if not self.path.is_dir():
            raise ValueError(f"Feature path is not a directory: {self.path}")

        # Validate number is numeric
        if not self.number.isdigit():
            raise ValueError(f"Feature number must be numeric: {self.number}")

        # Validate full_name matches pattern
        expected_name = f"{self.number}-{self.short_name}"
        if self.full_name != expected_name:
            raise ValueError(
                f"Full name '{self.full_name}' doesn't match pattern '{expected_name}'"
            )

        # Validate artifact keys
        valid_keys = {"spec", "plan", "tasks"}
        invalid_keys = set(self.artifacts.keys()) - valid_keys
        if invalid_keys:
            raise ValueError(f"Invalid artifact keys: {invalid_keys}")
