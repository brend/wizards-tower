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

    for (const entity of Object.values(scope.state.entities)) {
      context.save();
      entity.render(context);
      context.restore();
    }
  };
}
