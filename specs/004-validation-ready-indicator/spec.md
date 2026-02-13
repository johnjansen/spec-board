# Feature Specification: Validation-Ready Indicator

**Feature Branch**: `004-validation-ready-indicator`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "the feature completed indicator should show \"V\" if the only remaining steps are manual validation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Validation-Ready Visual Indicator (Priority: P1)

As a project manager viewing the spec-board dashboard, I need to see a "V" indicator when a feature has only manual validation tasks remaining, so I can quickly identify features that are implementation-complete and ready for final verification.

**Why this priority**: This is the core value - distinguishing between "all tasks done" (✓) and "ready for validation" (V) helps prioritize validation work and understand true implementation progress.

**Independent Test**: Can be fully tested by creating a feature with only validation tasks incomplete, viewing the feature list, and verifying a "V" indicator appears instead of the completion checkmark.

**Acceptance Scenarios**:

1. **Given** a feature has all implementation tasks complete and only validation tasks remaining, **When** I view the feature list, **Then** I see a "V" indicator next to that feature
2. **Given** a feature has all tasks complete (including validation), **When** I view the feature list, **Then** I see a "✓" indicator (existing behavior)
3. **Given** a feature has incomplete implementation tasks (not just validation), **When** I view the feature list, **Then** I see no indicator

---

### User Story 2 - Validation Status Tooltip (Priority: P2)

As a user viewing the feature list, I need to hover over the "V" indicator to see which validation tasks remain, so I understand what validation work is pending without navigating into the feature.

**Why this priority**: Enhances the P1 indicator by providing actionable detail. Users can see exactly what validation is needed without extra clicks.

**Independent Test**: Can be tested by hovering over a "V" indicator and verifying a tooltip appears with validation task details.

**Acceptance Scenarios**:

1. **Given** a feature with "V" indicator, **When** I hover over it, **Then** I see a tooltip showing "X validation tasks remaining" or similar
2. **Given** I am viewing the validation tooltip, **When** I move my cursor away, **Then** the tooltip disappears

---

### User Story 3 - Visual Distinction from Completion Indicator (Priority: P2)

As a user viewing the feature list, I need the "V" validation indicator to be visually distinct from the "✓" completion indicator, so I can instantly differentiate between validation-ready and fully complete features.

**Why this priority**: Prevents confusion between two similar states. Important for usability but the indicator is still useful even without perfect visual distinction.

**Independent Test**: Can be tested by viewing features with both "V" and "✓" indicators and verifying they are clearly distinguishable.

**Acceptance Scenarios**:

1. **Given** features exist with both "V" and "✓" indicators, **When** I view the feature list, **Then** I can instantly distinguish between them (different symbols, colors, or styling)
2. **Given** a feature transitions from "V" to "✓" (validation complete), **When** I view the feature list, **Then** the indicator changes appropriately

---

### Edge Cases

- What happens when a feature has mixed incomplete tasks (some validation, some implementation)?
- How does the system handle tasks that are ambiguous (could be considered validation or implementation)?
- What if validation tasks are spread across multiple phases?
- Should manual testing tasks count as validation?
- What about tasks labeled "Polish" or "Documentation" - are these validation?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST identify validation tasks by checking if the task description starts with "Manual validation:" (case-insensitive prefix match)
- **FR-002**: System MUST display a "V" indicator on feature list items when only validation tasks remain incomplete
- **FR-003**: System MUST display the existing "✓" indicator when all tasks (including validation) are complete
- **FR-004**: System MUST display no indicator when implementation tasks remain incomplete (regardless of validation task status)
- **FR-005**: Validation indicator MUST be visually distinct from the completion indicator (different symbol, color, or styling)
- **FR-006**: System MUST show a tooltip on hover displaying validation task information (e.g., "3 validation tasks remaining")
- **FR-007**: System MUST handle missing or malformed tasks.md files gracefully (no indicator shown, no errors displayed)
- **FR-008**: System MUST update the validation indicator automatically when the feature list refreshes (existing 3-second polling)

### Key Entities

- **Feature** (Existing): Extended to include validation status
  - `is_validation_ready`: boolean - True if only validation tasks remain
  - `validation_tasks_remaining`: int - Count of incomplete validation tasks
  - Relationship: Derived from tasks.md parsing

- **Task Classification** (New): Logic to determine if a task is validation vs implementation
  - Validation tasks: Tasks related to testing, verification, validation, QA
  - Implementation tasks: All other tasks (code, models, services, UI)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify validation-ready features at a glance without clicking into individual features (user survey: 90% find it "easy" to identify validation-ready features)
- **SC-002**: Validation indicator updates within 3 seconds when tasks.md is modified (leverages existing auto-refresh)
- **SC-003**: Zero false positives: features showing "V" indicator always have only validation tasks remaining
- **SC-004**: Zero false negatives: features with only validation tasks remaining always show "V" indicator
- **SC-005**: Users can distinguish between "V" (validation-ready) and "✓" (complete) indicators without confusion (user testing: 95% correctly identify the difference)
