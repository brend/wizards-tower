import { generateCanvas } from "./utils/utils.canvas.js";
import { Entity, StaticObject, Ork } from "./core/game.entity.js";

class Game {
  constructor(width, height, showFps = true) {
    this.constants = { width, height, showFps };
    this.state = { elapsed: 0, entities: {} };
    this.frameId = null;
    this.previousTime = null;
    this.sampleTime = 0;
    this.sampleFrames = 0;
    this.fps = 0;
    // Keep the Game instance as `this` when the browser invokes the callback.
    this.frame = this.frame.bind(this);

    this.viewport = generateCanvas(width, height);
    this.viewport.id = "gameViewport";
    this.viewport.setAttribute("aria-label", "Wizard's Tower");
    this.context = this.viewport.getContext("2d");
    document.getElementById("container").appendChild(this.viewport);

    this.initialize();

    this.start();

    this.hookupControls();
  }

  initialize() {
    const state = this.state;

    state.events = [];

    const tower = new Entity("assets/Tower.png");
    const wizard = new Entity("assets/Wizard.png", 4);
    const ork = new Ork("assets/Ork.png", 2);

    tower.x = (800 - 32) /*tower.width*/ / 2;
    tower.y = (600 - 128) /*tower.height*/ / 2;

    wizard.x = tower.x + 8;
    wizard.y = tower.y + 8;

    ork.x = 300;
    ork.y = 300;
    ork.speed = 0.5;

    state.entities = [wizard, tower, ork];

    for (let i = 0; i < 80; ++i) {
      const grass = new StaticObject("assets/Ground-1.png");
      grass.x = 200 + 16 * i;
      grass.y = 314;
      state.entities.push(grass);
    }

    for (let j = 0; j < 10; ++j) {
      for (let i = 0; i < 80; ++i) {
        const soil = new StaticObject("assets/Ground-2.png");
        soil.x = 200 + 16 * i;
        soil.y = 314 + 16 * (j + 1);
        state.entities.push(soil);
      }
    }
  }

  hookupControls() {
    document.getElementById("pause-button").addEventListener("click", () => {
      this.stop();
    });

    document.getElementById("resume-button").addEventListener("click", () => {
      this.start();
    });
  }

  start() {
    if (this.frameId !== null) return;
    this.previousTime = null;
    this.sampleTime = 0;
    this.sampleFrames = 0;
    this.fps = 0;
    this.frameId = window.requestAnimationFrame(this.frame);
  }

  stop() {
    window.cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.previousTime = null;
  }

  // Render at the display's refresh rate; update receives elapsed seconds.
  frame(timestamp) {
    // Queue first so stop() can cancel the next frame even during an update.
    this.frameId = window.requestAnimationFrame(this.frame);
    const seconds = this.previousTime === null
      ? 0
      : (timestamp - this.previousTime) / 1000;
    this.previousTime = timestamp;

    if (seconds > 0) {
      this.sampleTime += seconds;
      this.sampleFrames += 1;
      if (this.sampleTime >= 0.5) {
        this.fps = Math.round(this.sampleFrames / this.sampleTime);
        this.sampleTime = 0;
        this.sampleFrames = 0;
      }
    }

    // Discard excess time after a stall or a background-tab pause.
    this.update(Math.min(seconds, 0.05));
    this.render();
  }

  update(dt) {
    const state = this.state;

    // dt is seconds, so animation speed does not depend on refresh rate.
    state.elapsed += dt;

    for (const entity of Object.values(state.entities)) {
      entity.update(dt, (event) => this.emitEvent(event));
    }

    let e = state.events.shift();
    while (e) {
      console.log("Oh look:", e);
      e = state.events.shift();
    }
  }

  render() {
    const { width, height, showFps } = this.constants;
    const context = this.context;

    context.fillStyle = "#172036";
    context.fillRect(0, 0, width, height);

    if (showFps) {
      context.font = "16px monospace";
      context.fillStyle = "#facc15";
      context.fillText(`${this.fps} FPS`, width - 100, 45);
    }

    const zoom = 3;

    context.save();

    // Zoom around the center of the scene.
    context.translate(width / 2, height / 2);
    context.scale(zoom, zoom);
    context.translate(-width / 2, -height / 2);

    for (const entity of Object.values(this.state.entities)) {
      context.save();
      entity.render(context);
      context.restore();
    }

    context.restore();
  }

  emitEvent(e) {
    this.state.events.push(e);
  }
}

window.game = new Game(800, 600);
