import { generateCanvas } from "./utils/utils.canvas.js";
import { gameLoop } from "./core/game.loop.js";
import { gameUpdate } from "./core/game.update.js";
import { gameRender } from "./core/game.render.js";
import { Entity, StaticObject } from "./core/game.entity.js";

class Game {
  constructor(width, height, showFps = true) {
    this.constants = { width, height, showFps };
    this.state = { elapsed: 0, entities: {} };

    this.viewport = generateCanvas(width, height);
    this.viewport.id = "gameViewport";
    this.viewport.setAttribute("aria-label", "Wizard's Tower");
    this.context = this.viewport.getContext("2d");
    document.getElementById("container").appendChild(this.viewport);

    this.initialize();

    this.update = gameUpdate(this);
    this.render = gameRender(this);
    this.loop = gameLoop(this);
    this.loop.start();
  }

  initialize() {
    const state = this.state;
    const tower = new Entity("assets/Tower.png");
    const wizard = new Entity("assets/Wizard.png", 4);
    const ork = new Entity("assets/Ork.png", 2);

    tower.x = (800 - 32) /*tower.width*/ / 2;
    tower.y = (600 - 128) /*tower.height*/ / 2;

    wizard.x = tower.x + 8;
    wizard.y = tower.y + 8;

    ork.x = 300;
    ork.y = 300;
    ork.speed = 0.5;

    state.entities = [wizard, ork, tower];

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
}

window.game = new Game(800, 600);
