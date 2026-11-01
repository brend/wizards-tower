# Wizard's Tower

A small canvas game loop with native JavaScript modules. No build step or npm dependencies.

## Run locally

From this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000. Use a local server instead of opening index.html as a file, because the browser loads JavaScript modules over HTTP.

You should see a green square moving left and right and a live FPS counter.

## How it works

- `js/game.js` creates the canvas and connects the modules.
- `js/core/game.loop.js` schedules frames, measures time, and calls update then render.
- `js/core/game.update.js` advances game state. Its `dt` argument is seconds since the previous frame, capped at 0.05 after long pauses.
- `js/core/game.render.js` draws the current state. The moving square is a temporary demo you can replace with your player.
- `js/utils/utils.canvas.js` handles high-density canvas resolution.

There is no target-FPS throttle: rendering follows the display refresh rate, while movement uses elapsed time. The counter measures rendered frames per second.

In the browser console, `game.loop.stop()` pauses and `game.loop.start()` resumes. Repeated starts do not create extra loops.

For future entities, add objects to `game.state.entities`, each with `update(dt)` and `render()` methods. The update module mutates state in place.
