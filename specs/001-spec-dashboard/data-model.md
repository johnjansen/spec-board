# Data Model: Spec-Kit Visualization Dashboard

**Feature**: 002-spec-dashboard
**Date**: 2026-02-13
**Purpose**: Entity definitions and relationships

## Overview

This dashboard operates on read-only file system data with no database. All entities are derived from the `specs/` directory structure and markdown file contents. Models are dataclasses with type hints, stored in `src/models/` with one class per file per constitution.

## Entity Definitions

### 1. Project

**File**: `src/models/project.py`

**Purpose**: Represents the root specs/ directory containing all features

**Attributes**:
```python
from dataclasses import dataclass
from pathlib import Path
from typing import List

@dataclass
class Project:
    """Root project containing all features."""
    name: str                    # Project name (derived from repo/dir name)
    specs_path: Path            # Absolute path to specs/ directory
    features: List['Feature']   # All features found in specs/
```

**Validation Rules**:
- `specs_path` MUST exist and be readable
- `specs_path` MUST be a directory
- `name` defaults to specs_path.parent.name if not provided

**State**: Immutable (read-only)

**Example**:
```python
project = Project(
    name="spec-board",
    specs_path=Path("/Users/user/repos/spec-board/specs"),
    features=[feature1, feature2, ...]
)
```

---

### 2. Feature

**File**: `src/models/feature.py`

**Purpose**: Represents a single feature directory (e.g., 001-spec-dashboard)

**Attributes**:
```python
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime

@dataclass
class Feature:
    """A single feature with spec, plan, and tasks artifacts."""
    number: str                      # Feature number (e.g., "001", "002")
    short_name: str                  # Short name (e.g., "spec-dashboard")
    full_name: str                   # Full directory name (e.g., "001-spec-dashboard")
    path: Path                       # Absolute path to feature directory
    artifacts: Dict[str, 'Artifact'] # Available artifacts by type
    created_date: Optional[datetime] # Extracted from spec.md frontmatter
    status: Optional[str]            # Extracted from spec.md frontmatter
```

**Validation Rules**:
- `number` MUST be numeric (001, 002, etc.)
- `full_name` MUST match pattern `{number}-{short_name}`
- `path` MUST exist and be a directory
- `artifacts` keys MUST be one of: "spec", "plan", "tasks"

**Relationships**:
- Parent: Project (one-to-many)
- Children: Artifacts (one-to-many)

**State**: Immutable (read-only)

**Example**:
```python
feature = Feature(
    number="002",
    short_name="spec-dashboard",
    full_name="002-spec-dashboard",
    path=Path("/Users/user/repos/spec-board/specs/002-spec-dashboard"),
    artifacts={
        "spec": spec_artifact,
        "plan": plan_artifact,
        # "tasks" not created yet
    },
    created_date=datetime(2026, 2, 13),
    status="Draft"
)
```

---

### 3. Artifact

**File**: `src/models/artifact.py`

**Purpose**: Represents a single markdown file (spec.md, plan.md, tasks.md)

**Attributes**:
```python
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from enum import Enum

class ArtifactType(Enum):
    """Types of artifacts in spec-kit."""
    SPEC = "spec"
    PLAN = "plan"
    TASKS = "tasks"

@dataclass
class Artifact:
    """A markdown artifact file."""
    type: ArtifactType          # spec, plan, or tasks
    path: Path                  # Absolute path to markdown file
    exists: bool                # Whether file exists
    size_bytes: int             # File size (0 if not exists)
    metadata: 'ArtifactMetadata' # Extracted frontmatter
    content_raw: Optional[str]  # Raw markdown content (lazy loaded)
    content_html: Optional[str] # Rendered HTML (lazy loaded)
```

**Validation Rules**:
- `path` filename MUST match `{type}.md`
- `exists` MUST reflect actual file existence
- `size_bytes` MUST be 0 if not exists
- `content_raw` and `content_html` loaded only when requested (lazy loading)

**Relationships**:
- Parent: Feature (many-to-one)
- Contains: ArtifactMetadata (one-to-one)

**State**: Partially mutable (content loaded on demand)

**Example**:
```python
artifact = Artifact(
    type=ArtifactType.SPEC,
    path=Path("/path/to/specs/002-spec-dashboard/spec.md"),
    exists=True,
    size_bytes=15234,
    metadata=metadata_obj,
    content_raw=None,  # Not loaded yet
    content_html=None  # Not loaded yet
)
```

---

### 4. ArtifactMetadata

**File**: `src/models/artifact_metadata.py`

**Purpose**: Parsed frontmatter from markdown files

**Attributes**:
```python
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from datetime import datetime

@dataclass
class ArtifactMetadata:
    """Metadata extracted from markdown frontmatter."""
    feature_branch: Optional[str] = None  # From "Feature Branch: `xxx`"
    created_date: Optional[datetime] = None  # From "Created: YYYY-MM-DD"
    status: Optional[str] = None          # From "Status: Draft/Planning/..."
    raw_frontmatter: Dict[str, Any] = field(default_factory=dict)  # All parsed fields
```

**Validation Rules**:
- `created_date` MUST be valid ISO date if present
- `status` values: "Draft", "Planning", "In Progress", "Complete", or None
- `raw_frontmatter` preserves all fields for extensibility

**Parsing Pattern**:
Extracts from markdown like:
```markdown
**Feature Branch**: `002-spec-dashboard`
**Created**: 2026-02-13
**Status**: Draft
```

**Example**:
```python
metadata = ArtifactMetadata(
    feature_branch="002-spec-dashboard",
    created_date=datetime(2026, 2, 13),
    status="Draft",
    raw_frontmatter={
        "feature_branch": "002-spec-dashboard",
        "created_date": "2026-02-13",
        "status": "Draft",
        "input": "user description text..."
    }
)
```

---

## Entity Relationships

```
Project (1)
  │
  └─── Features (N)
         │
         └─── Artifacts (N: spec, plan, tasks)
                │
                └─── ArtifactMetadata (1)
```

**Cardinality**:
- Project has many Features (1:N)
- Feature has many Artifacts (1:N, max 3: spec/plan/tasks)
- Artifact has one ArtifactMetadata (1:1)

**Lifecycle**:
1. Project scans specs/ directory
2. For each directory matching `\d+-\w+`, create Feature
3. For each Feature, check for spec.md, plan.md, tasks.md
4. For each existing file, create Artifact
5. Parse markdown frontmatter into ArtifactMetadata
6. Load content only when requested (lazy loading)

---

## Data Access Patterns

### Pattern 1: List All Features

```python
# FileSystemReader scans directory
features = file_system_reader.list_features()
# Returns: ['001-ram-cli-tool', '002-spec-dashboard']
```

### Pattern 2: Get Feature Details

```python
# FeatureRepository loads Feature entity
feature = feature_repo.get_feature('002-spec-dashboard')
# Returns: Feature with artifacts dict
```

### Pattern 3: Check Artifact Availability

```python
# Feature.artifacts shows what exists
if 'spec' in feature.artifacts:
    spec = feature.artifacts['spec']
    print(f"Spec exists: {spec.exists}, size: {spec.size_bytes}")
```

### Pattern 4: Load Artifact Content

```python
# MarkdownRenderer loads and renders on demand
artifact = feature.artifacts['spec']
html = markdown_renderer.render(artifact)
# Caches result in artifact.content_html
```

---

## Indexing Strategy

**No Database**: All data derived from file system on-demand

**Caching Strategy** (Future Enhancement):
- Current: No caching (prototype simplicity)
- Future: In-memory cache with TTL for feature list
- Future: LRU cache for rendered markdown

**Performance Considerations**:
- Directory scan: O(N) where N = number of feature directories
- File existence check: O(1) per artifact
- Markdown rendering: O(M) where M = file size
- For prototype with <50 features, no optimization needed

---

## Validation & Error Handling

### File System Errors

**Missing specs/ directory**:
```python
if not project.specs_path.exists():
    return Project(name="Unknown", specs_path=path, features=[])
```

**Permission denied**:
```python
try:
    features = list(specs_path.iterdir())
except PermissionError:
    logger.error("Cannot read specs/ directory")
    return []
```

### Malformed Markdown

**Unparseable frontmatter**:
```python
try:
    metadata = parse_frontmatter(content)
except Exception as e:
    metadata = ArtifactMetadata(raw_frontmatter={"error": str(e)})
```

**Markdown rendering errors**:
```python
try:
    html = markdown.markdown(content, extensions=EXTENSIONS)
except Exception as e:
    html = f"<pre>Error rendering markdown: {e}</pre>"
```

---

## Type Hints & Validation

All models use Python type hints per constitution:

```python
from typing import Optional, List, Dict
from pathlib import Path
from dataclasses import dataclass

@dataclass
class Example:
    required_field: str
    optional_field: Optional[int] = None
    list_field: List[str] = field(default_factory=list)
```

**Runtime Validation** (using __post_init__):
```python
def __post_init__(self):
    if not self.path.exists():
        raise ValueError(f"Path does not exist: {self.path}")
```

---

## Migration Notes

**From File System to Database** (if needed in future):
- Add SQLAlchemy models mirroring these dataclasses
- Implement repository pattern with abstract base class
- Swap FileSystemReader for DatabaseReader
- No changes to web layer (dependency injection handles it)

**Backward Compatibility**:
- Dataclass structure remains stable
- Additional fields added as Optional with defaults
- No breaking changes to existing code
