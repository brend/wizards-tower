import { loadImage } from "./game.assets.js";

export class Entity {
  constructor(spritesheet, frameCount = 1) {
    if (frameCount < 1) throw new Error("frame count must be positive");

    this.frameCount = frameCount;
    this.x = 0;
    this.y = 0;
    this.ready = false;
    this.frame = 0;
    this.frameTime = 0;
    const animationFps = 7;
    this.frameDuration = 1.0 / animationFps;

    this.image = null;
    this.ready = false;

    loadImage(spritesheet)
      .then((image) => {
        this.image = image;
        this.ready = true;
      })
      .catch((error) => console.error(error));
  }

  get width() {
    if (!this.ready) return NaN;
    return this.image.width;
  }

  get height() {
    if (!this.ready) return NaN;
    return this.image.height;
  }

  render(context) {
    if (!this.ready) return;
    const frameWidth = this.image.width / this.frameCount;
    const frameHeight = this.image.height;
    const frameX = this.frame * frameWidth;
    const frameY = 0;
    context.drawImage(
      this.image,
      // source rectangle
      frameX,
      frameY,
      frameWidth,
      frameHeight,
      // destination rectangle
      this.x,
      this.y,
      frameWidth,
      frameHeight,
    );
  }

  update(dt) {
    if (this.speed) {
      this.x += this.speed;
    }

    this.frameTime += dt;

    while (this.frameTime >= this.frameDuration) {
      this.frameTime -= this.frameDuration;
      this.frame = (this.frame + 1) % this.frameCount;
    }
  }
}

export class StaticObject extends Entity {
  update() {}

  render(context) {
    if (!this.ready) return;
    context.drawImage(this.image, this.x, this.y);
  }
}
