# Tasks: Inline Markdown Editor

**Input**: Design documents from `/specs/005-markdown-editor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Manual validation per constitution (prototype phase - no automated tests)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure and prepare for editing feature

**Status**: Ready to start

- [X] T001 Verify FastAPI 0.109+ installed and working in src/web/app.py
- [X] T002 Verify Jinja2 3.1+ templates rendering in src/templates/
- [X] T003 Verify HTMX and Tailwind CSS accessible via CDN in existing templates
- [X] T004 Verify markdown display panel exists in src/templates/components/column_content.html

**Checkpoint**: Existing spec-board infrastructure confirmed ready for edit feature

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend infrastructure that ALL user stories depend on

**Status**: Depends on Phase 1

### Backend Models

- [X] T005 [P] Create MarkdownFile model in src/models/markdown_file.py with filepath, content, size_bytes, mtime, encoding properties per data-model.md
- [X] T006 [P] Add type hints to MarkdownFile: Path, str, int, float, str per data-model.md
- [X] T007 [P] Implement MarkdownFile.load() classmethod with UTF-8 validation, size check (10MB limit), mtime capture per FR-003a and FR-010
- [X] T008 [P] Implement MarkdownFile.save() method with UTF-8 encoding and mtime update per data-model.md
- [X] T009 [P] Implement MarkdownFile.check_modified() method comparing mtime for conflict detection per FR-011

### Backend Services

- [X] T010 [P] Create EditService in src/services/edit_service.py with load_for_editing() and save_from_editor() methods per contracts/api-load.md and contracts/api-save.md
- [X] T011 [P] Implement FileConflictDetector in src/services/file_conflict_detector.py with detect_external_modification() method using mtime comparison per research.md Decision 2
- [X] T012 [P] Add type hints to EditService and FileConflictDetector per constitution principle I

### API Endpoints

- [X] T013 Create GET /api/edit/load endpoint in src/web/routes.py per contracts/api-load.md
- [X] T014 Implement load endpoint: validate filepath, check file within specs/, call MarkdownFile.load(), return content + metadata per contracts/api-load.md
- [X] T015 Add large file warning (≥5MB) in load endpoint response per FR-010a and Q4 clarification
- [X] T016 Create POST /api/edit/save endpoint in src/web/routes.py per contracts/api-save.md
- [X] T017 Implement save endpoint: validate filepath, check conflict via mtime, call MarkdownFile.save(), return new mtime per contracts/api-save.md
- [X] T018 Add conflict detection (409 response) in save endpoint per FR-011 and contracts/api-save.md

**Checkpoint**: Backend models, services, and API endpoints functional and ready for frontend integration

---

## Phase 3: User Story 1 - Inline Content Editing (Priority: P1) 🎯 MVP

**Goal**: Enable users to edit markdown files directly in browser with save/cancel, conflict detection, auto-save, and error handling

**Independent Test**: Open spec.md, click "Edit", modify content, click "Save", verify changes persist. Test conflict detection by modifying file externally. Test auto-save by closing browser and reopening.

### Frontend Editor Component

- [X] T019 [P] [US1] Create markdown_editor.html template in src/templates/components/ with textarea, Save button, Cancel button per plan.md structure
- [X] T020 [P] [US1] Style editor textarea with Tailwind CSS: monospace font, full width, min-height, resize per research.md Decision 1
- [X] T021 [P] [US1] Add Save and Cancel buttons with Tailwind styling per FR-004

### Edit Button Integration

- [X] T022 [US1] Add "Edit" button to column_content.html template per FR-001
- [X] T023 [US1] Implement HTMX attributes on "Edit" button with route to /artifacts/{feature_id}/{artifact_type}/edit
- [ ] T024 [US1] Test Edit button switches to editor (<1 second per SC-001)

### Frontend JavaScript - Core Editing

- [X] T025 [P] [US1] Create editor.js in static/js/ with startEditSession(), endEditSession(), getEditorContent() functions per data-model.md EditSession
- [X] T026 [P] [US1] Implement startEditSession(): store filepath, originalContent, originalMtime, initialize isDirty flag per data-model.md
- [X] T027 [P] [US1] Add textarea event listener for input events to set isDirty=true on user edits
- [X] T028 [US1] Implement Save button click handler: call /api/edit/save endpoint with filepath, content, originalMtime per contracts/api-save.md
- [X] T029 [US1] Handle save success: show confirmation message (FR-008), clear draft, call endEditSession(), return to view mode
- [X] T030 [US1] Implement Cancel button click handler: check isDirty, show discard prompt if dirty (FR-006), call endEditSession()

### Auto-Save to localStorage

- [X] T031 [P] [US1] Create autosave.js in static/js/ with autoSaveDraft(), restoreDraftIfExists(), clearDraft() functions per research.md Decision 3
- [X] T032 [P] [US1] Implement autoSaveDraft(): save JSON {content, timestamp, originalMtime, filepath} to localStorage with key "draft:${btoa(filepath)}" per data-model.md EditDraft
- [X] T033 [US1] Start auto-save timer (30-second interval) in startEditSession() per FR-011a and Q2 clarification
- [X] T034 [US1] Implement restoreDraftIfExists(): check localStorage on page load, compare originalMtime, show "Resume draft?" prompt if valid per FR-011b
- [X] T035 [US1] Clear draft on successful save or cancel per FR-011c
- [X] T036 [US1] Handle QuotaExceededError: disable auto-save, warn user per research.md

### Modal Dialogs

- [X] T037 [P] [US1] Create edit-modals.js (JavaScript-based modals, no separate HTML partial needed)
- [X] T038 [P] [US1] Style modals with Tailwind CSS: fixed overlay, centered card, buttons per research.md Decision 4
- [X] T039 [P] [US1] Create edit-modals.js in static/js/ with showConflictModal(), showErrorModal(), showLargeFileWarning() functions
- [X] T040 [US1] Implement showConflictModal(): display modal with "Reload" and "Keep Editing" buttons, return user choice per FR-011 and Q1 clarification
- [X] T041 [US1] Implement showErrorModal(): display modal with error message and "Retry" button per FR-009 and Q3 clarification
- [X] T042 [US1] Implement showLargeFileWarning(): display modal with size info and "Edit Anyway" button per FR-010a and Q4 clarification

### Conflict Detection Integration

- [X] T043 [US1] Handle 409 Conflict response in save handler: call showConflictModal(), process user choice (reload or keep editing) per contracts/api-save.md
- [X] T044 [US1] Implement "Reload" action: discard edits, reload file content, clear draft, return to view mode
- [X] T045 [US1] Implement "Keep Editing" action: stay in editor with current content (user can retry save to overwrite) per Q1 clarification

### Error Handling

- [X] T046 [US1] Handle save error (500) response: call showErrorModal(), allow retry, preserve content per FR-009 and Q3 clarification
- [X] T047 [US1] Handle load error (400 UTF-8) response: show error modal "File encoding not supported" per FR-003a and Q5 clarification
- [X] T048 [US1] Handle load error (400 size) response: show error modal "File too large to edit" per FR-010

### Navigate Away Protection

- [X] T049 [US1] Add beforeunload event listener: check isDirty, show browser native "Unsaved changes" prompt if dirty per FR-007
- [ ] T050 [US1] Test navigate away prompt appears 100% of the time with unsaved changes per SC-006

**Checkpoint**: User Story 1 complete - users can edit, save, cancel, with conflict detection, auto-save, and error handling. Test all 8 acceptance scenarios from spec.md.

---

## Phase 4: User Story 2 - Live Preview Toggle (Priority: P2)

**Goal**: Allow users to toggle between Edit mode (markdown source) and Preview mode (rendered HTML)

**Independent Test**: Open editor, add markdown formatting (headers, lists, code), toggle to preview, verify rendering, toggle back to edit, continue editing.

### Preview Toggle UI

- [X] T051 [P] [US2] Add "Preview" button to markdown_editor.html template per FR-012
- [X] T052 [P] [US2] Style Preview button with Tailwind CSS, positioned near Save/Cancel buttons

### Preview Rendering

- [X] T053 [US2] Create preview container div in markdown_editor.html for rendered HTML output
- [X] T054 [US2] Implement togglePreview() function in editor.js: hide textarea, show preview div, or vice versa per data-model.md state transitions
- [X] T055 [US2] Render markdown to HTML via POST /api/edit/preview endpoint using existing markdown_renderer service
- [X] T056 [US2] Display rendered HTML in preview container with same styling as normal view mode
- [ ] T057 [US2] Verify preview renders within 500ms for <1MB files per SC-005

### Toggle State Management

- [X] T058 [US2] Update "Preview" button to show "Edit" when in preview mode (button label toggles)
- [X] T059 [US2] Maintain isDirty flag across toggle: preview mode doesn't reset unsaved changes flag
- [ ] T060 [US2] Test unsaved changes prompt still works when navigating away from preview mode per acceptance scenario 3

**Checkpoint**: User Story 2 complete - users can toggle preview to verify markdown formatting. Test all 4 acceptance scenarios from spec.md US2.

---

## Phase 5: User Story 3 - Keyboard Shortcuts and Formatting Toolbar (Priority: P3)

**Goal**: Provide keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K) and toolbar with formatting buttons for faster content creation

**Independent Test**: Open editor, select text, press Ctrl+B, verify bold syntax inserted. Click toolbar buttons, verify formatting inserted.

### Keyboard Shortcuts

- [X] T061 [P] [US3] Create keyboard-shortcuts.js in static/js/ with handleKeydown() function and shortcut map
- [X] T062 [P] [US3] Implement Ctrl/Cmd+B shortcut: wrap selected text in `**text**` (bold markdown) per acceptance scenario 1
- [X] T063 [P] [US3] Implement Ctrl/Cmd+I shortcut: wrap selected text in `*text*` (italic markdown)
- [X] T064 [P] [US3] Implement Ctrl/Cmd+K shortcut: show link dialog or insert `[text](url)` syntax per acceptance scenario 3
- [X] T065 [US3] Add keydown event listener to textarea via initKeyboardShortcuts(), call handleKeydown() per FR-014
- [X] T066 [US3] Handle Cmd key on Mac vs Ctrl key on Windows/Linux in shortcut detection

### Formatting Toolbar

- [X] T067 [P] [US3] Create formatting toolbar HTML in markdown_editor.html with buttons: Heading, Bold, Italic, Link, List, Code Block per FR-015
- [X] T068 [P] [US3] Style toolbar with Tailwind CSS: horizontal button group, icons or text labels, positioned above textarea
- [X] T069 [P] [US3] Create toolbar-handlers.js in static/js/ with insertBold(), insertItalic(), insertHeading(), insertLink(), insertList(), insertCodeBlock() functions
- [X] T070 [US3] Implement insertBold(): wrap selection in `**text**` or insert `****` at cursor
- [X] T071 [US3] Implement insertItalic(): wrap selection in `*text*` or insert `**` at cursor
- [X] T072 [US3] Implement insertHeading(): show H1-H6 dropdown, insert `# ` to `###### ` at line start per acceptance scenario 2
- [X] T073 [US3] Implement insertLink(): show dialog with URL + text inputs, insert `[text](url)` syntax
- [X] T074 [US3] Implement insertList(): insert `- ` at line start for unordered list, or `1. ` for ordered list
- [X] T075 [US3] Implement insertCodeBlock(): insert triple backticks (\`\`\`) on new lines per acceptance scenario 4
- [X] T076 [US3] Wire toolbar button clicks to handler functions
- [ ] T077 [US3] Test all toolbar buttons insert correct markdown syntax

**Checkpoint**: User Story 3 complete - users have keyboard shortcuts and toolbar for faster editing. Test all 4 acceptance scenarios from spec.md US3.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, documentation, and refinements

- [ ] T078 [P] Run manual validation scenario 1 from quickstart.md: Basic edit and save workflow
- [ ] T079 [P] Run manual validation scenario 2 from quickstart.md: Cancel discard changes
- [ ] T080 [P] Run manual validation scenario 3 from quickstart.md: External file modification conflict detection
- [ ] T081 [P] Run manual validation scenario 4 from quickstart.md: Browser crash recovery auto-save
- [ ] T082 [P] Run manual validation scenario 5 from quickstart.md: Large file warning (≥5MB)
- [ ] T083 [P] Run manual validation scenario 6 from quickstart.md: Save error with retry
- [ ] T084 [P] Run manual validation scenario 7 from quickstart.md: UTF-8 encoding validation
- [ ] T085 [P] Run manual validation scenario 8 from quickstart.md: Navigate away prompt
- [ ] T086 [P] Run manual validation scenario 9 from quickstart.md: Live preview toggle (US2)
- [ ] T087 [P] Run manual validation scenario 10 from quickstart.md: Keyboard shortcuts (US3)
- [ ] T088 [P] Run manual validation scenario 11 from quickstart.md: Formatting toolbar (US3)
- [X] T089 [P] Update README.md with markdown editor feature: how to use, Edit button, Save/Cancel, Preview mode, keyboard shortcuts
- [X] T090 [P] Add editor feature to main dashboard documentation explaining inline editing capability
- [X] T091 Code review: Verify all new Python code has type hints per constitution principle I
- [X] T092 Code review: Verify PEP 8 compliance in all new Python files
- [X] T093 Code review: Verify one class per file principle followed (markdown_file.py, edit_service.py, file_conflict_detector.py)
- [X] T094 Code review: Verify no automated tests created per constitution principle IV
- [X] T095 Code review: Verify graceful error handling for all edge cases (large files, non-UTF-8, conflicts, disk full)

**Checkpoint**: All user stories validated, documentation updated, code review complete. Feature ready for integration.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verify existing infrastructure
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - create backend foundation
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - core MVP editing
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) - extends editor with preview
- **User Story 3 (Phase 5)**: Depends on User Story 1 (Phase 3) - extends editor with shortcuts/toolbar
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - can start after Phase 2
- **User Story 2 (P2)**: Depends on US1 (needs editor component) - cannot start until US1 complete
- **User Story 3 (P3)**: Depends on US1 (needs editor component) - cannot start until US1 complete

**Note**: US2 and US3 can be developed in parallel after US1 completes (both extend the editor independently)

### Within Each User Story

**US1 (Phase 3)**: Internal dependencies
1. T019-T021: Editor HTML (parallel) → Ready for JS integration
2. T022-T024: Edit button integration → Triggers editor load
3. T025-T027, T031-T036: Core JS + Auto-save (parallel) → Independent modules
4. T037-T042: Modals (parallel) → Reusable UI components
5. T028-T030, T043-T048: Save/Cancel/Error handling → Requires modals complete
6. T049-T050: Navigate away protection → Final integration

**US2 (Phase 4)**: Internal dependencies
1. T051-T052: Preview UI (parallel) → HTML changes
2. T053-T057: Preview rendering (sequential) → Core functionality
3. T058-T060: State management → Integration testing

**US3 (Phase 5)**: Internal dependencies
1. T061-T066: Shortcuts (parallel) → Independent JS module
2. T067-T068: Toolbar UI (parallel) → HTML changes
3. T069-T075: Toolbar handlers (parallel) → Independent functions
4. T076-T077: Integration → Wire everything together

### Parallel Opportunities

- **Phase 2**: T005-T009 (MarkdownFile), T010-T012 (Services) can run in parallel (different files)
- **Phase 3**: T019-T021 (HTML), T025-T027 (Core JS), T031-T036 (Auto-save), T037-T042 (Modals) can run in parallel
- **Phase 4**: T051-T052 (UI) parallel with T061-T066 (if US3 started)
- **Phase 5**: T061-T066 (Shortcuts), T067-T068 (Toolbar UI), T069-T075 (Handlers) can run in parallel
- **Phase 6**: T078-T088 (Validation), T089-T090 (Docs), T091-T095 (Review) can run in parallel

---

## Parallel Example: User Story 1 Core Implementation

```bash
# Launch parallel tasks for backend foundation:
Task T005-T009: "Create and implement MarkdownFile model" (parallel)
Task T010-T012: "Create and implement EditService and FileConflictDetector" (parallel)

# Wait for backend complete, then parallel frontend:
Task T019-T021: "Create editor HTML template" (parallel)
Task T025-T027: "Implement core editor.js" (parallel)
Task T031-T036: "Implement autosave.js" (parallel)
Task T037-T042: "Create and implement modals" (parallel)

# Then sequential integration:
Task T028-T030: "Implement Save/Cancel handlers" (depends on modals)
Task T043-T048: "Implement conflict and error handling" (depends on modals)
Task T049-T050: "Add navigate away protection" (final integration)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. ✅ Setup + Foundational complete (Phase 1 + Phase 2)
2. Complete Phase 3 (US1): T019-T050
3. **STOP and VALIDATE**: Test using quickstart.md Scenarios 1-8
4. Verify core editing works: edit, save, cancel, conflicts, auto-save, errors
5. **Deploy/demo if ready** - core value delivered!

### Incremental Delivery

1. ✅ Foundation ready (Phase 1 + Phase 2)
2. Add User Story 1 (T019-T050) → Test scenarios 1-8 → **MVP deployed!**
3. Add User Story 2 (T051-T060) → Test scenarios 9 → **Enhanced with preview**
4. Add User Story 3 (T061-T077) → Test scenarios 10-11 → **Polished with shortcuts/toolbar**
5. Polish (T078-T095) → Final validation → **Production ready**

### Sequential Solo Strategy

For single developer:

1. Complete Phase 1 (T001-T004) - verify infrastructure
2. Complete Phase 2 (T005-T018) - backend foundation
3. Complete US1 (T019-T050) - MVP editing
4. Validate US1 with quickstart.md scenarios 1-8
5. Complete US2 (T051-T060) - preview toggle
6. Validate US2 with quickstart.md scenario 9
7. Complete US3 (T061-T077) - shortcuts and toolbar
8. Validate US3 with quickstart.md scenarios 10-11
9. Polish (T078-T095) - final validation and docs

---

## Notes

- **No tests**: Manual validation per constitution principle IV (prototype phase)
- **Type hints**: Required on all new Python functions per constitution principle I
- **PEP 8**: All code must be PEP 8 compliant
- **One class per file**: backend models and services each in separate file per constitution principle III
- **Error handling**: Graceful degradation - show user-friendly errors, never lose content
- **Performance**: <1s mode switch, <2s save, <100ms typing, <500ms preview per success criteria
- **Auto-save interval**: 30 seconds (Q2 clarification)
- **Conflict resolution**: "Reload" or "Keep Editing" modal (Q1 clarification)
- **Large file threshold**: 5MB warning, 10MB maximum (Q4 clarification)
- **Encoding**: UTF-8 only (Q5 clarification)
- **Error pattern**: Modal dialog with "Retry" (Q3 clarification)
- **Editor approach**: Plain textarea, no external library (research.md Decision 1)
- Each user story delivers independent value and can be deployed separately
- US1 is the MVP - provides core editing functionality
- US2 and US3 are enhancements that can be skipped if time-constrained
- Extends existing spec-board web app (no new projects)

---

## Task Summary by Phase

- **Phase 1 (Setup)**: 4 tasks - verify infrastructure
- **Phase 2 (Foundational)**: 14 tasks - backend models, services, API endpoints
- **Phase 3 (User Story 1 - Inline Editing MVP)**: 32 tasks - frontend editor, save/cancel, conflicts, auto-save, errors
- **Phase 4 (User Story 2 - Preview Toggle)**: 10 tasks - preview mode rendering and toggle
- **Phase 5 (User Story 3 - Shortcuts/Toolbar)**: 17 tasks - keyboard shortcuts and formatting toolbar
- **Phase 6 (Polish)**: 18 tasks - manual validation, documentation, code review
- **Total**: 95 tasks

## Parallel Opportunities Summary

- **Phase 2**: 8 parallel tasks (models + services)
- **Phase 3**: 15 parallel tasks (HTML, core JS, auto-save, modals)
- **Phase 5**: 12 parallel tasks (shortcuts, toolbar UI, handlers)
- **Phase 6**: 18 parallel tasks (validation scenarios, docs, reviews)

**Maximum parallelization**: 15 concurrent tasks (during Phase 3 frontend development)

---

## Test Validation Tasks (Manual)

These tasks use quickstart.md scenarios to validate the feature:

- **US1 Validation**: T078-T085 (scenarios 1-8) - Core editing workflow
- **US2 Validation**: T086 (scenario 9) - Preview toggle
- **US3 Validation**: T087-T088 (scenarios 10-11) - Shortcuts and toolbar

All validation is manual per constitution principle IV (no automated tests).
