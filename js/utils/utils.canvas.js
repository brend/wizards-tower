export function getPixelRatio() {
  return window.devicePixelRatio || 1;
}

export function generateCanvas(width, height, zoom = 1) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const ratio = getPixelRatio();

  canvas.width = Math.round(width * zoom * ratio);
  canvas.height = Math.round(height * zoom * ratio);
  canvas.style.width = `${width * zoom}px`;
  canvas.style.height = `${height * zoom}px`;
  canvas.classList.add("game");
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
