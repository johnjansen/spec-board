# Feature Specification: Project Switching

**Feature Branch**: `007-project-switching`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "the electron app should be able to open a different directory and show the specs for that"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch to Different Project Directory (Priority: P1)

Users need to switch between multiple spec-kit projects without closing and reopening the application. They want to use File > Open Folder or a keyboard shortcut to select a different specs directory and immediately see that project's features in the dashboard.

**Why this priority**: This is the core functionality that enables multi-project workflows. Without it, users must restart the app every time they want to work on a different project, which is tedious and disrupts their workflow.

**Independent Test**: Can be fully tested by opening the app with one project loaded, selecting File > Open Folder (or pressing Cmd/Ctrl+O), choosing a different specs directory, and verifying the dashboard updates to show the new project's features. Delivers immediate value by enabling seamless project switching.

**Acceptance Scenarios**:

1. **Given** the application is running with Project A loaded, **When** user selects File > Open Folder and chooses Project B's specs directory, **Then** the dashboard updates to display Project B's features
2. **Given** the application is running, **When** user presses Cmd/Ctrl+O keyboard shortcut, **Then** a native folder picker dialog appears
3. **Given** the folder picker dialog is open, **When** user selects a valid specs directory and clicks Open, **Then** the application validates the directory and loads the new project
4. **Given** the folder picker dialog is open, **When** user clicks Cancel or presses Escape, **Then** the dialog closes and the current project remains loaded

---

### User Story 2 - View Current Project Information (Priority: P2)

Users need to see which project is currently loaded to avoid confusion when working with multiple projects. They want clear visual indication of the current project name and location in the application's title bar or status area.

**Why this priority**: Important for user orientation but secondary to the core switching functionality. Users can work without it but may be confused about which project they're viewing.

**Independent Test**: Can be tested by opening any project and verifying the project name appears in the window title bar and/or a status indicator. Delivers value by preventing user errors (editing the wrong project).

**Acceptance Scenarios**:

1. **Given** a project is loaded, **When** user looks at the window title bar, **Then** they see "spec-board - {Project Name}" format
2. **Given** a project path is "/Users/name/my-project/specs", **When** the project loads, **Then** the project name "my-project" is extracted from the parent directory
3. **Given** the user switches to a different project, **When** the new project loads, **Then** the window title updates to reflect the new project name

---

### User Story 3 - Access Recent Projects (Priority: P3)

Users frequently switch between the same 2-3 projects and want quick access to recently opened projects without browsing the file system every time. They want a File > Recent Projects submenu that lists the last 5 projects for one-click switching.

**Why this priority**: Nice-to-have convenience feature that improves efficiency for power users but not critical for basic functionality. Most users work on 1-2 projects at a time.

**Independent Test**: Can be tested by opening 3 different projects in sequence, then selecting File > Recent Projects and verifying all 3 appear in the list. Clicking any recent project should switch to it immediately. Delivers value by reducing repetitive file browsing.

**Acceptance Scenarios**:

1. **Given** the user has opened 3 projects (A, B, C) in that order, **When** user clicks File > Recent Projects, **Then** they see a list with C, B, A (most recent first)
2. **Given** the recent projects menu shows Project A in the list, **When** user clicks on Project A, **Then** the application switches to Project A immediately
3. **Given** the user has never opened any projects, **When** they click File > Recent Projects, **Then** the menu item is disabled with "(none)" text
4. **Given** more than 5 projects have been opened, **When** user views Recent Projects, **Then** only the 5 most recent projects appear in the list

---

### Edge Cases

- What happens when user selects a directory that doesn't contain valid spec-kit structure? → Show error dialog: "Invalid specs directory. Selected folder must contain numbered feature folders (e.g., 001-feature-name/)."
- How does the system handle permission errors when accessing a directory? → Show error dialog: "Permission denied. Please check folder permissions and try again."
- What happens if the currently loaded project directory is deleted externally while app is running? → File watcher detects deletion, show warning dialog: "Current project directory no longer exists. Please open a different project."
- What happens when user tries to open the same project that's already loaded? → Show info message: "This project is already open" and do nothing (avoid unnecessary reload).
- How does the system handle network-mounted directories (NAS, cloud storage)? → Works normally but may be slower; no special handling needed. If connection lost, treat as deleted directory.
- What happens to unsaved changes in the markdown editor when switching projects? → Prompt user: "You have unsaved changes. Save before switching?" with options: Save, Don't Save, Cancel.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a File > Open Folder menu item that opens a native folder picker dialog
- **FR-002**: System MUST support Cmd/Ctrl+O keyboard shortcut to trigger the folder picker dialog
- **FR-003**: System MUST validate selected directories to ensure they contain valid spec-kit structure (numbered feature folders)
- **FR-004**: System MUST display clear error messages when validation fails, explaining what makes a valid specs directory
- **FR-005**: System MUST update the dashboard to show the new project's features immediately after successful directory selection
- **FR-006**: System MUST save the newly selected project path to preferences for persistence across sessions
- **FR-007**: System MUST update the window title to display the current project name in format: "spec-board - {Project Name}"
- **FR-008**: System MUST derive the project name from the parent directory of the specs folder
- **FR-009**: System MUST maintain a list of up to 5 recently opened projects in preferences
- **FR-010**: System MUST provide a File > Recent Projects submenu showing recently opened projects
- **FR-011**: System MUST order recent projects by most recent first (newest at top)
- **FR-012**: System MUST allow users to switch to a recent project with a single click
- **FR-013**: System MUST stop the existing file watcher before switching projects
- **FR-014**: System MUST start a new file watcher for the newly loaded project
- **FR-015**: System MUST check for unsaved changes before switching projects and prompt user if any exist

### Key Entities

- **Project Reference**: Represents a loaded specs directory. Key attributes: absolute directory path, project name (derived from parent directory), last accessed timestamp, validation status (valid/invalid), feature count
- **Recent Projects List**: Collection of recently accessed projects. Key attributes: list of project references (max 5), ordered by recency, persisted in application preferences
- **Project Validator**: Validates that a directory is a valid specs directory. Key attributes: directory path to validate, validation rules (contains numbered folders matching pattern `\d+-.*`), error messages for different failure types

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch between projects in under 5 seconds (folder selection + load time)
- **SC-002**: Project validation completes in under 1 second for typical projects (10-50 features)
- **SC-003**: 95% of valid specs directories are correctly recognized and loaded without errors
- **SC-004**: Window title updates within 500ms of project switch completion
- **SC-005**: Recent projects list persists correctly across application restarts
- **SC-006**: File watcher successfully stops and starts without memory leaks during project switches
- **SC-007**: Users can identify which project is currently loaded at a glance (via window title)
- **SC-008**: Zero reported data loss or corruption when switching between projects
- **SC-009**: Recent projects feature reduces average project switching time by 50% for multi-project users
- **SC-010**: Error messages for invalid directories are clear enough that users can self-correct without support

## Assumptions

- Users work with multiple spec-kit projects located in different directories on their file system
- Each specs directory follows the standard spec-kit structure with numbered feature folders
- Projects are located on local or network-accessible file systems (not cloud URLs or remote servers)
- Users understand the concept of a "specs directory" from spec-kit documentation
- The application has read permissions for all directories users attempt to open
- Project switching does not require restarting the Python backend server (it serves content from any specs directory)
- Unsaved changes refer only to markdown editor content, not to window size/position or other preferences
- A "recent project" is defined by its absolute directory path (same path = same project, even if renamed)

## Dependencies

- Existing folder picker dialog implementation (from User Story 3 of 006-electron-prototype)
- Application preferences system (from 006-electron-prototype)
- File system watcher (from 006-electron-prototype)
- Python backend's ability to serve content from any specs directory via SPECS_DIR environment variable or configuration

## Scope

### In Scope

- Opening a different specs directory via File menu or keyboard shortcut
- Validating selected directories for valid spec-kit structure
- Updating dashboard to show new project's features
- Displaying current project name in window title
- Persisting project path and recent projects list to preferences
- Recent projects menu with up to 5 entries
- File watcher management (stop old, start new)
- Unsaved changes detection and user prompts

### Out of Scope

- Opening multiple projects simultaneously in tabs or split views
- Merging or comparing features across different projects
- Project-specific settings or configurations (all projects share same app settings)
- Project templates or scaffolding for new projects
- Git integration or version control features
- Project search or indexing across multiple projects
- Cloud storage integration (Dropbox, Google Drive, etc.) with special sync handling
- Automatic project discovery or workspace management
- Project bookmarks or favorites (beyond recent 5)
- Custom project naming (name always derived from parent directory)
