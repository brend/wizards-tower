export function gameRender(scope) {
  const { width, height } = scope.constants;
  const context = scope.context;

  return function render() {
    context.fillStyle = "#172036";
    context.fillRect(0, 0, width, height);

    if (scope.constants.showFps) {
      context.font = "16px monospace";
      context.fillStyle = "#facc15";
      context.fillText(`${scope.loop.fps} FPS`, width - 100, 45);
    }

    const zoom = 3;

    context.save();

    // Zoom around the center of the scene.
    context.translate(width / 2, height / 2);
    context.scale(zoom, zoom);
    context.translate(-width / 2, -height / 2);

    for (const entity of Object.values(scope.state.entities)) {
      context.save();
      entity.render(context);
      context.restore();
    }

    context.restore();
  };
}
