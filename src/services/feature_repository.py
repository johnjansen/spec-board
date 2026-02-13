"""Feature repository for CRUD operations on features."""

from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from ..models.feature import Feature
from ..models.artifact import Artifact, ArtifactType
from ..models.artifact_metadata import ArtifactMetadata
from .file_system_reader import FileSystemReader
from .artifact_parser import ArtifactParser
from .task_board_parser import TaskBoardParser


class FeatureRepository:
    """Repository for feature CRUD operations.

    Provides high-level operations for loading and accessing features
    with their artifacts. Coordinates FileSystemReader and ArtifactParser.
    """

    def __init__(self, specs_dir: Path):
        """Initialize feature repository.

        Args:
            specs_dir: Absolute path to specs/ directory
        """
        self.specs_dir = specs_dir
        self.fs_reader = FileSystemReader(specs_dir)
        self.artifact_parser = ArtifactParser()
        self.task_board_parser = TaskBoardParser()

    def list_all(self) -> List[Feature]:
        """List all features in the specs/ directory.

        Scans directory and creates Feature objects with basic artifact
        info (existence, size) but doesn't load content.

        Returns:
            List of Feature objects, sorted by feature number
        """
        feature_names = self.fs_reader.list_features()
        features: List[Feature] = []

        for name in feature_names:
            try:
                feature = self._load_feature_basic(name)
                features.append(feature)
            except Exception as e:
                # Log error but continue with other features
                print(f"Warning: Failed to load feature {name}: {e}")
                continue

        return features

    def get_feature(self, feature_name: str) -> Optional[Feature]:
        """Get a single feature by name.

        Loads feature with artifact metadata but doesn't load full content.

        Args:
            feature_name: Feature directory name (e.g., "002-spec-dashboard")

        Returns:
            Feature object or None if not found
        """
        feature_path = self.fs_reader.get_feature_path(feature_name)

        if not feature_path.exists():
            return None

        try:
            return self._load_feature_basic(feature_name)
        except Exception as e:
            print(f"Error loading feature {feature_name}: {e}")
            return None

    def _load_feature_basic(self, feature_name: str) -> Feature:
        """Load feature with basic artifact info (no content).

        Args:
            feature_name: Feature directory name

        Returns:
            Feature object with artifacts dict

        Raises:
            ValueError: If feature name format is invalid
        """
        # Parse feature name: "002-spec-dashboard"
        parts = feature_name.split('-', 1)
        if len(parts) != 2:
            raise ValueError(f"Invalid feature name format: {feature_name}")

        number, short_name = parts
        feature_path = self.fs_reader.get_feature_path(feature_name)

        # Create artifacts dict
        artifacts: Dict[str, Artifact] = {}

        for artifact_type in ["spec", "plan", "tasks"]:
            artifact = self._create_artifact(feature_path, artifact_type)
            artifacts[artifact_type] = artifact

        # Extract metadata from spec.md if it exists
        created_date = None
        status = None

        if artifacts["spec"].exists:
            try:
                artifacts["spec"].load_content()
                metadata = self.artifact_parser.parse_frontmatter(
                    artifacts["spec"].content_raw
                )
                created_date = metadata.created_date
                status = metadata.status
                artifacts["spec"].metadata = metadata
            except Exception as e:
                print(f"Warning: Failed to parse metadata for {feature_name}: {e}")

        # Calculate completion percentage and task counts from tasks.md if it exists
        completion_percentage = None
        total_tasks = 0
        completed_tasks = 0

        if artifacts["tasks"].exists:
            try:
                tasks_path = artifacts["tasks"].path
                completion_percentage, total_tasks, completed_tasks = (
                    self.task_board_parser.calculate_completion_percentage(tasks_path)
                )
            except Exception as e:
                # Graceful error handling - no user-visible errors
                print(f"Warning: Failed to calculate completion for {feature_name}: {e}")
                completion_percentage = None
                total_tasks = 0
                completed_tasks = 0

        return Feature(
            number=number,
            short_name=short_name,
            full_name=feature_name,
            path=feature_path,
            artifacts=artifacts,
            created_date=created_date,
            status=status,
            completion_percentage=completion_percentage,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks
        )

    def _create_artifact(self, feature_path: Path, artifact_type: str) -> Artifact:
        """Create artifact object for a feature.

        Args:
            feature_path: Path to feature directory
            artifact_type: One of "spec", "plan", "tasks"

        Returns:
            Artifact object (may not exist yet)
        """
        artifact_path = feature_path / f"{artifact_type}.md"
        exists = artifact_path.exists()
        size_bytes = artifact_path.stat().st_size if exists else 0

        return Artifact(
            type=ArtifactType(artifact_type),
            path=artifact_path,
            exists=exists,
            size_bytes=size_bytes,
            metadata=ArtifactMetadata.empty()
        )
