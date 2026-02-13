"""Artifact parser for extracting metadata from markdown frontmatter."""

import re
from datetime import datetime
from typing import Any, Dict, Optional

from ..models.artifact_metadata import ArtifactMetadata


class ArtifactParser:
    """Parses markdown frontmatter to extract artifact metadata.

    Extracts metadata from spec-kit markdown files that use the format:
        **Feature Branch**: `002-spec-dashboard`
        **Created**: 2026-02-13
        **Status**: Draft
    """

    def parse_frontmatter(self, markdown_content: str) -> ArtifactMetadata:
        """Parse frontmatter from markdown content.

        Extracts feature branch, created date, and status from markdown
        frontmatter formatted as bold key-value pairs.

        Args:
            markdown_content: Raw markdown content

        Returns:
            ArtifactMetadata object with extracted fields
        """
        if not markdown_content:
            return ArtifactMetadata.empty()

        raw_frontmatter: Dict[str, Any] = {}

        try:
            # Extract feature branch: **Feature Branch**: `002-spec-dashboard`
            feature_branch = self._extract_feature_branch(markdown_content)
            if feature_branch:
                raw_frontmatter['feature_branch'] = feature_branch

            # Extract created date: **Created**: 2026-02-13
            created_date = self._extract_created_date(markdown_content)
            if created_date:
                raw_frontmatter['created_date'] = created_date.isoformat()

            # Extract status: **Status**: Draft
            status = self._extract_status(markdown_content)
            if status:
                raw_frontmatter['status'] = status

            return ArtifactMetadata(
                feature_branch=feature_branch,
                created_date=created_date,
                status=status,
                raw_frontmatter=raw_frontmatter
            )

        except Exception as e:
            # Return empty metadata on parse error, don't fail
            print(f"Warning: Failed to parse frontmatter: {e}")
            return ArtifactMetadata.empty()

    def _extract_feature_branch(self, content: str) -> Optional[str]:
        """Extract feature branch from markdown.

        Pattern: **Feature Branch**: `002-spec-dashboard`

        Args:
            content: Markdown content

        Returns:
            Feature branch name or None
        """
        # Look for **Feature Branch**: `value`
        pattern = r'\*\*Feature Branch\*\*:\s*`([^`]+)`'
        match = re.search(pattern, content, re.IGNORECASE)

        if match:
            return match.group(1).strip()

        return None

    def _extract_created_date(self, content: str) -> Optional[datetime]:
        """Extract created date from markdown.

        Pattern: **Created**: 2026-02-13

        Args:
            content: Markdown content

        Returns:
            Parsed datetime or None
        """
        # Look for **Created**: YYYY-MM-DD
        pattern = r'\*\*Created\*\*:\s*(\d{4}-\d{2}-\d{2})'
        match = re.search(pattern, content, re.IGNORECASE)

        if match:
            date_str = match.group(1)
            try:
                return datetime.strptime(date_str, '%Y-%m-%d')
            except ValueError:
                return None

        return None

    def _extract_status(self, content: str) -> Optional[str]:
        """Extract status from markdown.

        Pattern: **Status**: Draft

        Args:
            content: Markdown content

        Returns:
            Status string or None
        """
        # Look for **Status**: Value
        pattern = r'\*\*Status\*\*:\s*(\w[\w\s]*)'
        match = re.search(pattern, content, re.IGNORECASE)

        if match:
            return match.group(1).strip()

        return None
