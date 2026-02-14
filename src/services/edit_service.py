"""Edit service for file read/write operations for markdown editing."""

from pathlib import Path
from typing import Dict, Any

from ..models.markdown_file import MarkdownFile


class EditService:
    """Service for loading and saving markdown files during editing sessions.

    Provides high-level operations for the edit API endpoints, including
    validation and metadata preparation.
    """

    def __init__(self, specs_root: Path):
        """Initialize edit service.

        Args:
            specs_root: Root directory containing specs/ subdirectories
        """
        self.specs_root = specs_root.resolve()

    def load_for_editing(self, filepath: Path) -> Dict[str, Any]:
        """Load markdown file for editing with metadata.

        Args:
            filepath: Absolute path to markdown file

        Returns:
            Dictionary with:
                - success: bool
                - filepath: str (absolute path)
                - content: str
                - mtime: float
                - size_bytes: int
                - encoding: str
                - warning: str (optional, if file is large)
                - error: str (optional, if load failed)

        Raises:
            ValueError: If filepath is outside specs/ directory
        """
        filepath = filepath.resolve()

        # Security: Validate path is within specs/
        if not self._is_within_specs(filepath):
            raise ValueError(
                f"Access denied: File must be within specs/ directory. "
                f"Got: {filepath}"
            )

        try:
            markdown_file = MarkdownFile.load(filepath)

            response: Dict[str, Any] = {
                "success": True,
                "filepath": str(markdown_file.filepath),
                "content": markdown_file.content,
                "mtime": markdown_file.mtime,
                "size_bytes": markdown_file.size_bytes,
                "encoding": markdown_file.encoding
            }

            # Large file warning (FR-010a): Warn if >= 5MB
            if markdown_file.size_bytes >= 5 * 1024 * 1024:
                size_mb = markdown_file.size_bytes / (1024 * 1024)
                response["warning"] = (
                    f"large_file: File is {size_mb:.1f}MB. "
                    "Editing may be slow."
                )

            return response

        except FileNotFoundError as e:
            return {
                "success": False,
                "error": f"File not found: {filepath}"
            }
        except UnicodeDecodeError as e:
            return {
                "success": False,
                "error": "File is not UTF-8 encoded. Cannot edit."
            }
        except ValueError as e:
            return {
                "success": False,
                "error": str(e)
            }

    def save_from_editor(
        self,
        filepath: Path,
        content: str,
        original_mtime: float
    ) -> Dict[str, Any]:
        """Save edited markdown content with conflict detection.

        Args:
            filepath: Absolute path to markdown file
            content: Updated markdown content
            original_mtime: File mtime when editing started

        Returns:
            Dictionary with:
                - success: bool
                - mtime: float (new mtime after save)
                - size_bytes: int (new size after save)
                - conflict: bool (optional, if conflict detected)
                - error: str (optional, if save failed)

        Raises:
            ValueError: If filepath is outside specs/ directory
        """
        filepath = filepath.resolve()

        # Security: Validate path is within specs/
        if not self._is_within_specs(filepath):
            raise ValueError(
                f"Access denied: File must be within specs/ directory. "
                f"Got: {filepath}"
            )

        try:
            # Load current file for conflict check
            markdown_file = MarkdownFile.load(filepath)

            # Conflict detection (FR-011)
            if markdown_file.check_modified(original_mtime):
                return {
                    "success": False,
                    "conflict": True,
                    "current_mtime": markdown_file.mtime,
                    "message": (
                        "File was modified externally. "
                        "Choose 'Reload' to discard your changes, "
                        "or 'Keep Editing' to overwrite."
                    )
                }

            # Save content
            markdown_file.save(content)

            return {
                "success": True,
                "mtime": markdown_file.mtime,
                "size_bytes": markdown_file.size_bytes
            }

        except FileNotFoundError:
            return {
                "success": False,
                "error": f"File not found: {filepath}"
            }
        except UnicodeEncodeError:
            return {
                "success": False,
                "error": "Content contains invalid UTF-8 characters. Cannot save."
            }
        except OSError as e:
            return {
                "success": False,
                "error": f"Failed to save file: {e}",
                "retryable": True
            }

    def _is_within_specs(self, filepath: Path) -> bool:
        """Check if filepath is within specs/ directory.

        Args:
            filepath: Path to check (should be resolved/absolute)

        Returns:
            True if filepath is within specs/ directory
        """
        try:
            # Check if the filepath is relative to specs_root
            filepath.relative_to(self.specs_root)
            return True
        except ValueError:
            # filepath is not relative to specs_root
            return False
