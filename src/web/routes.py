"""FastAPI routes for the Spec-Board dashboard."""

from pathlib import Path
from typing import Dict, Any

from fastapi import Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

from .app import app, templates
from ..services.feature_repository import FeatureRepository
from ..services.edit_service import EditService

# Configure specs directory path
# Look for specs/ in the current working directory where spec-board is run
SPECS_DIR = Path.cwd() / "specs"

# Initialize repository
feature_repo = FeatureRepository(SPECS_DIR)

# Initialize edit service
edit_service = EditService(SPECS_DIR)


@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Main dashboard page with 4-column Miller columns layout.

    Returns:
        Dashboard HTML template
    """
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request}
    )


@app.get("/features", response_class=HTMLResponse)
async def list_features(request: Request):
    """Load feature list into Column 2.

    Scans specs/ directory for all features and renders them with
    status, date, and HTMX attributes for drill-down navigation.

    Returns:
        Feature list HTML component

    Raises:
        HTTPException: If specs directory is unreadable (500)
    """
    try:
        features = feature_repo.list_all()

        return templates.TemplateResponse(
            "components/column_features.html",
            {
                "request": request,
                "features": features,
                "specs_dir": SPECS_DIR
            }
        )

    except PermissionError:
        # T028: Handle permission denied
        return templates.TemplateResponse(
            "components/column_features.html",
            {
                "request": request,
                "features": [],
                "error": "Permission denied reading specs directory"
            }
        )

    except Exception as e:
        # General error handling
        return templates.TemplateResponse(
            "components/column_features.html",
            {
                "request": request,
                "features": [],
                "error": f"Error loading features: {str(e)}"
            }
        )


@app.get("/features/{feature_id}/artifacts", response_class=HTMLResponse)
async def list_artifacts(feature_id: str, request: Request):
    """Load artifact list for selected feature into Column 3.

    Args:
        feature_id: Feature directory name (e.g., "002-spec-dashboard")
        request: FastAPI request object

    Returns:
        Artifact list HTML component

    Raises:
        HTTPException: If feature not found (404)
    """
    try:
        feature = feature_repo.get_feature(feature_id)

        if not feature:
            return templates.TemplateResponse(
                "components/column_artifacts.html",
                {
                    "request": request,
                    "feature": None,
                    "error": f"Feature '{feature_id}' not found"
                }
            )

        return templates.TemplateResponse(
            "components/column_artifacts.html",
            {
                "request": request,
                "feature": feature
            }
        )

    except Exception as e:
        return templates.TemplateResponse(
            "components/column_artifacts.html",
            {
                "request": request,
                "feature": None,
                "error": f"Error loading artifacts: {str(e)}"
            }
        )


@app.get("/artifacts/{feature_id}/{artifact_type}", response_class=HTMLResponse)
async def view_artifact(feature_id: str, artifact_type: str, request: Request):
    """Load and render artifact content into Column 4.

    Args:
        feature_id: Feature directory name
        artifact_type: Artifact type (spec, plan, tasks)
        request: FastAPI request object

    Returns:
        Rendered markdown HTML component
    """
    from ..services.markdown_renderer import MarkdownRenderer

    # T041: Validate artifact_type
    if artifact_type not in ["spec", "plan", "tasks"]:
        return templates.TemplateResponse(
            "components/column_content.html",
            {
                "request": request,
                "error": f"Invalid artifact type: {artifact_type}",
                "feature_id": feature_id,
                "artifact_type": artifact_type
            }
        )

    try:
        # Get feature and artifact
        feature = feature_repo.get_feature(feature_id)

        if not feature:
            return templates.TemplateResponse(
                "components/column_content.html",
                {
                    "request": request,
                    "error": f"Feature '{feature_id}' not found",
                    "feature_id": feature_id,
                    "artifact_type": artifact_type
                }
            )

        artifact = feature.artifacts.get(artifact_type)

        # T041: Handle non-existent artifacts
        if not artifact or not artifact.exists:
            return templates.TemplateResponse(
                "components/column_content.html",
                {
                    "request": request,
                    "artifact_not_found": True,
                    "feature_id": feature_id,
                    "artifact_type": artifact_type
                }
            )

        # T039: Render markdown
        renderer = MarkdownRenderer()
        try:
            html_content = renderer.render(artifact)
        except Exception as render_error:
            # T042: Handle malformed markdown
            return templates.TemplateResponse(
                "components/column_content.html",
                {
                    "request": request,
                    "markdown_error": str(render_error),
                    "raw_content": artifact.content_raw,
                    "feature_id": feature_id,
                    "artifact_type": artifact_type
                }
            )

        return templates.TemplateResponse(
            "components/column_content.html",
            {
                "request": request,
                "content": html_content,
                "feature_id": feature_id,
                "artifact_type": artifact_type,
                "feature": feature
            }
        )

    except Exception as e:
        return templates.TemplateResponse(
            "components/column_content.html",
            {
                "request": request,
                "error": f"Error loading artifact: {str(e)}",
                "feature_id": feature_id,
                "artifact_type": artifact_type
            }
        )


@app.get("/artifacts/{feature_id}/tasks/board", response_class=HTMLResponse)
async def view_board(feature_id: str, request: Request):
    """Render tasks.md as a Kanban board view.

    Args:
        feature_id: Feature directory name
        request: FastAPI request object

    Returns:
        Board view HTML component with phases and task cards

    Raises:
        HTTPException: If feature or tasks.md not found (404)
    """
    from ..services.markdown_renderer import MarkdownRenderer

    try:
        # Get feature and tasks artifact
        feature = feature_repo.get_feature(feature_id)

        if not feature:
            return templates.TemplateResponse(
                "components/error.html",
                {
                    "request": request,
                    "error_code": "404",
                    "error_title": "Feature Not Found",
                    "error_message": f"Feature '{feature_id}' not found",
                    "back_link": "/",
                    "back_text": "Return to Dashboard"
                }
            )

        # Get tasks artifact
        tasks_artifact = feature.artifacts.get("tasks")

        if not tasks_artifact or not tasks_artifact.exists:
            return templates.TemplateResponse(
                "components/error.html",
                {
                    "request": request,
                    "error_code": "404",
                    "error_title": "Tasks Not Found",
                    "error_message": f"tasks.md not found for feature '{feature_id}'",
                    "back_link": f"/features/{feature_id}/artifacts",
                    "back_text": "Return to Feature"
                }
            )

        # Render board view
        renderer = MarkdownRenderer()
        try:
            board = renderer.render_board_view(tasks_artifact, feature_id)
        except Exception as render_error:
            return templates.TemplateResponse(
                "components/error.html",
                {
                    "request": request,
                    "error_code": "500",
                    "error_title": "Board Rendering Error",
                    "error_message": f"Failed to render board: {str(render_error)}",
                    "back_link": f"/artifacts/{feature_id}/tasks",
                    "back_text": "Return to List View"
                }
            )

        return templates.TemplateResponse(
            "components/board_view.html",
            {
                "request": request,
                "board": board,
                "feature": feature,
                "feature_id": feature_id
            }
        )

    except Exception as e:
        return templates.TemplateResponse(
            "components/error.html",
            {
                "request": request,
                "error_code": "500",
                "error_title": "Server Error",
                "error_message": f"Error loading board: {str(e)}",
                "back_link": "/",
                "back_text": "Return to Dashboard"
            }
        )


# ============================================================================
# Edit API Endpoints (Feature 005-markdown-editor)
# ============================================================================


class SaveFileRequest(BaseModel):
    """Request model for POST /api/edit/save endpoint."""

    filepath: str
    content: str
    originalMtime: float


@app.get("/artifacts/{feature_id}/{artifact_type}/edit", response_class=HTMLResponse)
async def edit_artifact(feature_id: str, artifact_type: str, request: Request):
    """Load editor for artifact.

    Args:
        feature_id: Feature directory name
        artifact_type: Artifact type (spec, plan, tasks)
        request: FastAPI request object

    Returns:
        Editor HTML component
    """
    # Validate artifact_type
    if artifact_type not in ["spec", "plan", "tasks"]:
        return templates.TemplateResponse(
            "components/column_content.html",
            {
                "request": request,
                "error": f"Invalid artifact type: {artifact_type}",
                "feature_id": feature_id,
                "artifact_type": artifact_type
            }
        )

    try:
        # Get feature and artifact
        feature = feature_repo.get_feature(feature_id)

        if not feature:
            return templates.TemplateResponse(
                "components/column_content.html",
                {
                    "request": request,
                    "error": f"Feature '{feature_id}' not found",
                    "feature_id": feature_id,
                    "artifact_type": artifact_type
                }
            )

        artifact = feature.artifacts.get(artifact_type)

        # Handle non-existent artifacts
        if not artifact or not artifact.exists:
            return templates.TemplateResponse(
                "components/column_content.html",
                {
                    "request": request,
                    "artifact_not_found": True,
                    "feature_id": feature_id,
                    "artifact_type": artifact_type
                }
            )

        # Load file for editing
        filepath = Path(artifact.path)
        load_response = edit_service.load_for_editing(filepath)

        if not load_response["success"]:
            return templates.TemplateResponse(
                "components/column_content.html",
                {
                    "request": request,
                    "error": load_response.get("error", "Failed to load file"),
                    "feature_id": feature_id,
                    "artifact_type": artifact_type
                }
            )

        # Check for large file warning
        warning = load_response.get("warning")
        if warning and "large_file" in warning:
            # TODO: Implement large file warning modal (T042)
            # For now, proceed with loading
            pass

        # Render editor
        return templates.TemplateResponse(
            "components/markdown_editor.html",
            {
                "request": request,
                "filepath": load_response["filepath"],
                "content": load_response["content"],
                "mtime": load_response["mtime"],
                "size_bytes": load_response["size_bytes"],
                "feature": feature,
                "feature_id": feature_id,
                "artifact_type": artifact_type
            }
        )

    except Exception as e:
        return templates.TemplateResponse(
            "components/column_content.html",
            {
                "request": request,
                "error": f"Error loading editor: {str(e)}",
                "feature_id": feature_id,
                "artifact_type": artifact_type
            }
        )


@app.get("/api/edit/load")
async def load_file_for_editing(filepath: str) -> JSONResponse:
    """Load markdown file for editing with metadata.

    Args:
        filepath: Absolute path to markdown file (query parameter)

    Returns:
        JSON response with:
            - success: bool
            - filepath: str (absolute path)
            - content: str
            - mtime: float
            - size_bytes: int
            - encoding: str
            - warning: str (optional, if file is large)
            - error: str (optional, if load failed)

    Raises:
        HTTPException: 400 (bad request), 403 (forbidden), 404 (not found)
    """
    if not filepath:
        raise HTTPException(
            status_code=400,
            detail="Missing required parameter: filepath"
        )

    try:
        file_path = Path(filepath)
        response = edit_service.load_for_editing(file_path)

        if not response["success"]:
            # Determine error code from error message
            error = response.get("error", "")
            if "not found" in error.lower():
                status_code = 404
            elif "access denied" in error.lower():
                status_code = 403
            elif "not UTF-8" in error:
                status_code = 400
            elif "exceeds" in error:
                status_code = 400
            else:
                status_code = 500

            return JSONResponse(
                status_code=status_code,
                content=response
            )

        return JSONResponse(content=response)

    except ValueError as e:
        # Security validation failure (path outside specs/)
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "error": str(e)
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Failed to load file: {str(e)}"
            }
        )


@app.post("/api/edit/preview")
async def preview_markdown(request: Request) -> JSONResponse:
    """Render markdown content to HTML for preview.

    Args:
        request: FastAPI request with JSON body containing 'content' field

    Returns:
        JSON response with:
            - success: bool
            - html: str (rendered HTML)
            - error: str (optional, if render failed)
    """
    try:
        # Parse request body
        body = await request.json()
        content = body.get('content', '')

        if not content:
            return JSONResponse(
                content={
                    "success": True,
                    "html": "<p class='text-gray-500'>No content to preview</p>"
                }
            )

        # Render markdown to HTML
        from ..services.markdown_renderer import MarkdownRenderer
        from ..models.artifact import ArtifactType
        renderer = MarkdownRenderer()

        # Create a temporary artifact-like object for rendering
        class PreviewArtifact:
            def __init__(self, content):
                self.content_raw = content
                self.type = ArtifactType.SPEC  # Default to spec type for preview
                self.content_html = None  # For caching

        preview_artifact = PreviewArtifact(content)
        html_content = renderer.render(preview_artifact)

        return JSONResponse(
            content={
                "success": True,
                "html": html_content
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Failed to render preview: {str(e)}"
            }
        )


@app.post("/api/edit/save")
async def save_file_from_editor(request_data: SaveFileRequest) -> JSONResponse:
    """Save edited markdown content with conflict detection.

    Args:
        request_data: SaveFileRequest with filepath, content, originalMtime

    Returns:
        JSON response with:
            - success: bool
            - mtime: float (new mtime after save)
            - size_bytes: int (new size after save)
            - conflict: bool (optional, if conflict detected)
            - error: str (optional, if save failed)

    Raises:
        HTTPException: 400 (validation), 403 (forbidden), 409 (conflict), 500 (server error)
    """
    try:
        file_path = Path(request_data.filepath)
        response = edit_service.save_from_editor(
            filepath=file_path,
            content=request_data.content,
            original_mtime=request_data.originalMtime
        )

        if not response["success"]:
            # Handle conflict (409)
            if response.get("conflict"):
                return JSONResponse(
                    status_code=409,
                    content=response
                )

            # Determine error code from error message
            error = response.get("error", "")
            if "not found" in error.lower():
                status_code = 404
            elif "access denied" in error.lower():
                status_code = 403
            elif "UTF-8" in error:
                status_code = 400
            else:
                status_code = 500

            return JSONResponse(
                status_code=status_code,
                content=response
            )

        return JSONResponse(content=response)

    except ValueError as e:
        # Security validation failure (path outside specs/)
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "error": str(e)
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Failed to save file: {str(e)}",
                "retryable": True
            }
        )
