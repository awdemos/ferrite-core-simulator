# Agent Guidelines for Ferrite Core Memory Simulator

Interactive web-based simulator for magnetic core memory (1950s–1970s). It is a static, client-side JavaScript application served by nginx.

## Project Layout

```
index.html       # Main UI and canvas
style.css        # Theme and layout
src/app.js       # UI controllers and animation
src/core-memory.js  # Core-memory physics and state machine
Dockerfile       # Chainguard nginx container
README.md        # User documentation
```

## Critical Rules

1. **Keep it static.** Do not add a backend; the whole app runs in the browser.
2. **Preserve historical accuracy.** Presets (Apollo Guidance Computer, Whirlwind I, IBM 704, etc.) are based on real hardware specs; verify values before editing.
3. **Maintain symmetry between UI and state.** The memory editor, word breakdown, and canvas must stay synchronized through `src/app.js`.
4. **Respect the destructive-read model.** Reading a bit clears it to 0; writes must model the inhibit line for Write 0.

## Build / Run Commands

```bash
# Local development (no build step)
python3 -m http.server 8765
# open http://localhost:8765

# Docker build and run
docker build -t ferrite-sim .
docker run -p 8080:8080 ferrite-sim
# open http://localhost:8080
```

## Test Commands

This project has no automated test harness yet. Before committing:

1. Open the simulator in a browser.
2. Load each historical preset and verify dimensions/cycle time.
3. Write 1s and 0s, perform reads, and confirm destructive-read behavior.
4. Export state to JSON and re-import it.

## Lint / Format

```bash
# JavaScript is plain ES modules; keep style consistent.
# If prettier is installed, format with:
prettier --write src/*.js

# CSS
prettier --write style.css
```

## Deployment

```bash
# Build container image
docker build -t ghcr.io/awdemos/ferrite-core-simulator:latest .
docker push ghcr.io/awdemos/ferrite-core-simulator:latest
```

## Gotchas

- The canvas uses device-pixel-ratio scaling; test on both standard and HiDPI displays.
- Color themes are stored in exported JSON; changing default colors may break imported states.
- The Dockerfile copies only `index.html`, `style.css`, and `src/`; add new top-level assets explicitly.
