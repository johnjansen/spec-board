"""Artifact metadata extracted from markdown frontmatter."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Optional


@dataclass
class ArtifactMetadata:
    """Metadata extracted from markdown frontmatter.

    Parses frontmatter from spec-kit markdown files to extract feature
    metadata like branch name, creation date, and status.

    Frontmatter format:
        **Feature Branch**: `002-spec-dashboard`
        **Created**: 2026-02-13
        **Status**: Draft
    """

    feature_branch: Optional[str] = None         # From "Feature Branch: `xxx`"
    created_date: Optional[datetime] = None      # From "Created: YYYY-MM-DD"
    status: Optional[str] = None                 # From "Status: Draft/Planning/..."
    raw_frontmatter: Dict[str, Any] = field(default_factory=dict)  # All parsed fields

    def __post_init__(self) -> None:
        """Validate metadata after initialization."""
        # Validate status values if present
        valid_statuses = {"Draft", "Planning", "In Progress", "Complete", None}
        if self.status not in valid_statuses:
            # Log warning but don't fail - allow flexible statuses
            pass

    @classmethod
    def empty(cls) -> 'ArtifactMetadata':
        """Create an empty metadata instance with no parsed data.

        Returns:
            Empty ArtifactMetadata instance
        """
        return cls(
            feature_branch=None,
            created_date=None,
            status=None,
            raw_frontmatter={}
        )
