import { generateCanvas } from "./utils/utils.canvas.js";
import { gameLoop } from "./core/game.loop.js";
import { gameUpdate } from "./core/game.update.js";
import { gameRender } from "./core/game.render.js";

function Game(width, height, showFps = true) {
  this.constants = { width, height, showFps };
  this.state = { elapsed: 0, entities: {} };

  this.viewport = generateCanvas(width, height);
  this.viewport.id = "gameViewport";
  this.viewport.setAttribute("aria-label", "Wizard's Tower: animated game loop demo");
  this.context = this.viewport.getContext("2d");
  document.getElementById("container").appendChild(this.viewport);

  this.update = gameUpdate(this);
  this.render = gameRender(this);
  this.loop = gameLoop(this);
  this.loop.start();
}

window.game = new Game(800, 600);
