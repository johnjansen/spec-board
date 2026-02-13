"""FastAPI application instance with Jinja2 templates and static files."""

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# T068: Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Log to console
    ]
)

logger = logging.getLogger(__name__)

# Get the src package root (2 levels up from this file: src/web/app.py -> src/)
SRC_ROOT = Path(__file__).parent.parent

# Initialize FastAPI app
app = FastAPI(
    title="Spec-Board Dashboard",
    description="Visualization dashboard for spec-kit artifacts",
    version="0.1.0"
)

# Application lifecycle events
@app.on_event("startup")
async def startup_event():
    """Log application startup."""
    logger.info("Spec-Board Dashboard starting up...")
    logger.info(f"Templates directory: {SRC_ROOT / 'templates'}")
    logger.info(f"Static files directory: {SRC_ROOT / 'static'}")

@app.on_event("shutdown")
async def shutdown_event():
    """Log application shutdown."""
    logger.info("Spec-Board Dashboard shutting down...")

# Configure Jinja2 templates
templates = Jinja2Templates(directory=str(SRC_ROOT / "templates"))

# Mount static files
app.mount("/static", StaticFiles(directory=str(SRC_ROOT / "static")), name="static")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "spec-board-dashboard",
        "version": "0.1.0"
    }


# Import routes to register them with the app
# This must come after app initialization
from . import routes  # noqa: E402
