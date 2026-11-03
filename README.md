# Wizard's Tower

A small canvas game loop with native JavaScript modules. No build step or npm dependencies.

## Run locally

From this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000. Use a local server instead of opening index.html as a file, because the browser loads JavaScript modules over HTTP.

You should see a tower, a wizard, an approaching ork, terrain, and a live FPS counter.

## How it works

- `js/game.js` contains the `Game` class, which creates the canvas, initializes the scene, and owns the game loop.
- `Game.start()` and `Game.stop()` resume and pause the loop.
- `Game.frame(timestamp)` schedules the next frame, measures time and FPS, then calls `update(dt)` followed by `render()`.
- `Game.update(dt)` advances entities and processes their events. Its `dt` argument is seconds since the previous frame, capped at 0.05 after long pauses.
- `Game.render()` draws the background, FPS counter, and entities.
- `js/core/game.entity.js` defines the entities and their individual update and render behavior.
- `js/utils/utils.canvas.js` handles high-density canvas resolution.

There is no target-FPS throttle: rendering follows the display refresh rate, while sprite animation uses elapsed time. The counter measures rendered frames per second.

In the browser console, `game.stop()` pauses and `game.start()` resumes. The Pause and Resume buttons call these same methods. Repeated starts do not create extra loops.

For future entities, add objects to `game.state.entities`, each with `update(dt, emit)` and `render(context)` methods. `Game.update()` mutates state in place, and entities can use `emit(event)` to queue events for the game to process.
