# Tesserae Spotify widgets

Now-playing, queue, and album-art widgets for [Tesserae](https://github.com/dmellok/tesserae), the e-ink dashboard companion.

Bundle of 4 widgets:

- **Spotify Core** (`spotify_core`), shared OAuth flow + connection state. No cell of its own; the other Spotify widgets read from it.
- **Spotify, Now Playing** (`spotify_now_playing`), current track + artist + album art tile.
- **Spotify, Queue** (`spotify_queue`), up-next list with track titles + artists.
- **Spotify, Album Art** (`spotify_album_art`), large cover-art-only tile.

## Install

Settings → Widgets → Browse community widgets → Install. After restart, configure your Spotify app's Client ID + Secret under Settings → Widgets → Spotify Core, then click "Connect" to authorise.

## Spotify app setup

1. Visit [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) and create an app.
2. Add `http://localhost:8765/plugins/spotify_core/callback` to the redirect URIs (replace host/port if you've changed Tesserae's defaults).
3. Copy Client ID + Client Secret into Tesserae's Spotify Core settings.

## Why these moved out of the bundle

OAuth-required widgets aren't useful out of the box, every user has to register a Spotify app and click through the connect flow before any cell renders. Bundling them inflated the picker for users who never planned to enable them. Marketplace is the right home: install if you want them.

## License

MIT. See [LICENSE](./LICENSE).
