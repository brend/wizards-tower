export function gameRender(scope) {
  const { width, height } = scope.constants;
  const context = scope.context;

  return function render() {
    context.fillStyle = "#172036";
    context.fillRect(0, 0, width, height);

    context.font = "28px Helvetica, sans-serif";
    context.fillStyle = "#ffffff";
    context.fillText("It's dangerous to go alone.", 24, 48);

    if (scope.constants.showFps) {
      context.font = "16px monospace";
      context.fillStyle = "#facc15";
      context.fillText(`${scope.loop.fps} FPS`, width - 100, 45);
    }

    // A temporary demo: the square moves using time accumulated in update().
    const size = 24;
    const x = (width - size) / 2 + Math.sin(scope.state.elapsed) * width / 3;
    context.fillStyle = "#40d870";
    context.fillRect(x, (height - size) / 2, size, size);

    for (const entity of Object.values(scope.state.entities)) {
      context.save();
      entity.render();
      context.restore();
    }
  };
}
