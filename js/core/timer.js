export class Timer {
  constructor(interval) {
    const n = Number(interval);
    if (isNaN(n)) throw new Error("Timer interval must be a number");
    this.interval = n;
    this.remaining = n;
  }

  advance(dt) {
    this.remaining -= dt;
  }

  get isOver() {
    return this.remaining <= 0;
  }

  get remainingFraction() {
    const f = this.remaining / this.interval;
    return f < 0 ? 0 : f;
  }

  reset() {
    this.remaining = this.interval;
  }
}
