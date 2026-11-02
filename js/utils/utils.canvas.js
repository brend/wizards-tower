export function getPixelRatio() {
  return window.devicePixelRatio || 1;
}

export function generateCanvas(width, height) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const ratio = getPixelRatio();

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  // Drawing coordinates remain in logical pixels on high-density displays.
  context.setTransform(
    canvas.width / width,
    0,
    0,
    canvas.height / height,
    0,
    0,
  );
  context.imageSmoothingEnabled = false;

  return canvas;
}
