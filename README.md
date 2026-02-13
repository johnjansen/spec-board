# Spec-Board Dashboard

A web-based visualization dashboard for [spec-kit](https://github.com/anthropics/spec-kit) artifacts. Browse and view your feature specifications, implementation plans, and task breakdowns with an intuitive Miller columns interface.

## ⚡ Quick Start - Run Without Installing

```bash
uvx --from git+https://github.com/johnjansen/spec-board spec-board
```

Then open http://localhost:8000 in your browser. That's it! No installation, no setup required.

## Features

- 🗂️ **3-Column Interface** - Clean Miller columns-style navigation: features → artifacts → content
- 📝 **Rich Markdown Rendering** - Full support for tables, code blocks, syntax highlighting, and more
- ✅ **Task Progress Tracking** - Visual progress bars and completion counters for task lists
- 📊 **Kanban Board View** - Visualize tasks.md as a board with phase columns and task cards
- 🎯 **Phase Indicators** - Automatic current/next phase highlighting for progress tracking
- 🎨 **Syntax Highlighting** - Beautiful code syntax highlighting with multiple themes
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- ⚡ **Fast Navigation** - HTMX-powered partial updates without page reloads
- 📁 **Project-Local Specs** - Each project has its own specs directory

## Quick Start

### Run Without Installing (Recommended)

Use `uvx` to run directly from GitHub without cloning or installing:

```bash
uvx --from git+https://github.com/johnjansen/spec-board spec-board
```

The dashboard will start automatically at http://localhost:8000

**Custom port:**
```bash
uvx --from git+https://github.com/johnjansen/spec-board spec-board --port 8080
```

### Run from Local Clone

1. Clone the repository:
   ```bash
   git clone https://github.com/johnjansen/spec-board.git
   cd spec-board
   ```

2. Run with uvx (no installation needed):
   ```bash
   uvx .
   ```

3. Or install and run with uv:
   ```bash
   uv sync
   uv run spec-board
   ```

4. Or run the development server with hot reload:
   ```bash
   uv run uvicorn src.web.app:app --reload
   ```

5. Open your browser:
   ```
   http://localhost:8000
   ```

### Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) package manager (includes uvx)

## Project Structure

```text
spec-board/
├── src/
│   ├── models/              # Data models (Project, Feature, Artifact)
│   ├── services/            # Business logic (file reading, markdown rendering)
│   ├── web/                 # FastAPI app and routes
│   └── templates/           # Jinja2 HTML templates
├── static/                  # CSS and static assets
├── pyproject.toml          # Project dependencies
└── README.md               # This file
```

## Usage

### Viewing Features

The dashboard automatically loads all features from your `specs/` directory. Features are displayed in the first column with:
- Feature number and name
- Status badge (Draft, Planning, In Progress, Complete)
- Creation date
- Artifact indicators (spec/plan/tasks)

### Browsing Artifacts

Click a feature to see its artifacts (spec.md, plan.md, tasks.md) in the second column. Click any artifact to view its rendered markdown content in the third column.

### Board View (Kanban Visualization)

When viewing a `tasks.md` file, you can switch between **List View** and **Board View**:

#### List View (Default)
- Traditional markdown rendering with checkboxes
- Task IDs, story labels, and parallel markers highlighted
- Progress bar showing overall completion
- Best for detailed reading and editing tasks

#### Board View
- Kanban-style visualization with phase columns
- Each phase shows:
  - Phase name and number
  - Progress bar (X/Y tasks, percentage)
  - Completion status badge
- Task cards display:
  - Task ID (e.g., T001)
  - Checkbox status (✓ or ○)
  - Description (truncated to 3 lines)
  - Story labels (US1, US2, etc.)
  - Parallel markers ([P])
- **Current Phase** badge on first incomplete phase
- **Next Up** badge on the next upcoming phase
- Horizontal scrolling for many phases (10+)
- Board footer with overall statistics

#### Toggling Views
1. Click **📊 Board View** button (when viewing tasks.md in list mode)
2. Click **📋 List View** button (when viewing board)
3. Views toggle instantly without page reload (HTMX)

#### Board View Features
- **Read-only visualization** - Board view is for progress tracking, not editing
- **Phase-based organization** - Tasks grouped by implementation phases
- **Visual progress indicators** - See at a glance what's complete, in progress, and upcoming
- **Multi-dimensional tracking** - Track feature lifecycle (spec→plan→tasks), phase progress, and individual task status
- **Responsive design** - Adapts to desktop, tablet, and mobile screens

### Navigation

- **Breadcrumb** - Click the feature name in the breadcrumb to return to the artifact list
- **Navigation Buttons** - Use Spec/Plan/Tasks buttons to quickly switch between artifacts
- **Artifact List** - Click artifacts in Column 2 to view their content

## Configuration

### Specs Directory

The dashboard reads from the project-local `specs/` directory. Each project should have its own specs directory within its repository:

```
spec-board/
├── specs/                  ← Project-specific specs
│   └── 001-spec-dashboard/
├── src/
└── ...
```

The `SPECS_DIR` is automatically configured to use the project's local specs directory.

### Port Configuration

To run on a different port:

```bash
uv run uvicorn src.web.app:app --reload --port 8080
```

## Development

### Project Constitution

This project follows a minimal prototype approach:
- ✅ Python 3.11+ with uv and type hints
- ✅ One class per file
- ✅ Minimal complexity and simplicity
- ✅ No tests (prototype exception)

### Tech Stack

- **Backend**: FastAPI (Python 3.11+)
- **Templating**: Jinja2
- **Frontend**: HTMX + Tailwind CSS (via CDN)
- **Markdown**: python-markdown with extensions
- **Server**: Uvicorn

### Adding Features

1. Create a new feature spec with `/speckit.specify`
2. Generate implementation plan with `/speckit.plan`
3. Generate tasks with `/speckit.tasks`
4. The dashboard will automatically display your new feature

## Architecture

### 3-Column Layout

- **Column 1**: Features list (auto-loaded via HTMX)
- **Column 2**: Artifacts for selected feature (spec/plan/tasks)
- **Column 3**: Rendered markdown content

### Markdown Processing

1. File system reads specs directory structure
2. Feature repository loads feature metadata
3. Markdown renderer converts content to HTML with extensions
4. Jinja2 templates display rendered content with Tailwind styling

## Troubleshooting

### Features not loading

- Check that `SPECS_DIR` points to your specs directory
- Ensure feature directories follow the pattern: `NNN-feature-name`
- Verify file permissions allow reading the specs directory

### Markdown not rendering

- Check that artifact files exist (spec.md, plan.md, tasks.md)
- Verify files have proper UTF-8 encoding
- Look for syntax errors in the markdown content

### Port already in use

```bash
# Use a different port
uv run uvicorn src.web.app:app --reload --port 8080
```

## License

This project is part of the spec-kit tooling ecosystem.

## Contributing

This is a prototype project. For issues or suggestions, please open an issue in the repository.

---

**Built with** ❤️ **using spec-kit and Claude Code**
