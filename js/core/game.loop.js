// Render at the display's refresh rate; update receives elapsed seconds.
export function gameLoop(scope) {
  let frameId = null;
  let previousTime = null;
  let sampleTime = 0;
  let sampleFrames = 0;

  const loop = {
    fps: 0,
    start() {
      if (frameId !== null) return;
      previousTime = null;
      sampleTime = 0;
      sampleFrames = 0;
      loop.fps = 0;
      frameId = window.requestAnimationFrame(frame);
    },
    stop() {
      window.cancelAnimationFrame(frameId);
      frameId = null;
      previousTime = null;
    },
  };

  function frame(timestamp) {
    // Queue first so stop() can cancel the next frame even during an update.
    frameId = window.requestAnimationFrame(frame);
    const seconds = previousTime === null ? 0 : (timestamp - previousTime) / 1000;
    previousTime = timestamp;

    if (seconds > 0) {
      sampleTime += seconds;
      sampleFrames += 1;
      if (sampleTime >= 0.5) {
        loop.fps = Math.round(sampleFrames / sampleTime);
        sampleTime = 0;
        sampleFrames = 0;
      }
    }

    // Discard excess time after a stall or a background-tab pause.
    scope.update(Math.min(seconds, 0.05));
    scope.render();
  }

  return loop;
}
