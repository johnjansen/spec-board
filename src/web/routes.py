"""FastAPI routes for the Spec-Board dashboard."""

from pathlib import Path

from fastapi import Request, HTTPException
from fastapi.responses import HTMLResponse

from .app import app, templates
from ..services.feature_repository import FeatureRepository

# Configure specs directory path
# Use project-local specs directory
PROJECT_ROOT = Path(__file__).parent.parent.parent
SPECS_DIR = PROJECT_ROOT / "specs"

# Initialize repository
feature_repo = FeatureRepository(SPECS_DIR)


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
