var container = document.getElementById("container");

function Game() {
  this.viewport = document.createElement("canvas");
  this.context = this.viewport.getContext("2d");

  this.viewport.width = 800;
  this.viewport.height = 600;

  container.insertBefore(this.viewport, container.firstChild);

  this.context.font = "32px Helvetica";
  this.context.fillText("It's dangerous to go alone.", 5, 50, 800);

  return this;
}

window.game = new Game();

module.exports = game;
