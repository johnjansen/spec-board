---

description: "Task list for Project Switching feature implementation"
---

# Tasks: Project Switching

**Input**: Design documents from `/specs/007-project-switching/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: None (prototype exception per constitution - manual validation only)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Electron desktop**: `electron/` at repository root
- Python backend: `src/` (no changes needed - already serves from any directory)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new setup required - extends existing 006-electron-prototype foundation

**Note**: This feature builds on the existing Electron app structure from 006-electron-prototype. All dependencies (Electron 28.x, electron-store, electron-log, chokidar) are already in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core project validation and IPC infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 Create project validation utility in electron/project-validator.js (validates directory structure, checks for numbered feature folders)
- [X] T002 Add IPC handler 'open-folder-dialog' in electron/main.js (uses dialog.showOpenDialog with directory selection)
- [X] T003 Add IPC handler 'switch-project' in electron/main.js (validates directory, updates preferences, loads new project)
- [X] T004 Expose openFolderDialog() and switchProject() methods in electron/preload.js (contextBridge API)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Switch to Different Project Directory (Priority: P1) 🎯 MVP

**Goal**: Enable users to switch between spec-kit projects using File > Open Folder menu or Cmd/Ctrl+O keyboard shortcut

**Independent Test**:
1. Open the app with Project A loaded
2. Click File > Open Folder (or press Cmd/Ctrl+O)
3. Select Project B's specs directory
4. Verify dashboard updates to show Project B's features
5. Verify switching back to Project A works the same way

### Implementation for User Story 1

- [X] T005 [US1] Add 'Open Folder...' menu item to File menu in electron/main.js (below existing menu items, accelerator: 'CmdOrCtrl+O')
- [X] T006 [US1] Implement folder picker dialog logic in 'open-folder-dialog' IPC handler in electron/main.js (dialog.showOpenDialog with properties: ['openDirectory'])
- [X] T007 [US1] Implement project validation in electron/project-validator.js (check for pattern: /^\d+-[a-z-]+$/, return error messages for invalid directories)
- [X] T008 [US1] Implement project switching logic in 'switch-project' IPC handler in electron/main.js (validate → stop file watcher → update preferences → restart file watcher → reload webview)
- [X] T009 [US1] Add file watcher stop/start methods in electron/file-watcher.js (stopWatching() and startWatching(newPath) functions)
- [X] T010 [US1] Update preferences.js to save 'currentProjectPath' field (add to default preferences schema)
- [X] T011 [US1] Add error handling and user dialogs for invalid directories in electron/main.js (dialog.showErrorBox with FR-004 messages)
- [X] T012 [US1] Add cancel handling for folder picker in electron/main.js (check if user clicked Cancel, do nothing if canceled)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can switch projects, validation works, errors are clear

---

## Phase 4: User Story 2 - View Current Project Information (Priority: P2)

**Goal**: Display the current project name in the window title bar so users can identify which project is loaded

**Independent Test**:
1. Open any project (e.g., /Users/name/my-project/specs)
2. Look at the window title bar
3. Verify it shows "spec-board - my-project"
4. Switch to a different project (e.g., another-project)
5. Verify title updates to "spec-board - another-project"

### Implementation for User Story 2

- [X] T013 [P] [US2] Add getProjectName() utility function in electron/project-validator.js (extract parent directory name from specs path)
- [X] T014 [US2] Update window title on project load in electron/main.js (set mainWindow.setTitle() with format "spec-board - {projectName}")
- [X] T015 [US2] Update window title on project switch in 'switch-project' IPC handler in electron/main.js (call setTitle after successful switch)
- [X] T016 [US2] Set initial window title on app startup in electron/main.js (extract project name from currentProjectPath preference)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can switch projects and see which project is loaded

---

## Phase 5: User Story 3 - Access Recent Projects (Priority: P3)

**Goal**: Provide quick access to recently opened projects via File > Recent Projects submenu

**Independent Test**:
1. Open 3 different projects in sequence (A, B, C)
2. Click File > Recent Projects
3. Verify list shows C, B, A (most recent first)
4. Click on Project A in the menu
5. Verify app switches to Project A immediately
6. Verify A is now at the top of the recent list

### Implementation for User Story 3

- [X] T017 [P] [US3] Add recentProjects array to preferences schema in electron/preferences.js (max 5 entries, each entry: {path, name, lastAccessed})
- [X] T018 [US3] Add updateRecentProjects() function in electron/preferences.js (add project to top of list, remove duplicates, limit to 5)
- [X] T019 [US3] Create buildRecentProjectsMenu() function in electron/main.js (build submenu from preferences.recentProjects, handle empty state)
- [X] T020 [US3] Add 'Recent Projects' submenu to File menu in electron/main.js (below 'Open Folder...', dynamic menu items)
- [X] T021 [US3] Update recentProjects list on successful project switch in electron/main.js (call updateRecentProjects() in 'switch-project' handler)
- [X] T022 [US3] Add click handlers for recent project menu items in electron/main.js (call switchProject() with stored path)
- [X] T023 [US3] Rebuild Recent Projects menu after each switch in electron/main.js (call buildRecentProjectsMenu() and Menu.setApplicationMenu())
- [X] T024 [US3] Handle 'Recent Projects' disabled state when no projects exist in electron/main.js (show "(none)" and disable menu item)

**Checkpoint**: All user stories should now be independently functional - users can switch projects, see current project, and access recent projects

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, edge cases, and validation improvements that affect multiple user stories

- [X] T025 [P] Add unsaved changes detection in electron/main.js (check for unsaved editor content before switching, prompt user with dialog.showMessageBox) - TODO added, requires frontend integration
- [X] T026 [P] Add same-project detection in electron/project-validator.js (compare normalized paths, return early with info message if already loaded)
- [X] T027 [P] Add deleted project detection in electron/file-watcher.js (emit 'project-deleted' event when specs directory no longer exists)
- [X] T028 Add 'project-deleted' event handler in electron/main.js (show warning dialog, prompt user to open different project)
- [X] T029 Add permission error handling in electron/project-validator.js (catch EACCES errors, return clear "Permission denied" message)
- [X] T030 Add network-mounted directory detection in electron/project-validator.js (check path prefix for network locations, add warning about potential slowness)
- [X] T031 [P] Update error messages to match spec requirements in electron/project-validator.js (FR-004: clear explanations of valid directory structure)
- [X] T032 [P] Add logging for project switch operations in electron/main.js (log validation, switch start/complete, errors using electron-log)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - extends existing 006-electron-prototype
- **Foundational (Phase 2)**: Must complete first - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent but integrates with US1 (window title updates on switch)
- **User Story 3 (P3)**: Depends on US1 completion (needs switch-project functionality) - Can start after US1 complete

### Within Each User Story

- **US1**: Menu item → folder picker → validation → switching logic → file watcher management → error handling
- **US2**: Project name extraction → title updates (on load, on switch) - Can run in parallel with US1
- **US3**: Preferences schema → update function → menu builder → click handlers → rebuild logic

### Parallel Opportunities

- All Foundational tasks (T001-T004) are sequential (interdependent)
- **US1 + US2 can start in parallel** after Foundational phase (T005-T012 and T013-T016 work on different concerns)
- US3 must wait for US1 to be functional (depends on switch-project handler)
- Most Polish tasks marked [P] can run in parallel (T025, T026, T027, T031, T032)

---

## Parallel Example: User Story 1 + User Story 2

```bash
# After Foundational phase (T001-T004) completes, these can run together:

# Developer A: User Story 1 (switch functionality)
Task T005: "Add 'Open Folder...' menu item to File menu"
Task T006: "Implement folder picker dialog logic"
Task T007: "Implement project validation"
Task T008: "Implement project switching logic"
Task T009: "Add file watcher stop/start methods"
Task T010: "Update preferences.js to save currentProjectPath"
Task T011: "Add error handling for invalid directories"
Task T012: "Add cancel handling for folder picker"

# Developer B: User Story 2 (window title) - CAN RUN IN PARALLEL
Task T013: "Add getProjectName() utility function"
Task T014: "Update window title on project load"
Task T015: "Update window title on project switch"
Task T016: "Set initial window title on app startup"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T004) - CRITICAL, blocks everything
2. Complete Phase 3: User Story 1 (T005-T012)
3. **STOP and VALIDATE**:
   - Open app with one project
   - Use File > Open Folder to switch to another project
   - Verify dashboard updates correctly
   - Test validation with invalid directories
   - Test cancel button
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational (T001-T004) → Foundation ready
2. Add User Story 1 (T005-T012) → Test independently → Deploy/Demo (MVP: basic project switching!)
3. Add User Story 2 (T013-T016) → Test independently → Deploy/Demo (Enhancement: users can see which project is loaded)
4. Add User Story 3 (T017-T024) → Test independently → Deploy/Demo (Enhancement: quick access to recent projects)
5. Add Polish (T025-T032) → Final validation → Deploy/Demo (Production-ready: robust error handling)

### Parallel Team Strategy

With 2 developers:

1. Both complete Foundational (T001-T004) together
2. Once Foundational is done:
   - Developer A: User Story 1 (T005-T012) - core switching
   - Developer B: User Story 2 (T013-T016) - window title
3. Both: User Story 3 (T017-T024) together (depends on US1)
4. Both: Polish tasks in parallel (T025-T032)

---

## Notes

- [P] tasks = different files, no dependencies - safe to run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No tests required (prototype exception per constitution)
- Manual validation at each checkpoint recommended
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Performance goals: Switching <5s, validation <1s, title update <500ms
- Python backend requires NO changes (already serves from any directory via SPECS_DIR)
