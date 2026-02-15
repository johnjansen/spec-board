# Implementation Plan: Project Switching

**Branch**: `007-project-switching` | **Date**: 2026-02-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-project-switching/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable users to switch between different spec-kit projects within the Electron desktop application using File > Open Folder menu, Cmd/Ctrl+O keyboard shortcut, and a Recent Projects menu. The implementation extends the existing 006-electron-prototype foundation by adding project validation, IPC handlers for folder selection, preferences management for recent projects, and UI updates to show current project name in the window title.

## Technical Context

**Language/Version**: JavaScript/TypeScript (Electron main/renderer), Python 3.11+ (backend - existing, reused)
**Primary Dependencies**: Electron 28.x (existing from 006), electron-store (existing), Node.js fs/path for validation, Python FastAPI (existing)
**Storage**: File system (specs directories), application preferences (electron-store) for recent projects list
**Testing**: None (prototype exception per constitution - manual validation only)
**Target Platform**: Desktop - macOS 10.13+, Windows 10+, Linux (same as 006-electron-prototype)
**Project Type**: Desktop application (hybrid - Electron wrapper + Python backend)
**Performance Goals**: Project switching in <5 seconds, validation in <1 second, window title update in <500ms
**Constraints**: Must not restart Python server on switch, file watcher must cleanly stop/start, no data loss on switch
**Scale/Scope**: Up to 5 recent projects tracked, supports projects with 1-100+ features

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
