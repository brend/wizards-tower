export class LinearAnimation {
  constructor(object, dx, dy, duration) {
    this.object = object;
    this.dx = dx / duration;
    this.dy = dy / duration;
    this.duration = duration;
    this.elapsed = 0.0;
  }

  update(dt) {
    this.object.x += dt * this.dx;
    this.object.y += dt * this.dy;
    this.elapsed += dt;
  }

  get done() {
    return this.elapsed >= this.duration;
  }
}
