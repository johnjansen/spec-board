"""Markdown rendering service using python-markdown."""

import markdown
import re
from typing import TYPE_CHECKING

from .task_board_parser import TaskBoardParser

if TYPE_CHECKING:
    from ..models.artifact import Artifact


class MarkdownRenderer:
    """Renders markdown content to HTML using python-markdown.

    Supports full markdown features including tables, code blocks,
    syntax highlighting, and table of contents.
    """

    def __init__(self):
        """Initialize markdown renderer with extensions."""
        self.extensions = [
            'markdown.extensions.fenced_code',  # ```python blocks
            'markdown.extensions.tables',       # GFM tables
            'markdown.extensions.toc',          # Table of contents
            'markdown.extensions.nl2br',        # Newline to <br>
            'markdown.extensions.codehilite',   # Syntax highlighting
            'markdown.extensions.extra',        # Additional features
        ]

        self.extension_configs = {
            'codehilite': {
                'css_class': 'highlight',
                'linenums': False,
            }
        }

    def render(self, artifact: 'Artifact') -> str:
        """Render artifact markdown content to HTML.

        Loads content if not already loaded, then renders to HTML with
        all markdown extensions enabled.

        Args:
            artifact: Artifact to render

        Returns:
            Rendered HTML string

        Raises:
            FileNotFoundError: If artifact file doesn't exist
            ValueError: If markdown rendering fails
        """
        # Load content if not already loaded
        if artifact.content_raw is None:
            artifact.load_content()

        # T070: Performance optimization for large markdown files
        content_size = len(artifact.content_raw)
        max_size = 1_048_576  # 1MB in bytes

        if content_size > max_size:
            # For very large files, show a warning and truncate
            warning = f"""
<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
    <p class="text-sm font-semibold text-yellow-800">Large File Warning</p>
    <p class="text-xs text-yellow-600 mt-1">
        This file is {content_size / 1_048_576:.2f}MB.
        Content has been truncated to the first 1MB for performance.
    </p>
</div>
"""
            truncated_content = artifact.content_raw[:max_size]
            truncated_content += "\n\n... (content truncated)"
        else:
            warning = ""
            truncated_content = artifact.content_raw

        try:
            html = markdown.markdown(
                truncated_content,
                extensions=self.extensions,
                extension_configs=self.extension_configs
            )

            # T051-T054: Apply tasks.md specific post-processing
            if artifact.type.value == 'tasks':
                html = self._post_process_tasks(html)

            # Prepend warning if file was truncated
            if warning:
                html = warning + html

            # Cache rendered HTML in artifact
            artifact.content_html = html

            return html

        except Exception as e:
            raise ValueError(f"Failed to render markdown: {e}") from e

    def render_text(self, markdown_text: str) -> str:
        """Render raw markdown text to HTML.

        Useful for rendering markdown strings that aren't from artifacts.

        Args:
            markdown_text: Raw markdown content

        Returns:
            Rendered HTML string

        Raises:
            ValueError: If markdown rendering fails
        """
        try:
            return markdown.markdown(
                markdown_text,
                extensions=self.extensions,
                extension_configs=self.extension_configs
            )
        except Exception as e:
            raise ValueError(f"Failed to render markdown: {e}") from e

    def render_board_view(self, artifact: 'Artifact', feature_id: str):
        """Render tasks.md artifact as a Kanban board view.

        Parses tasks.md content using TaskBoardParser and returns
        a Board object for template rendering.

        Args:
            artifact: Artifact to render (must be tasks.md)
            feature_id: Feature identifier for the board

        Returns:
            Board object with phases and tasks

        Raises:
            FileNotFoundError: If artifact file doesn't exist
            ValueError: If artifact is not a tasks.md file
        """
        # Validate artifact type
        if artifact.type.value != 'tasks':
            raise ValueError(f"Board view only supports tasks.md files, got {artifact.type.value}")

        # Load content if not already loaded
        if artifact.content_raw is None:
            artifact.load_content()

        # Parse tasks.md into board structure
        parser = TaskBoardParser()
        board = parser.parse(artifact.content_raw, feature_id)

        return board

    def _post_process_tasks(self, html: str) -> str:
        """Post-process tasks.md HTML for enhanced visual styling.

        Wraps task IDs, story labels, and parallel markers in spans
        with appropriate CSS classes for styling.

        Args:
            html: Rendered HTML from markdown

        Returns:
            Enhanced HTML with task-specific markup
        """
        # T052: Wrap task IDs (T001, T002, etc.) in spans
        html = re.sub(
            r'\b(T\d{3})\b',
            r'<span class="task-id">\1</span>',
            html
        )

        # T053: Wrap story labels ([US1], [US2], etc.) in spans with story-specific classes
        html = re.sub(
            r'\[US(\d+)\]',
            r'<span class="story-label story-\1">[US\1]</span>',
            html
        )

        # T054: Wrap parallel markers [P] in spans
        html = re.sub(
            r'\[P\]',
            r'<span class="parallel-marker">[P]</span>',
            html
        )

        # T055: Add task completion counter at the top
        # Count completed and total tasks
        total_tasks = len(re.findall(r'<input[^>]*type="checkbox"[^>]*>', html))
        completed_tasks = len(re.findall(r'<input[^>]*type="checkbox"[^>]*checked[^>]*>', html))

        if total_tasks > 0:
            completion_percentage = int((completed_tasks / total_tasks) * 100)
            counter_html = f'''
<div class="task-completion-summary">
    <div class="completion-bar-container">
        <div class="completion-bar" style="width: {completion_percentage}%"></div>
    </div>
    <div class="completion-text">
        <strong>{completed_tasks} of {total_tasks} tasks completed</strong>
        <span class="completion-percentage">({completion_percentage}%)</span>
    </div>
</div>
'''
            # Insert counter after the first h1 or at the beginning
            if '<h1>' in html:
                html = html.replace('</h1>', f'</h1>{counter_html}', 1)
            else:
                html = counter_html + html

        return html
