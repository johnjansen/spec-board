# Research: Kanban Board View Implementation

**Feature**: 002-kanban-board-view
**Date**: 2026-02-13

## Phase Parsing Strategy

### Decision: Regex-Based Markdown Section Extraction

**Research Question**: How to reliably extract phase boundaries and tasks from tasks.md?

**Options Evaluated**:
1. Full markdown AST parsing (python-markdown parse tree)
2. Regex pattern matching on markdown text
3. Line-by-line state machine processing

**Chosen Approach**: Regex pattern matching

**Rationale**:
- tasks.md has **consistent, predictable structure**:
  - Phase headers: `## Phase N: Description`
  - Tasks: `- [ ] TXXX [Story] Description` or `- [x] TXXX ...`
- Regex provides **sufficient reliability** for this structured format
- **Simpler implementation** than full AST parsing
- **Better performance** than state machine for small files
- Can **reuse existing patterns** from MarkdownRenderer (task IDs, story labels)

**Implementation Pattern**:
```python
# Extract phases
phase_pattern = r'^##\s+Phase\s+(\d+):\s*(.+)$'

# Extract tasks with checkboxes
task_pattern = r'^\s*-\s+\[([ xX])\]\s+(T\d{3}.*?)$'

# Group tasks by their phase section
# Track line numbers to associate tasks with phases
```

**Edge Cases Handled**:
- No phase headers → All tasks in "Ungrouped Tasks" column
- Empty phases → Show "No tasks in this phase" message
- Tasks before first phase → Include in "Ungrouped Tasks"
- Malformed task lines → Skip gracefully (don't break rendering)

**Alternatives Considered**:
- **Full AST parsing**: More robust but unnecessary complexity for consistent format
- **State machine**: More code to maintain, no significant benefit over regex

---

## Board Layout Implementation

### Decision: CSS Grid with Horizontal Scroll

**Research Question**: How to create responsive, scrollable multi-column board layout?

**Options Evaluated**:
1. CSS Grid with overflow-x
2. Flexbox with fixed-width columns
3. CSS columns (column-count)
4. JavaScript-based virtual scrolling

**Chosen Approach**: CSS Grid + `overflow-x: auto`

**Rationale**:
- **Native browser support** (no dependencies)
- **Clean column definitions** via `grid-template-columns`
- **Horizontal scroll** handles 10+ phases without layout breaks
- **Responsive** - can adjust column min-width for different screens
- **No JavaScript required** - consistent with dashboard architecture

**Implementation Pattern**:
```css
.board-container {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(280px, 1fr);
    gap: 1rem;
    overflow-x: auto;
    padding: 1rem;
}

.phase-column {
    min-width: 280px;
    max-width: 320px;
}
```

**Browser Compatibility**: Supported in all modern browsers (2016+)

**Alternatives Considered**:
- **Flexbox**: Works but less semantic for equal-width columns
- **CSS columns**: Not suitable for horizontal layout
- **JS virtual scrolling**: Unnecessary complexity, breaks server-side rendering

---

## View Toggle Mechanism

### Decision: HTMX Route-Based Toggle

**Research Question**: How to switch between list and board views without page reload?

**Options Evaluated**:
1. HTMX hx-get to different routes
2. Query parameter with conditional rendering
3. Client-side JavaScript toggle with hidden/shown divs
4. Two separate pages with navigation

**Chosen Approach**: HTMX route-based toggle

**Rationale**:
- **Consistent with dashboard patterns** - already using HTMX for artifact navigation
- **Server-side rendering** - maintains architectural consistency
- **Clean separation** - `/artifacts/{id}/tasks` vs `/artifacts/{id}/tasks/board`
- **No client state** - server always renders current view
- **Graceful degradation** - works without JavaScript (as separate URLs)

**Implementation Pattern**:
```html
<!-- In column_content.html header -->
<button hx-get="/artifacts/{{ feature.full_name }}/tasks/board"
        hx-target="#column-content"
        hx-swap="innerHTML">
    Board View
</button>

<button hx-get="/artifacts/{{ feature.full_name }}/tasks"
        hx-target="#column-content"
        hx-swap="innerHTML">
    List View
</button>
```

**User Experience**:
- Click "Board View" → Load board layout
- Click "List View" → Return to markdown rendering
- No page reload, partial update of content column only
- Smooth HTMX transition animations

**Alternatives Considered**:
- **Query params** (?view=board): Less RESTful, complicates routing
- **Client-side toggle**: Breaks server-rendering principle, requires JavaScript
- **Separate pages**: Worse UX, full page reloads

---

## Task Card Design

### Decision: Tailwind CSS Card Components

**Research Question**: How to style task cards for readability and visual hierarchy?

**Chosen Approach**: Tailwind utility classes with custom card component

**Design Elements**:
- **Task ID** (T001): Blue badge, monospace font (reuse existing .task-id style)
- **Status**: Checkbox icon (✓ completed, ○ incomplete)
- **Story Label** ([US1]): Color-coded badge (reuse .story-label styles)
- **Description**: Truncate after 3 lines with ellipsis
- **Hover state**: Subtle shadow lift

**Rationale**:
- **Reuses existing styles** from task list rendering (consistency)
- **Tailwind utilities** maintain design system coherence
- **No new CSS framework** needed
- **Responsive** card sizing based on column width

**Visual Hierarchy**:
1. Checkbox (left edge, prominent)
2. Task ID (top, badge)
3. Description (main content, readable)
4. Story label (bottom right, secondary)

---

## Performance Considerations

### Decision: Server-Side Rendering with Minimal Processing

**Research Question**: How to ensure board renders quickly for 100 tasks?

**Strategy**:
- **Parse once** when route is accessed (no caching for prototype)
- **Render server-side** (avoid client-side DOM manipulation)
- **Stream HTML** (FastAPI supports streaming responses)
- **Lazy load** only when board view is requested (not on initial page load)

**Expected Performance**:
- **Parsing**: O(n) where n = number of lines in tasks.md (~1000 lines max)
- **Grouping**: O(n) where n = number of tasks (~100 max)
- **Rendering**: Jinja2 template rendering (<100ms for 100 tasks)

**Total**: <1 second for realistic task files (per spec success criteria)

**No Optimization Needed**:
- Caching not required (file reads are fast)
- Database not needed (all data in memory)
- Pagination not needed (100 tasks fits on screen with scroll)

---

## Summary

All research questions resolved with clear technical decisions:

1. ✅ **Parsing**: Regex-based phase extraction
2. ✅ **Layout**: CSS Grid with horizontal scroll
3. ✅ **Toggle**: HTMX route-based view switching
4. ✅ **Cards**: Tailwind components reusing existing styles
5. ✅ **Performance**: Server-side rendering, no caching needed

**Ready to proceed to data model and contracts definition.**
