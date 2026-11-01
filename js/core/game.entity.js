export class Entity {
  constructor(spritesheet, frameCount) {
    this.frameCount = frameCount;
    this.x = 100;
    this.y = 100;
    this.ready = false;
    this.frame = 0;
    this.frameTime = 0;
    const animationFps = 7;
    this.frameDuration = 1.0 / animationFps;

    this.image = new Image();
    this.image.onload = () => {
      this.ready = true;
    };
    this.image.onerror = () => {
      console.error(`Failed to load image ${spritesheet}`);
    };
    this.image.src = spritesheet;
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
    this.frameTime += dt;

    while (this.frameTime >= this.frameDuration) {
      this.frameTime -= this.frameDuration;
      this.frame = (this.frame + 1) % this.frameCount;
    }
  }
}
