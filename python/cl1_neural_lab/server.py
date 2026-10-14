"""Optional HTTP server entry point for the virtual CL1 cluster.

Install the optional server dependency with:
    python -m pip install -e "./python[server]"
This server controls only in-memory virtual nodes and does not connect to physical CL1 hardware.
"""
from __future__ import annotations


def main() -> None:
    try:
        import aiohttp  # noqa: F401
    except ImportError as exc:
        raise SystemExit(
            "The CL1 cluster server requires the optional aiohttp dependency. "
            'Install it with: python -m pip install -e "./python[server]"'
        ) from exc

    from .cluster_server import main as run_cluster_server
    run_cluster_server()


if __name__ == "__main__":
    main()
