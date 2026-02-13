---

description: "Task list for Spec-Kit Visualization Dashboard implementation"
---

# Tasks: Spec-Kit Visualization Dashboard

**Input**: Design documents from `/specs/002-spec-dashboard/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Per constitution Principle IV (No Tests - Prototype Exception), no test tasks are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `templates/`, `static/` at repository root
- All paths shown below use absolute repository root convention

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize uv project with pyproject.toml in repository root
- [x] T002 Add dependencies via uv: fastapi jinja2 markdown pygments uvicorn[standard]
- [x] T003 [P] Create src/ directory structure with __init__.py files
- [x] T004 [P] Create src/models/ directory with __init__.py
- [x] T005 [P] Create src/services/ directory with __init__.py
- [x] T006 [P] Create src/web/ directory with __init__.py
- [x] T007 [P] Create src/templates/ directory with subdirectories (components/, partials/)
- [x] T008 [P] Create static/ directory for CSS/JS assets
- [x] T009 [P] Create .gitignore with Python, uv, and environment entries

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 [P] Create Project dataclass in src/models/project.py with type hints
- [x] T011 [P] Create Feature dataclass in src/models/feature.py with type hints
- [x] T012 [P] Create Artifact dataclass with ArtifactType enum in src/models/artifact.py with type hints
- [x] T013 [P] Create ArtifactMetadata dataclass in src/models/artifact_metadata.py with type hints
- [x] T014 Create FileSystemReader class in src/services/file_system_reader.py with list_features() method
- [x] T015 Create MarkdownRenderer class in src/services/markdown_renderer.py with render() method using python-markdown
- [x] T016 Create FeatureRepository class in src/services/feature_repository.py with get_feature() and list_all() methods
- [x] T017 Create ArtifactParser class in src/services/artifact_parser.py with parse_frontmatter() method
- [x] T018 Create FastAPI app instance in src/web/app.py with Jinja2Templates and StaticFiles configuration
- [x] T019 Create base.html template in src/templates/base.html with Tailwind CSS and HTMX CDN links

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View All Features (Priority: P1) 🎯 MVP

**Goal**: Display list of all features in project with status and metadata

**Independent Test**: Create project with 3-5 features, open dashboard at localhost:8000, verify all features listed with names, numbers, statuses. Column 2 should populate automatically via HTMX.

### Implementation for User Story 1

- [x] T020 [US1] Create dashboard.html template in src/templates/dashboard.html with 4-column Miller columns layout
- [x] T021 [US1] Create Column 1 (Project Root) HTML structure in dashboard.html showing specs/ directory
- [x] T022 [US1] Create Column 2 container in dashboard.html with hx-get="/features" hx-trigger="load"
- [x] T023 [US1] Create GET / route in src/web/routes.py returning dashboard.html template
- [x] T024 [US1] Create column_features.html component in src/templates/components/column_features.html
- [x] T025 [US1] Implement feature list rendering with HTMX attributes (hx-get, hx-target, hx-swap) in column_features.html
- [x] T026 [US1] Create GET /features route in src/web/routes.py using FeatureRepository.list_all()
- [x] T027 [US1] Add error handling for empty specs/ directory (show "No features found" message)
- [x] T028 [US1] Add error handling for permission denied on specs/ directory
- [x] T029 [US1] Add Tailwind CSS styling to feature-item elements (hover states, padding, colors)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Opening localhost:8000 shows feature list.

---

## Phase 4: User Story 2 - View Feature Specification (Priority: P1) 🎯 MVP

**Goal**: Render markdown specifications with full formatting in Column 4

**Independent Test**: Click a feature from list, click "spec.md" in Column 3, verify rendered markdown appears in Column 4 with proper headings, lists, code blocks, tables.

### Implementation for User Story 2

- [x] T030 [US2] Create Column 3 container in dashboard.html with id="column-artifacts"
- [x] T031 [US2] Create column_artifacts.html component in src/templates/components/column_artifacts.html
- [x] T032 [US2] Implement artifact list rendering showing spec.md, plan.md, tasks.md with existence indicators in column_artifacts.html
- [x] T033 [US2] Add HTMX attributes to artifact items (hx-get="/artifacts/{id}/{type}") in column_artifacts.html
- [x] T034 [US2] Create GET /features/{feature_id}/artifacts route in src/web/routes.py
- [x] T035 [US2] Create Column 4 container in dashboard.html with id="column-content"
- [x] T036 [US2] Create column_content.html component in src/templates/components/column_content.html
- [x] T037 [US2] Implement markdown rendering HTML structure with prose styling in column_content.html
- [x] T038 [US2] Create GET /artifacts/{feature_id}/{artifact_type} route in src/web/routes.py
- [x] T039 [US2] Integrate MarkdownRenderer.render() in artifact view route
- [x] T040 [US2] Add breadcrumb navigation showing feature > artifact path in column_content.html
- [x] T041 [US2] Add error handling for non-existent artifacts (show "Not created yet" message)
- [x] T042 [US2] Add error handling for malformed markdown (show error + raw content fallback)
- [x] T043 [US2] Configure markdown extensions (fenced_code, tables, toc, codehilite) in MarkdownRenderer
- [x] T044 [US2] Add Tailwind typography plugin styles (prose class) for markdown content
- [x] T045 [US2] Add file size display next to artifact names in KB/MB format

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. MVP is complete - can view features and read specifications.

---

## Phase 5: User Story 3 - View Implementation Plan (Priority: P2)

**Goal**: Display plan.md with technical context, constitution checks, project structure

**Independent Test**: Click feature, click "plan.md", verify plan sections render correctly including Technical Context, Constitution Check, Project Structure.

### Implementation for User Story 3

- [x] T046 [US3] Add plan.md specific styling for Constitution Check section (green checkmarks, gate status)
- [x] T047 [US3] Add syntax highlighting for code blocks in plan.md (project structure diagrams)
- [x] T048 [US3] Create custom CSS in static/styles.css for plan-specific elements (complexity table, structure blocks)
- [x] T049 [US3] Add plan.md file size and metadata extraction to artifact list
- [x] T050 [US3] Test plan.md rendering with current feature's actual plan content

**Checkpoint**: User Stories 1, 2, AND 3 all work. Can view features, specs, and plans.

---

## Phase 6: User Story 4 - View Task List (Priority: P2)

**Goal**: Display tasks.md with task status, dependencies, phase groupings

**Independent Test**: Click feature, click "tasks.md", verify task list renders with checkboxes, IDs, story labels, dependencies visible.

### Implementation for User Story 4

- [x] T051 [US4] Add tasks.md specific rendering for checkbox items (convert - [ ] to visual checkboxes)
- [x] T052 [US4] Add task ID highlighting (T001, T002) with monospace font
- [x] T053 [US4] Add story label badges ([US1], [US2]) with color coding
- [x] T054 [US4] Add parallel marker [P] visual indicator
- [x] T055 [US4] Create task completion counter (e.g., "15 of 47 tasks completed")
- [x] T056 [US4] Add phase boundary markers with visual separators
- [x] T057 [US4] Add dependency visualization (arrows or indentation for blocking relationships)
- [x] T058 [US4] Test tasks.md rendering with current feature's actual tasks content

**Checkpoint**: User Stories 1-4 all functional. Full project visibility: features, specs, plans, tasks.

---

## Phase 7: User Story 5 - Navigate Between Artifacts (Priority: P3)

**Goal**: Add navigation buttons/links to move between artifacts within a feature

**Independent Test**: From spec view, click "View Plan" button, navigate to plan. Click "View Tasks", navigate to tasks. Use breadcrumb to jump back to spec.

### Implementation for User Story 5

- [x] T059 [US5] Add navigation buttons to column_content.html (View Plan, View Tasks, Back to Spec)
- [x] T060 [US5] Implement HTMX navigation attributes on buttons (hx-get to other artifacts)
- [x] T061 [US5] Add breadcrumb navigation component in column_content.html header
- [x] T062 [US5] Make breadcrumb items clickable with HTMX attributes
- [x] T063 [US5] Add visual indicators for current artifact in navigation
- [ ] T064 [US5] Add keyboard shortcuts for navigation (optional: arrow keys, Esc to go back)

**Checkpoint**: All user stories complete. Full navigation between all artifacts works smoothly.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T065 [P] Add loading spinners for HTMX requests (hx-indicator attribute)
- [x] T066 [P] Add transition animations for column updates (fade-in effect)
- [x] T067 [P] Create error.html component in src/templates/components/error.html for 404/500 errors
- [x] T068 [P] Add logging configuration in src/web/app.py (log to console, file optional)
- [x] T069 [P] Add graceful error handling for file permission issues
- [x] T070 [P] Add performance optimization: lazy loading for large markdown files (>1MB)
- [x] T071 [P] Add responsive design: stack columns vertically on mobile screens (<768px)
- [x] T072 [P] Create README.md in repository root with quickstart instructions
- [x] T073 [P] Add favicon and title customization
- [x] T074 [P] Validate all HTMX attributes render correctly (test in browser DevTools)
- [x] T075 Run manual validation checklist from quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories CAN proceed in parallel if desired (different developers)
  - Or sequentially in priority order (P1 → P2 → P3) for single developer
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May use Column 3 structure from US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Reuses US2 rendering infrastructure
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Reuses US2 rendering infrastructure
- **User Story 5 (P3)**: Depends on US1, US2, US3, US4 being complete (adds navigation between them)

### Within Each User Story

- Models before services (Foundational phase handles this)
- Services before routes
- Routes before templates
- Base templates before components
- Core rendering before styling/polish

### Parallel Opportunities

- **Setup (Phase 1)**: T003-T009 can run in parallel (different directories)
- **Foundational (Phase 2)**: T010-T013 (models) can run in parallel, T014-T017 (services) can run in parallel
- **User Story 1**: T029 can run parallel with template tasks if different developers
- **User Story 2**: T032-T033 can run parallel with T036-T037
- **Polish (Phase 8)**: T065-T074 can run in parallel (different files/concerns)

**Once Foundational completes**: User Stories 1-4 can be worked on in parallel by different team members since they're independently testable.

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

**Recommended for fastest value delivery:**

1. Complete Phase 1: Setup (9 tasks)
2. Complete Phase 2: Foundational (10 tasks)
3. Complete Phase 3: User Story 1 (10 tasks)
4. Complete Phase 4: User Story 2 (16 tasks)
5. **STOP and VALIDATE**: Test US1+US2 independently
6. Deploy/demo if ready (MVP: view features + read specs)

**MVP Delivers**: Ability to browse all features and read their specifications with proper markdown rendering. This alone provides significant value for stakeholders and developers.

### Incremental Delivery

**Recommended for continuous value add:**

1. Complete Setup + Foundational (19 tasks) → Foundation ready
2. Add User Story 1 (10 tasks) → Test independently → Can see feature list (value!)
3. Add User Story 2 (16 tasks) → Test independently → Can read specs (MVP achieved!)
4. Add User Story 3 (5 tasks) → Test independently → Can read plans (developer value!)
5. Add User Story 4 (8 tasks) → Test independently → Can track tasks (PM value!)
6. Add User Story 5 (6 tasks) → Test independently → Enhanced navigation (UX polish!)
7. Add Polish (11 tasks) → Production-ready dashboard

Each increment adds measurable value without breaking previous functionality.

### Parallel Team Strategy

**If multiple developers available:**

1. **Team**: Complete Setup + Foundational together (19 tasks)
2. **Once Foundational is done:**
   - **Developer A**: User Story 1 (10 tasks) - Feature list
   - **Developer B**: User Story 2 (16 tasks) - Spec rendering
   - **Developer C**: User Story 3 (5 tasks) - Plan rendering
3. **Sync point**: Integrate all completed stories
4. **Developer A**: User Story 4 (8 tasks) - Task rendering
5. **Developer B**: User Story 5 (6 tasks) - Navigation
6. **Team**: Polish phase together (11 tasks)

This parallelizes the bulk of the work while maintaining story independence.

---

## Task Summary

**Total Tasks**: 75

**Breakdown by Phase**:
- Phase 1 (Setup): 9 tasks
- Phase 2 (Foundational): 10 tasks
- Phase 3 (US1 - View Features): 10 tasks
- Phase 4 (US2 - View Specs): 16 tasks
- Phase 5 (US3 - View Plans): 5 tasks
- Phase 6 (US4 - View Tasks): 8 tasks
- Phase 7 (US5 - Navigation): 6 tasks
- Phase 8 (Polish): 11 tasks

**Parallel Opportunities**: 20+ tasks can run in parallel across different phases

**MVP Scope**: 45 tasks (Setup + Foundational + US1 + US2)
**Full Scope**: 75 tasks (all user stories + polish)

**Estimated Timeline** (single developer, prototype pace):
- MVP (US1 + US2): ~2-3 days
- All user stories: ~4-5 days
- Production-ready: ~5-6 days

---

## Notes

- All tasks include exact file paths for immediate execution
- No test tasks per constitution Principle IV (prototype exception)
- Tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description`
- Each user story independently testable at its checkpoint
- Commit after completing each user story phase
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Follow constitution: one class per file, type hints on all signatures, minimal complexity
