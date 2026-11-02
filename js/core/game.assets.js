const images = new Map();

export function loadImage(src) {
  if (!images.has(src)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image ${src}`));
      image.src = src;
    });

    images.set(src, promise);
  }

  return images.get(src);
}
