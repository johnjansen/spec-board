"""Entry point for running spec-board dashboard."""

import sys
import uvicorn


def main():
    """Run the spec-board dashboard server."""
    # Default configuration
    host = "127.0.0.1"
    port = 8000

    # Parse command line arguments
    args = sys.argv[1:]
    for i, arg in enumerate(args):
        if arg in ("--host", "-h") and i + 1 < len(args):
            host = args[i + 1]
        elif arg in ("--port", "-p") and i + 1 < len(args):
            port = int(args[i + 1])

    print(f"🚀 Starting Spec-Board Dashboard...")
    print(f"📊 Open http://{host}:{port} in your browser")
    print(f"⌨️  Press CTRL+C to stop")

    uvicorn.run(
        "src.web.app:app",
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )


if __name__ == "__main__":
    main()
