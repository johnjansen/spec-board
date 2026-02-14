# Feature Specification: Inline Markdown Editor

**Feature Branch**: `005-markdown-editor`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "a markdown editor like lexical in the markdown display panel"

## Clarifications

### Session 2026-02-14

- Q: When the system detects an external modification during an active edit session, what options should the user be given? → A: Show modal with "Reload" (discards edits) and "Keep Editing" (continues with stale version) options
- Q: Should the system implement draft auto-save to localStorage to recover from browser crashes? → A: Auto-save drafts to localStorage every 30 seconds
- Q: How should save errors be presented to the user? → A: Modal dialog with error message and "Retry" button
- Q: Should the system warn users when opening large files for editing, and if so, at what threshold? → A: Warn at 5MB with "File is large, editing may be slow" message and "Edit Anyway" button
- Q: What character encodings should the editor support? → A: UTF-8 only - Show error if file is not UTF-8 encoded

## User Scenarios & Testing

### User Story 1 - Inline Content Editing (Priority: P1) 🎯 MVP

Users viewing spec documents (spec.md, plan.md, tasks.md, etc.) in the markdown display panel can click an "Edit" button to switch to editing mode, make changes directly in the panel, and save their edits without leaving the current view.

**Why this priority**: This is the core value proposition - enabling quick edits to spec documents without needing to open external editors or switch context. Reduces friction in the spec workflow and makes spec-board a more complete authoring tool, not just a viewer.

**Independent Test**: Can be fully tested by opening any markdown file in spec-board, clicking "Edit", modifying text, clicking "Save", and verifying changes persist when viewing the file again. Delivers immediate value as a standalone editing capability.

**Acceptance Scenarios**:

1. **Given** user is viewing spec.md in display panel, **When** user clicks "Edit" button, **Then** panel switches to editable text area with current markdown content
2. **Given** user is in edit mode, **When** user modifies text and clicks "Save", **Then** changes are persisted to file and user sees success confirmation
3. **Given** user is in edit mode with unsaved changes, **When** user clicks "Cancel", **Then** changes are discarded and panel returns to view mode with original content
4. **Given** user has unsaved changes, **When** user attempts to navigate away, **Then** system prompts to save or discard changes before navigating
5. **Given** user saves changes, **When** viewing the same file again, **Then** saved changes are visible in rendered view
6. **Given** user is editing a file with unsaved changes, **When** file is modified externally, **Then** system shows modal with "Reload" and "Keep Editing" options, and selecting "Reload" discards edits while "Keep Editing" preserves current content
7. **Given** user is in edit mode, **When** save operation fails (e.g., disk full, permissions error), **Then** system shows modal dialog with error message and "Retry" button while preserving edited content in editor
8. **Given** user views a markdown file ≥5MB in size, **When** user clicks "Edit" button, **Then** system shows warning dialog "File is large, editing may be slow" with "Edit Anyway" button, and clicking "Edit Anyway" opens editor

---

### User Story 2 - Live Preview Toggle (Priority: P2)

While editing markdown content, users can toggle between "Edit" mode (raw markdown source) and "Preview" mode (rendered HTML) without leaving the editor, allowing them to verify formatting as they write.

**Why this priority**: Enhances the editing experience by providing immediate visual feedback on markdown formatting. Particularly valuable for complex markdown with tables, code blocks, or nested lists. Not essential for MVP but significantly improves usability.

**Independent Test**: Open a file in edit mode, add markdown formatting (headers, lists, code blocks), toggle to preview mode, verify correct rendering, toggle back to edit mode, and continue editing. Can be tested independently of other features.

**Acceptance Scenarios**:

1. **Given** user is in edit mode, **When** user clicks "Preview" button, **Then** panel shows rendered HTML of current markdown content
2. **Given** user is in preview mode, **When** user clicks "Edit" button, **Then** panel switches back to markdown source view
3. **Given** user is in preview mode with unsaved changes, **When** user navigates away, **Then** system still prompts to save changes (preview doesn't bypass save workflow)
4. **Given** user toggles between edit and preview, **When** making changes in edit mode, **Then** preview immediately reflects those changes when toggled

---

### User Story 3 - Keyboard Shortcuts and Formatting Toolbar (Priority: P3)

Users editing markdown can use keyboard shortcuts (Ctrl+B for bold, Ctrl+I for italic, etc.) and a formatting toolbar with common markdown formatting buttons (headers, lists, links, code blocks) to speed up content creation.

**Why this priority**: Nice-to-have convenience features that improve editing speed and reduce need to memorize markdown syntax. Not essential for basic editing but makes the editor feel more polished and professional. Can be added after core editing works.

**Independent Test**: Open editor, use toolbar buttons and keyboard shortcuts to insert formatting, verify correct markdown syntax is inserted. Can be tested independently as pure UI enhancements.

**Acceptance Scenarios**:

1. **Given** user is in edit mode with text selected, **When** user presses Ctrl+B (Cmd+B on Mac), **Then** selected text is wrapped in bold markdown syntax `**text**`
2. **Given** user is in edit mode, **When** user clicks "Heading" button in toolbar, **Then** dropdown shows H1-H6 options and clicking one inserts appropriate markdown heading syntax
3. **Given** user is in edit mode, **When** user presses Ctrl+K (Cmd+K on Mac), **Then** link insertion dialog appears to enter URL and link text
4. **Given** user is in edit mode, **When** user clicks "Code Block" button, **Then** fenced code block markdown (```) is inserted at cursor position

---

### Edge Cases

- **Large files**: System shows warning dialog when opening files ≥5MB: "File is large, editing may be slow" with "Edit Anyway" button to proceed
- **Concurrent edits**: System detects external file modifications and shows modal with "Reload" (discard current edits) or "Keep Editing" (continue with stale version) options
- **Invalid markdown**: How does preview handle broken markdown syntax? (Show rendering with best-effort, don't block saving)
- **Save failure**: System shows blocking modal dialog with error message and "Retry" button, preserving edited content in editor without data loss
- **Browser crash**: System auto-saves draft to localStorage every 30 seconds and automatically restores on next page load
- **Read-only files**: What happens if file permissions prevent writing? (Disable edit button or show error on save attempt)
- **Empty files**: How does editor handle completely empty markdown files? (Show blank editor, allow content creation)
- **Special characters**: System preserves all UTF-8 characters exactly as entered (unicode, emoji, special markdown characters)
- **Non-UTF-8 files**: System shows error message if file cannot be decoded as UTF-8, preventing data corruption from encoding mismatch

## Requirements

### Functional Requirements

- **FR-001**: System MUST display an "Edit" button when viewing any markdown file in the display panel
- **FR-002**: System MUST switch display panel to editable text area when user clicks "Edit" button
- **FR-003**: System MUST preserve exact markdown content including whitespace, formatting, and special characters when loading into editor
- **FR-003a**: System MUST read and write files using UTF-8 encoding, and MUST show error message if file cannot be decoded as UTF-8
- **FR-004**: System MUST provide "Save" and "Cancel" buttons visible while in edit mode
- **FR-005**: System MUST persist changes to the markdown file on disk when user clicks "Save"
- **FR-006**: System MUST discard changes and return to view mode when user clicks "Cancel"
- **FR-007**: System MUST prompt user to save unsaved changes before navigating away from current file
- **FR-008**: System MUST show visual confirmation (success message or indicator) when changes are saved successfully
- **FR-009**: System MUST display blocking modal dialog with error message and "Retry" button if save operation fails, preserving user's edited content in the editor
- **FR-010**: System MUST support editing files up to 10MB in size without performance degradation
- **FR-010a**: System MUST show warning dialog when user attempts to edit files ≥5MB with message "File is large, editing may be slow" and "Edit Anyway" button to proceed
- **FR-011**: System MUST detect when file has been modified externally and show modal dialog with "Reload" (discards current edits and loads external changes) and "Keep Editing" (continues with current content, ignoring external changes) options
- **FR-011a**: System MUST auto-save draft content to browser localStorage every 30 seconds while in edit mode
- **FR-011b**: System MUST automatically restore draft from localStorage when reopening a file that has an unsaved draft
- **FR-011c**: System MUST clear localStorage draft when user successfully saves or explicitly cancels edit session
- **FR-012**: System MUST provide "Preview" toggle button in edit mode (P2 feature)
- **FR-013**: System MUST render current markdown content as HTML when preview mode is active (P2 feature)
- **FR-014**: System MUST support keyboard shortcuts for common formatting operations (P3 feature)
- **FR-015**: System MUST provide formatting toolbar with buttons for headers, lists, links, code blocks (P3 feature)

### Key Entities

- **MarkdownFile**: Represents a markdown file being edited (spec.md, plan.md, tasks.md, etc.)
  - Attributes: file path, current content (in-memory), saved content (on-disk), dirty flag (has unsaved changes)
  - Relationships: Belongs to a Feature (via specs directory structure)

- **EditSession**: Represents an active editing session for a markdown file
  - Attributes: original content (for cancel operation), current content (live edits), timestamp (for conflict detection), file path
  - Lifecycle: Created when "Edit" clicked, destroyed when "Save" or "Cancel" completes

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can switch from view mode to edit mode and back in under 1 second with no page reload
- **SC-002**: Users can save changes to markdown files and see confirmation within 2 seconds of clicking "Save"
- **SC-003**: System handles files up to 10MB without editor lag (typing response time <100ms)
- **SC-004**: 95% of edit sessions complete successfully without data loss or save errors
- **SC-005**: Preview mode renders markdown within 500ms of toggling (for files <1MB)
- **SC-006**: Users can recover from unsaved changes by seeing prompt before navigation 100% of the time
- **SC-007**: System detects external file modifications and prompts user before overwrite 100% of the time

## Out of Scope

The following are explicitly **not** part of this feature:

- **Collaborative editing**: Multi-user real-time editing (Google Docs style) is not included
- **Version control UI**: Git commit/push/pull operations remain command-line only
- **Syntax highlighting**: Code syntax highlighting in edit mode (may be added later)
- **Spell check**: Built-in spell checking or grammar checking
- **Advanced editor features**: Split view, diff view, find/replace, multi-cursor editing
- **File management**: Creating, deleting, or renaming files (only editing existing files)
- **Permissions/access control**: All users who can view can edit (no role-based editing restrictions)
- **Conflict resolution UI**: Merge conflict resolution for concurrent edits (show warning only)

## Assumptions

The following assumptions are made for this specification:

1. **Users trust themselves**: Single-user environment with no authentication required for editing
2. **File system access**: Application has read/write permissions to specs directories
3. **Modern browsers**: Users are on browsers supporting modern JavaScript APIs (localStorage, FileReader)
4. **Text-only editing**: Editor focuses on plain markdown text, not rich WYSIWYG editing with drag-drop images
5. **Auto-save approach**: Manual save with confirmation (not auto-save on every keystroke) to give users control
6. **Standard markdown**: Editor assumes CommonMark or GitHub Flavored Markdown syntax conventions
6a. **UTF-8 encoding**: All markdown files are UTF-8 encoded; non-UTF-8 files will show error message
7. **Local-first**: Files are stored on local filesystem, not in database or remote storage
8. **Single panel**: Editing happens in the existing display panel, not in a separate modal or window
9. **Lexical-like means**: Rich editing experience with good UX, not necessarily using Lexical library itself
10. **Performance target**: Target editing experience suitable for files up to 10MB (typical spec documents)

## Dependencies

- **Existing display panel**: Feature extends the current markdown display panel in spec-board
- **Markdown rendering**: Reuses existing markdown-to-HTML rendering pipeline for preview mode
- **File I/O**: Depends on application's existing file system read/write capabilities
- **Navigation system**: Integrates with existing navigation to detect "navigate away" events for unsaved changes prompt

## Risks

- **Data loss risk**: If save fails without proper error handling, users could lose editing work
- **Performance risk**: Large files (>5MB) could cause editor lag or browser memory issues
- **Concurrency risk**: External file modifications during editing could cause overwrite conflicts
- **Browser compatibility**: Different browsers may have varying performance with large text areas

## Questions for Stakeholders

_None at this time - specification is complete with documented assumptions_
