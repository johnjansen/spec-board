"""File conflict detector for external modification detection."""

from pathlib import Path
from typing import Dict, Any


class FileConflictDetector:
    """Detects external modifications to files during edit sessions.

    Uses timestamp comparison (mtime) to detect if a file has been modified
    externally while a user is editing it. This is primarily for the optional
    /api/edit/check-modified endpoint (P2 enhancement).
    """

    @staticmethod
    def detect_external_modification(
        filepath: Path,
        original_mtime: float
    ) -> Dict[str, Any]:
        """Check if file was modified externally since original_mtime.

        Args:
            filepath: Absolute path to file to check
            original_mtime: Timestamp from when editing started

        Returns:
            Dictionary with:
                - modified: bool (True if file changed externally)
                - current_mtime: float (current file mtime)
                - error: str (optional, if check failed)

        Note:
            This method uses mtime comparison per research.md Decision 2.
            For single-user environment, timestamp comparison is reliable
            and efficient (single stat() syscall, <1ms overhead).
        """
        try:
            current_stat = filepath.stat()
            current_mtime = current_stat.st_mtime

            # Compare timestamps - any difference indicates modification
            modified = (current_mtime != original_mtime)

            return {
                "modified": modified,
                "current_mtime": current_mtime
            }

        except FileNotFoundError:
            return {
                "modified": True,  # File was deleted externally
                "error": f"File not found: {filepath}"
            }
        except OSError as e:
            return {
                "modified": False,  # Unknown state, default to no conflict
                "error": f"Failed to check file: {e}"
            }
