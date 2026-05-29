# David's Watch Vault

A private local webpage for your own movie/show/animation collection.

## Current Behavior

- The library stays visible even when the external media disk is not attached.
- The page uses a saved catalog for browsing, searching, details, watchlist, and ratings.
- When opened through the launcher/server and the media disk is available, `Watch` buttons appear automatically.
- If live media access is not available, the page simply behaves like a saved collection and does not show warning/status noise.

## Open It

Best option:

```text
https://watch-vault-zeta.vercel.app
Open Watch Vault.command
```

Normal HTML preview:

```text
index.html
```

Opening `index.html` directly still lets you browse the saved library, but direct file-opening buttons are hidden by browser security rules.

## Safety

The scanner reads file and folder names only. It does not modify your media files. Ratings and watchlist are saved in your browser with localStorage.
