"""Project data model representing the root specs/ directory."""

from dataclasses import dataclass
from pathlib import Path
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from .feature import Feature


@dataclass
class Project:
    """Root project containing all features.

    Represents the specs/ directory containing all spec-kit features.
    Immutable read-only entity derived from file system structure.
    """

    name: str                      # Project name (derived from repo/dir name)
    specs_path: Path               # Absolute path to specs/ directory
    features: List['Feature']      # All features found in specs/

    def __post_init__(self) -> None:
        """Validate project after initialization."""
        if not self.specs_path.exists():
            raise ValueError(f"Specs path does not exist: {self.specs_path}")

        if not self.specs_path.is_dir():
            raise ValueError(f"Specs path is not a directory: {self.specs_path}")
