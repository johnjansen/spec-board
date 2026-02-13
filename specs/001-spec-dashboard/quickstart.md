# Quickstart: Spec-Kit Visualization Dashboard

**Feature**: 002-spec-dashboard
**Date**: 2026-02-13
**Purpose**: Setup and running instructions

## Prerequisites

Before starting, ensure you have:

- **Python 3.11+** installed (`python3 --version`)
- **uv** package manager installed
- **Git** repository initialized
- **specs/** directory with at least one feature

### Install uv (if not already installed)

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or via pip
pip install uv

# Verify installation
uv --version
```

---

## Initial Setup

### Step 1: Initialize Python Project

```bash
# From repository root (where spec-board/ is)
cd spec-board

# Initialize uv project (if not already done)
uv init

# This creates pyproject.toml and .python-version
```

### Step 2: Add Dependencies

```bash
# Add all required dependencies
uv add fastapi jinja2 markdown pygments "uvicorn[standard]"

# Add development dependencies (optional)
uv add --dev ruff

# Verify dependencies installed
uv pip list
```

Expected output:
```
fastapi       0.109.0
jinja2        3.1.2
markdown      3.5.0
pygments      2.17.0
uvicorn       0.27.0
```

### Step 3: Create Project Structure

```bash
# Create source directories
mkdir -p src/models
mkdir -p src/services
mkdir -p src/web
mkdir -p src/templates/components
mkdir -p src/templates/partials
mkdir -p static

# Create __init__.py files
touch src/__init__.py
touch src/models/__init__.py
touch src/services/__init__.py
touch src/web/__init__.py

# Verify structure
tree src/
```

Expected structure:
```
src/
├── __init__.py
├── models/
│   └── __init__.py
├── services/
│   └── __init__.py
├── web/
│   └── __init__.py
└── templates/
    ├── components/
    └── partials/
```

---

## Running the Dashboard

### Option 1: Development Server (Recommended)

```bash
# From repository root
uv run uvicorn src.web.app:app --reload

# Or with specific host/port
uv run uvicorn src.web.app:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Access dashboard:**
- Open browser to `http://localhost:8000`
- Should see 4-column Miller columns interface
- Features should auto-load in Column 2

### Option 2: Without Auto-Reload

```bash
# Faster startup, no file watching
uv run uvicorn src.web.app:app
```

### Option 3: Production Mode (Future)

```bash
# With gunicorn (not needed for prototype)
uv run gunicorn src.web.app:app -w 4 -k uvicorn.workers.UvicornWorker
```

---

## Verifying Installation

### Test 1: Health Check

```bash
# Check server is running
curl http://localhost:8000/

# Should return HTML with "Spec-Board Dashboard" title
```

### Test 2: Features Endpoint

```bash
# Check features endpoint
curl http://localhost:8000/features

# Should return HTML list of features
# Example: <div class="feature-item">002-spec-dashboard</div>
```

### Test 3: Browser Test

1. Open `http://localhost:8000` in browser
2. Verify Column 1 shows "Project" header
3. Verify Column 2 auto-loads with features
4. Click a feature → Column 3 shows artifacts
5. Click "spec.md" → Column 4 renders markdown

---

## Common Issues & Solutions

### Issue: "Module not found: src.web.app"

**Cause**: Python can't find the src module

**Solution**:
```bash
# Ensure you're in the repository root
pwd  # Should show .../spec-board

# Verify src/ directory exists
ls -la src/

# Run with python path
PYTHONPATH=. uv run uvicorn src.web.app:app --reload
```

### Issue: "No features found"

**Cause**: specs/ directory doesn't exist or is empty

**Solution**:
```bash
# Check specs directory
ls -la specs/

# Should show feature directories like 001-ram-cli-tool, 002-spec-dashboard
# If missing, create a test feature:
mkdir -p specs/001-test
echo "# Test Feature" > specs/001-test/spec.md
```

### Issue: Port 8000 already in use

**Cause**: Another process using port 8000

**Solution**:
```bash
# Option 1: Kill existing process
lsof -ti:8000 | xargs kill -9

# Option 2: Use different port
uv run uvicorn src.web.app:app --port 8001
```

### Issue: Markdown not rendering

**Cause**: Missing markdown or pygments dependency

**Solution**:
```bash
# Reinstall dependencies
uv add markdown pygments

# Verify in Python
uv run python -c "import markdown; print(markdown.__version__)"
```

### Issue: HTMX not working

**Cause**: CDN blocked or JavaScript disabled

**Solution**:
```bash
# Check browser console for errors
# Verify HTMX script tag in HTML:
curl http://localhost:8000/ | grep htmx

# Should see: <script src="https://unpkg.com/htmx.org@1.9.10"></script>
```

---

## Development Workflow

### 1. Start Development Session

```bash
# Terminal 1: Run server with auto-reload
uv run uvicorn src.web.app:app --reload

# Terminal 2: Watch logs
tail -f logs/app.log  # If logging implemented

# Browser: Open http://localhost:8000
```

### 2. Making Changes

**Code Changes** (auto-reload enabled):
1. Edit file in `src/`
2. Save file
3. Uvicorn automatically reloads
4. Refresh browser (or HTMX auto-updates)

**Template Changes**:
1. Edit file in `src/templates/`
2. Save file
3. Refresh browser (no server reload needed)

**CSS Changes**:
1. Edit `static/styles.css`
2. Save file
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)

### 3. Manual Validation Checklist

After making changes, test:

- [ ] Homepage loads: `http://localhost:8000`
- [ ] Features list appears in Column 2
- [ ] Clicking feature loads artifacts in Column 3
- [ ] Clicking artifact renders markdown in Column 4
- [ ] All markdown formatting correct (headings, lists, code blocks, tables)
- [ ] Error handling works (try non-existent feature)
- [ ] No console errors in browser DevTools

---

## Project Configuration

### pyproject.toml

Minimal configuration for prototype:

```toml
[project]
name = "spec-board"
version = "0.1.0"
description = "Dashboard for visualizing spec-kit artifacts"
requires-python = ">=3.11"

dependencies = [
    "fastapi>=0.109.0",
    "jinja2>=3.1.2",
    "markdown>=3.5.0",
    "pygments>=2.17.0",
    "uvicorn[standard]>=0.27.0",
]

[project.optional-dependencies]
dev = [
    "ruff>=0.1.0",
]

[tool.ruff]
line-length = 100
target-version = "py311"
```

### Environment Variables (Optional)

```bash
# Create .env file (not committed)
cat > .env << EOF
SPECS_DIR=/path/to/specs
DEBUG=true
LOG_LEVEL=info
EOF

# Load in app
uv add python-dotenv
```

### .gitignore

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
.venv/
*.so

# uv
.python-version

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log
```

---

## Next Steps

After successful setup:

1. **Implement Core Models** (`src/models/`):
   - [ ] `project.py`
   - [ ] `feature.py`
   - [ ] `artifact.py`
   - [ ] `artifact_metadata.py`

2. **Implement Services** (`src/services/`):
   - [ ] `file_system_reader.py`
   - [ ] `markdown_renderer.py`
   - [ ] `feature_repository.py`
   - [ ] `artifact_parser.py`

3. **Implement Web Layer** (`src/web/`):
   - [ ] `app.py` (FastAPI app)
   - [ ] `routes.py` (endpoint handlers)
   - [ ] `dependencies.py` (DI)

4. **Create Templates** (`src/templates/`):
   - [ ] `base.html`
   - [ ] `dashboard.html`
   - [ ] `components/column_features.html`
   - [ ] `components/column_artifacts.html`
   - [ ] `components/column_content.html`

5. **Manual Testing**:
   - [ ] Follow "Verifying Installation" steps above
   - [ ] Test all user stories from spec.md
   - [ ] Validate edge cases (empty dirs, missing files, malformed markdown)

---

## Performance Tuning (Future)

Not needed for prototype, but for reference:

```bash
# Multiple workers
uv run uvicorn src.web.app:app --workers 4

# Increase timeout for large files
uv run uvicorn src.web.app:app --timeout-keep-alive 30

# Enable access logs
uv run uvicorn src.web.app:app --access-log
```

---

## Stopping the Server

```bash
# In terminal running uvicorn
Ctrl+C

# Or kill by port
lsof -ti:8000 | xargs kill
```

---

## Troubleshooting Commands

```bash
# Check Python version
python3 --version  # Should be 3.11+

# Check uv version
uv --version

# List installed packages
uv pip list

# Check if port is in use
lsof -i:8000

# Test FastAPI import
uv run python -c "import fastapi; print(fastapi.__version__)"

# Test Jinja2 import
uv run python -c "import jinja2; print(jinja2.__version__)"

# Check file structure
tree src/ static/

# Verify specs directory
ls -la specs/
```

---

## Additional Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **HTMX Docs**: https://htmx.org/docs
- **Jinja2 Docs**: https://jinja.palletsprojects.com
- **Python Markdown**: https://python-markdown.github.io
- **Tailwind CSS**: https://tailwindcss.com/docs
- **uv Docs**: https://github.com/astral-sh/uv

---

## Quick Reference

### Common Commands

```bash
# Start server
uv run uvicorn src.web.app:app --reload

# Add dependency
uv add <package-name>

# Format code (if ruff installed)
uv run ruff format src/

# Check code (if ruff installed)
uv run ruff check src/

# Update dependencies
uv sync
```

### File Locations

- **Source code**: `src/`
- **Templates**: `src/templates/`
- **Static files**: `static/`
- **Specs directory**: `specs/` (at repo root or configurable)
- **Config**: `pyproject.toml`
- **Virtual env**: `.venv/`

### URLs

- **Dashboard**: `http://localhost:8000/`
- **Features API**: `http://localhost:8000/features`
- **Artifacts API**: `http://localhost:8000/features/{id}/artifacts`
- **Content API**: `http://localhost:8000/artifacts/{id}/{type}`
- **Docs** (FastAPI): `http://localhost:8000/docs` (auto-generated)
