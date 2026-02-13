"""File system reader service for scanning specs/ directory."""

from pathlib import Path
from typing import List
import re


class FileSystemReader:
    """Reads and scans the specs/ directory for feature folders.

    Scans the file system on-demand (no caching) to find all feature
    directories matching the ###-feature-name pattern.
    """

    def __init__(self, specs_dir: Path):
        """Initialize file system reader.

        Args:
            specs_dir: Absolute path to specs/ directory
        """
        self.specs_dir = specs_dir

    def list_features(self) -> List[str]:
        """Scan specs/ directory for feature folders.

        Returns list of feature directory names (e.g., "001-ram-cli-tool",
        "002-spec-dashboard") sorted by numeric prefix.

        Returns:
            List of feature directory names, sorted by number

        Raises:
            FileNotFoundError: If specs_dir doesn't exist
            PermissionError: If specs_dir can't be read
        """
        if not self.specs_dir.exists():
            return []

        if not self.specs_dir.is_dir():
            raise ValueError(f"Specs path is not a directory: {self.specs_dir}")

        features: List[str] = []

        try:
            for item in self.specs_dir.iterdir():
                # Check if directory and matches ###-name pattern
                if item.is_dir() and self._is_feature_directory(item.name):
                    features.append(item.name)
        except PermissionError as e:
            raise PermissionError(f"Cannot read specs directory: {self.specs_dir}") from e

        # Sort by numeric prefix
        return sorted(features, key=self._extract_feature_number)

    def get_feature_path(self, feature_name: str) -> Path:
        """Get absolute path to a feature directory.

        Args:
            feature_name: Feature directory name (e.g., "002-spec-dashboard")

        Returns:
            Absolute path to feature directory
        """
        return self.specs_dir / feature_name

    def artifact_exists(self, feature_name: str, artifact_type: str) -> bool:
        """Check if an artifact file exists for a feature.

        Args:
            feature_name: Feature directory name
            artifact_type: One of "spec", "plan", "tasks"

        Returns:
            True if artifact file exists, False otherwise
        """
        artifact_path = self.specs_dir / feature_name / f"{artifact_type}.md"
        return artifact_path.exists()

    @staticmethod
    def _is_feature_directory(name: str) -> bool:
        """Check if directory name matches feature pattern.

        Feature pattern: ###-feature-name where ### is numeric.

        Args:
            name: Directory name to check

        Returns:
            True if matches feature pattern, False otherwise
        """
        # Match ###-something where ### is 1+ digits
        pattern = r'^\d+-[\w-]+$'
        return bool(re.match(pattern, name))

    @staticmethod
    def _extract_feature_number(feature_name: str) -> int:
        """Extract numeric prefix from feature name for sorting.

        Args:
            feature_name: Feature name like "002-spec-dashboard"

        Returns:
            Numeric prefix as integer
        """
        match = re.match(r'^(\d+)', feature_name)
        if match:
            return int(match.group(1))
        return 0
