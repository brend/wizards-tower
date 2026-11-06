import { loadImage } from "./assets.js";
import { attackTower } from "./events.js";

export class Entity {
  constructor(spritesheet, frameCount = 1) {
    if (frameCount < 1) throw new Error("frame count must be positive");

    this.frameCount = frameCount;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
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

  update(dt, _emit) {
    this.x += this.vx;
    this.y += this.vy;
    this.frameTime += dt;

    while (this.frameTime >= this.frameDuration) {
      this.frameTime -= this.frameDuration;
      this.frame = (this.frame + 1) % this.frameCount;
    }
  }
}

export class Ork extends Entity {
  constructor(spritesheet, frameCount = 1) {
    super(spritesheet, frameCount);
    this.attackInterval = 1.0;
    this.attackStrength = 1.0;
    this.timeSinceLastAttack = 0.0;
  }

  update(dt, emit) {
    super.update(dt);

    if (this.hasArrived()) {
      if (this.vx) {
        this.stopAdvance();
        this.timeSinceLastAttack = 0;
      }

      this.timeSinceLastAttack += dt;
      while (this.timeSinceLastAttack >= this.attackInterval) {
        this.attack(emit);
        this.timeSinceLastAttack -= this.attackInterval;
      }
    }
  }

  hasArrived() {
    return this.x >= this.targetX;
  }

  stopAdvance() {
    this.vx = 0;
  }

  attack(emit) {
    emit(attackTower(this.attackStrength));
  }
}
