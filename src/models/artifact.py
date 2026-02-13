"""Artifact data model representing markdown files (spec.md, plan.md, tasks.md)."""

from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .artifact_metadata import ArtifactMetadata


class ArtifactType(Enum):
    """Types of artifacts in spec-kit."""

    SPEC = "spec"
    PLAN = "plan"
    TASKS = "tasks"


@dataclass
class Artifact:
    """A markdown artifact file.

    Represents a single markdown file (spec.md, plan.md, or tasks.md) with
    metadata and content. Content is lazy-loaded on demand.
    """

    type: ArtifactType                    # spec, plan, or tasks
    path: Path                            # Absolute path to markdown file
    exists: bool                          # Whether file exists
    size_bytes: int                       # File size (0 if not exists)
    metadata: 'ArtifactMetadata'          # Extracted frontmatter
    content_raw: Optional[str] = None     # Raw markdown content (lazy loaded)
    content_html: Optional[str] = None    # Rendered HTML (lazy loaded)

    def __post_init__(self) -> None:
        """Validate artifact after initialization."""
        # Validate filename matches type
        expected_filename = f"{self.type.value}.md"
        if self.path.name != expected_filename:
            raise ValueError(
                f"Path filename '{self.path.name}' doesn't match type '{expected_filename}'"
            )

        # Validate exists matches actual file state
        actual_exists = self.path.exists()
        if self.exists != actual_exists:
            raise ValueError(
                f"Exists flag ({self.exists}) doesn't match actual state ({actual_exists})"
            )

        # Validate size_bytes is 0 if file doesn't exist
        if not self.exists and self.size_bytes != 0:
            raise ValueError(
                f"Size must be 0 for non-existent file, got {self.size_bytes}"
            )

    def load_content(self) -> str:
        """Load raw markdown content from file.

        Returns:
            Raw markdown content as string

        Raises:
            FileNotFoundError: If file doesn't exist
            IOError: If file can't be read
        """
        if not self.exists:
            raise FileNotFoundError(f"Artifact file does not exist: {self.path}")

        with open(self.path, 'r', encoding='utf-8') as f:
            self.content_raw = f.read()

        return self.content_raw
