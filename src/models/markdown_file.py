"""MarkdownFile model for editing markdown files with conflict detection."""

from dataclasses import dataclass
from pathlib import Path
from typing import ClassVar


@dataclass
class MarkdownFile:
    """Represents a markdown file with editing metadata.

    Attributes:
        filepath: Absolute path to markdown file in specs/ directory
        content: UTF-8 decoded file content
        size_bytes: File size in bytes
        mtime: Last modification timestamp (seconds since epoch)
        encoding: Character encoding (always 'utf-8')
    """

    filepath: Path
    content: str
    size_bytes: int
    mtime: float  # From pathlib.Path.stat().st_mtime
    encoding: str = 'utf-8'

    MAX_FILE_SIZE: ClassVar[int] = 10 * 1024 * 1024  # 10MB limit per FR-010

    @classmethod
    def load(cls, filepath: Path) -> 'MarkdownFile':
        """Load markdown file from filesystem.

        Args:
            filepath: Absolute path to markdown file

        Returns:
            MarkdownFile instance

        Raises:
            FileNotFoundError: If file doesn't exist
            UnicodeDecodeError: If file is not UTF-8 encoded (per FR-003a)
            ValueError: If file size > 10MB (per FR-010)
        """
        if not filepath.exists():
            raise FileNotFoundError(f"File not found: {filepath}")

        # Get file stats
        stat = filepath.stat()
        size_bytes = stat.st_size
        mtime = stat.st_mtime

        # Validate file size
        if size_bytes > cls.MAX_FILE_SIZE:
            raise ValueError(
                f"File size ({size_bytes} bytes) exceeds maximum "
                f"{cls.MAX_FILE_SIZE} bytes (10MB)"
            )

        # Load content with UTF-8 validation
        try:
            content = filepath.read_text(encoding='utf-8')
        except UnicodeDecodeError as e:
            raise UnicodeDecodeError(
                e.encoding,
                e.object,
                e.start,
                e.end,
                f"File is not UTF-8 encoded: {e.reason}"
            )

        return cls(
            filepath=filepath,
            content=content,
            size_bytes=size_bytes,
            mtime=mtime,
            encoding='utf-8'
        )

    def save(self, content: str) -> None:
        """Save content to file, updating mtime.

        Args:
            content: UTF-8 content to write

        Raises:
            UnicodeEncodeError: If content contains non-UTF-8 characters
            OSError: If file cannot be written (permissions, disk full)
        """
        try:
            # Atomic write pattern: write to temp file, then rename
            temp_path = self.filepath.with_suffix('.tmp')
            temp_path.write_text(content, encoding='utf-8')
            temp_path.replace(self.filepath)  # Atomic on POSIX systems
        except UnicodeEncodeError as e:
            # Clean up temp file if it exists
            if temp_path.exists():
                temp_path.unlink()
            raise UnicodeEncodeError(
                e.encoding,
                e.object,
                e.start,
                e.end,
                f"Content contains non-UTF-8 characters: {e.reason}"
            )
        except OSError as e:
            # Clean up temp file if it exists
            if temp_path.exists():
                temp_path.unlink()
            raise OSError(f"Failed to save file: {e}")

        # Update instance properties after successful write
        stat = self.filepath.stat()
        self.content = content
        self.mtime = stat.st_mtime
        self.size_bytes = stat.st_size

    def check_modified(self, original_mtime: float) -> bool:
        """Check if file was modified externally since original_mtime.

        Args:
            original_mtime: Timestamp from when editing started

        Returns:
            True if file was modified externally (conflict detected)
        """
        current_mtime = self.filepath.stat().st_mtime
        return current_mtime != original_mtime
