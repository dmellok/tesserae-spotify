"""spotify_top smoke: composer renders with spotify_core.top_items
mocked, no OAuth, no network."""

from __future__ import annotations

import pytest
from flask import Flask
from flask.testing import FlaskClient

_TRACKS = {
    "connected": True,
    "ok": True,
    "kind": "tracks",
    "time_range": "short_term",
    "items": [
        {
            "name": "Such Great Heights",
            "secondary": "The Postal Service",
            "art_large": "https://i.scdn.co/image/cover-l",
            "art_small": "https://i.scdn.co/image/cover-s",
            "album": "Give Up",
        },
        {
            "name": "Brave New World",
            "secondary": "Bobby Bridger",
            "art_large": "https://i.scdn.co/image/cover-l-2",
            "art_small": "https://i.scdn.co/image/cover-s-2",
            "album": "Heal in the Wisdom",
        },
        {
            "name": "Polaroid",
            "secondary": "Imagine Dragons",
            "art_large": "https://i.scdn.co/image/cover-l-3",
            "art_small": "https://i.scdn.co/image/cover-s-3",
            "album": "Smoke + Mirrors",
        },
    ],
}

_ARTISTS = {
    "connected": True,
    "ok": True,
    "kind": "artists",
    "time_range": "medium_term",
    "items": [
        {
            "name": "Phoebe Bridgers",
            "secondary": "indie pop, indie rock",
            "art_large": "https://i.scdn.co/image/art-l",
            "art_small": "https://i.scdn.co/image/art-s",
            "followers": 1234567,
            "popularity": 78,
        },
    ],
}


def _core(app: Flask):
    return app.config["PLUGIN_REGISTRY"].get("spotify_core").server_module


@pytest.mark.parametrize("size", ["sm", "md", "lg"])
def test_top_tracks_renders_metadata(
    app: Flask, client: FlaskClient, monkeypatch, size: str
) -> None:
    """Happy path: top tracks come back with art + names + secondary,
    and the rendered HTML carries the top three names. Every supported
    size collapses to the same data, just laid out differently."""
    monkeypatch.setattr(_core(app), "top_items", lambda kind, time_range, limit: _TRACKS)
    resp = client.get(f"/_test/render?plugin=spotify_top&size={size}")
    assert resp.status_code == 200
    body = resp.get_data(as_text=True)
    assert 'data-plugin="spotify_top"' in body
    assert "Such Great Heights" in body
    assert "The Postal Service" in body
    assert "Last 4 weeks" in body


def test_top_artists_renders_with_artist_metadata(
    app: Flask, client: FlaskClient, monkeypatch
) -> None:
    """Artists path: the same widget renders a single artist's name +
    genres-as-secondary at md. The hero card carries the genres, the
    time-range chip reflects the medium_term selection."""
    monkeypatch.setattr(_core(app), "top_items", lambda kind, time_range, limit: _ARTISTS)
    resp = client.get("/_test/render?plugin=spotify_top&size=md")
    assert resp.status_code == 200
    body = resp.get_data(as_text=True)
    assert "Phoebe Bridgers" in body
    assert "indie pop" in body
    assert "Last 6 months" in body


def test_top_renders_error_state_when_scope_missing(
    app: Flask, client: FlaskClient, monkeypatch
) -> None:
    """When the core helper returns the ``Reconnect Spotify`` error
    (HTTP 403 / insufficient_scope on /me/top/*), the widget shows it
    inline rather than rendering an empty hero. This is the common
    upgrade path: spotify_core 0.1.x users hit this until they
    reconnect once."""
    monkeypatch.setattr(
        _core(app),
        "top_items",
        lambda kind, time_range, limit: {
            "connected": True,
            "error": "Reconnect Spotify to grant the user-top-read scope.",
        },
    )
    resp = client.get("/_test/render?plugin=spotify_top&size=md")
    assert resp.status_code == 200
    body = resp.get_data(as_text=True)
    assert "Reconnect Spotify" in body
