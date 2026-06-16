"""spotify_top, top tracks / artists / albums for a chosen window.

Thin widget over spotify_core: it owns the OAuth + API; we ask for the
shaped ``top_items()`` result and forward it to the client. The client
renders a hero + grid layout from the uniform ``items`` list.
"""

from __future__ import annotations

from typing import Any

from flask import current_app


def _core() -> Any:
    plugin = current_app.config["PLUGIN_REGISTRY"].get("spotify_core")
    return plugin.server_module if plugin is not None else None


def fetch(
    options: dict[str, Any], settings: dict[str, Any], *, ctx: dict[str, Any]
) -> dict[str, Any]:
    del settings, ctx
    core = _core()
    if core is None:
        return {"error": "Install the Spotify Core plugin to use this widget."}

    kind = str(options.get("kind") or "tracks")
    time_range = str(options.get("time_range") or "short_term")
    # The client renders at most 10 cells (1 hero + 9 grid) in any
    # supported layout, so clamp the request the same way to avoid
    # asking Spotify for more than we can paint.
    try:
        max_items = int(options.get("max_items") or 5)
    except (TypeError, ValueError):
        max_items = 5
    max_items = max(1, min(10, max_items))

    top = core.top_items(kind, time_range, max_items)
    if top.get("error"):
        return {"error": top["error"]}
    return {
        "kind": top.get("kind", kind),
        "time_range": top.get("time_range", time_range),
        "items": top.get("items") or [],
    }
