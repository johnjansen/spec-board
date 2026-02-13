<!--
Sync Impact Report:
Version: [template] → 1.0.0
Change Type: Initial Constitution Creation
Modified Principles:
  - NEW: I. Modern Python Tooling
  - NEW: II. Minimal Simplicity (Prototype)
  - NEW: III. One Class Per File
  - NEW: IV. No Tests (Prototype Exception)
Added Sections:
  - Technology Stack
  - Development Workflow
Removed Sections: None
Templates Status:
  ✅ plan-template.md - reviewed, no changes needed (generic gates)
  ✅ spec-template.md - reviewed, aligned with prototype focus
  ✅ tasks-template.md - reviewed, supports no-test workflow
Follow-up TODOs: None
-->

# spec-board Constitution

## Core Principles

### I. Modern Python Tooling

**MUST** use modern Python development tooling:
- Python 3.11+ for language features
- `uv` for package management and project initialization
- Virtual environment (venv) for dependency isolation
- Type hints on all function signatures and class attributes
- Follow PEP 8 style guidelines

**Rationale**: Modern tooling provides faster dependency resolution, better reproducibility, and improved developer experience. Type hints enable better IDE support and catch errors earlier.

### II. Minimal Simplicity (Prototype)

**MUST** maintain prototype-appropriate scope:
- Start simple and only add complexity when explicitly needed
- YAGNI principle: You Aren't Gonna Need It - no speculative features
- No abstractions until pattern appears 3+ times
- No frameworks or libraries unless they solve an immediate need
- Direct, straightforward implementations preferred over "clever" code
- Document WHY decisions were made, not WHAT the code does

**Rationale**: As a prototype, the goal is rapid iteration and validation. Premature optimization, abstraction, and over-engineering slow down learning and waste effort on features that may not survive validation.

### III. One Class Per File

**MUST** organize code with single-class file structure:
- Each Python file contains exactly one class definition
- File name matches class name in snake_case (e.g., `user_manager.py` → `class UserManager`)
- Related utility functions may exist in separate `utils/` modules
- Exceptions: Small data classes (<10 lines) may be grouped in `models.py`

**Rationale**: Single-class-per-file enforces clear boundaries, simplifies navigation, and prevents files from becoming dumping grounds. Makes it immediately obvious where to find specific functionality.

### IV. No Tests (Prototype Exception)

**MUST NOT** write tests during prototype phase:
- No unit tests, integration tests, or contract tests required
- Focus on manual validation and rapid iteration
- Document validation steps in code comments if non-obvious
- When transitioning from prototype to production, this principle MUST be revisited

**Rationale**: For prototypes, the cost of writing and maintaining tests outweighs the benefit. Requirements change rapidly, and code may be discarded. Manual validation is sufficient for proving concepts. This is a deliberate trade-off documented here for future reference.

## Technology Stack

**Language**: Python 3.11+
**Package Manager**: uv (https://github.com/astral-sh/uv)
**Environment**: venv (virtual environment)
**Type System**: Python type hints (typing module)
**Style**: PEP 8 compliant
**CLI Framework**: (if needed) typer or argparse
**Project Type**: Single project structure

**Project Structure**:
```
spec-board/
├── src/              # Source code (one class per file)
│   ├── __init__.py
│   ├── models/       # Data models
│   └── services/     # Business logic
├── .venv/            # Virtual environment (not committed)
├── pyproject.toml    # uv project configuration
└── README.md         # Project documentation
```

## Development Workflow

### Environment Setup
1. Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`
2. Create project: `uv init spec-board` (if not exists)
3. Activate venv: `source .venv/bin/activate`
4. Add dependencies: `uv add <package>`

### Code Changes
1. Create feature branch from main
2. Implement changes following principles above
3. Manual validation of functionality
4. Commit with clear message describing WHAT changed and WHY
5. Create PR with context for reviewers

### File Creation
- New class? Create new file in appropriate directory
- Name file after class: `UserManager` → `user_manager.py`
- Include type hints on all public methods
- Add docstring to class describing purpose

## Governance

This constitution supersedes all other practices and preferences. Every code change MUST align with these principles.

**Amendments**:
- Constitution changes require explicit approval and version bump
- Breaking changes (removing/redefining principles) = MAJOR version
- New principles or sections = MINOR version
- Clarifications and fixes = PATCH version

**Compliance**:
- All PRs must verify adherence to constitution principles
- Complexity violations require justification in plan.md Complexity Tracking table
- When in doubt, default to simpler solution

**Prototype Status**:
- This constitution is optimized for PROTOTYPE phase
- Before production deployment, principles III (No Tests) and II (Minimal Simplicity) MUST be re-evaluated
- Version 2.x should introduce testing requirements and production-readiness standards

**Version**: 1.0.0 | **Ratified**: 2026-02-13 | **Last Amended**: 2026-02-13
