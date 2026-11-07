import { generateCanvas } from "./utils/utils.canvas.js";
import { Entity } from "./core/entity.js";
import { LinearAnimation } from "./core/animation.js";
import { VoicePlayer } from "./core/voice.js";
import { attackTower } from "./core/events.js";
import { CollisionLayer } from "./core/collision.js";

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

    this.voices = new VoicePlayer({
      welcome: "assets/audio/wizard/cartridge/welcome.wav",
      hurt: "assets/audio/wizard/cartridge/hurt.wav",
      spell: "assets/audio/wizard/cartridge/spell.wav",
      victory: "assets/audio/wizard/cartridge/victory.wav",
      hold: "assets/audio/wizard/cartridge/hold.wav",
      itsover: "assets/audio/wizard/cartridge/itsover.wav",
    });

    this.initialize();

    this.start();

    this.hookupControls();
  }

  initialize() {
    const state = this.state;

    state.events = [];
    state.animations = [];
    state.spawnTimer = 3.0;
    state.spellSpawnTimer = 5.0;
    state.spawnCount = 0;

    const tower = new Entity("assets/Tower.png");
    const wizard = new Entity("assets/Wizard.png", 4);

    tower.x = (800 - 32) /*tower.width*/ / 2;
    tower.y = (600 - 128) /*tower.height*/ / 2;
    tower.hp = 10;

    wizard.x = tower.x + 8;
    wizard.y = tower.y + 8;

    state.entities = [wizard, tower];
    state.wizard = wizard;
    state.tower = tower;

    for (let i = 0; i < 80; ++i) {
      const grass = new Entity("assets/Ground-1.png");
      grass.x = 200 + 16 * i;
      grass.y = 314;
      state.entities.push(grass);
    }

    for (let j = 0; j < 10; ++j) {
      for (let i = 0; i < 80; ++i) {
        const soil = new Entity("assets/Ground-2.png");
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

    const soundButton = document.getElementById("sound-button");
    this.voices.onStateChange = () => {
      soundButton.textContent = this.voices.ready
        ? "Mute sound"
        : "Enable sound";
      soundButton.setAttribute("aria-pressed", String(this.voices.ready));
    };
    soundButton.addEventListener("click", async () => {
      if (this.voices.ready) {
        this.voices.disable();
        return;
      }
      soundButton.disabled = true;
      try {
        // resume() runs immediately in this click, not in a timer or game frame.
        if (await this.voices.enable()) {
          // If the first ork already arrived silently, greet the player now.
          if (this.state.spawnCount > 0) this.playVoice("hold");
        }
      } catch (error) {
        console.warn("Could not enable game sound:", error);
      } finally {
        soundButton.disabled = false;
        this.voices.onStateChange();
      }
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
    const seconds =
      this.previousTime === null ? 0 : (timestamp - this.previousTime) / 1000;
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

    const originalTowerY = state.tower.y;

    // spawn orcs
    state.spawnTimer -= dt;
    while (state.spawnTimer <= 0) {
      this.spawnOrk(state);
      state.spawnTimer += 3.0;
    }

    // spawn fireballs
    state.spellSpawnTimer -= dt;
    while (state.spellSpawnTimer <= 0) {
      this.spawnFireball(state);
      state.spellSpawnTimer += 5.0;
    }

    // update entities
    for (const entity of Object.values(state.entities)) {
      entity.update(dt, (event) => this.emitEvent(event));
    }

    // check for collisions
    let layer = 1;
    while (layer <= CollisionLayer.MAX) {
      for (const a of state.entities) {
        if (!a.collisionMask) continue;
        for (const b of state.entities) {
          if (!(a.collisionMask & b.collisionLayer)) continue;
          if (!a.intersectsWith(b)) continue;
          console.log(a, "collided with", b);
        }
      }

      layer <<= 1;
    }

    // process events, e.g. attacks
    while (state.events.length > 0) {
      const e = state.events.shift();
      this.processEvent(e);
    }

    // update animations
    const completed = [];
    for (const animation of this.state.animations) {
      animation.update(dt);
      if (animation.done) {
        completed.push(animation);
      }
    }
    state.animations = state.animations.filter((a) => !a.done);
    for (const animation of completed) {
      animation.onComplete?.();
    }

    // play a sound when the tower falls
    if (originalTowerY < 300 && state.tower.y >= 300) {
      this.playVoice("itsover");
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

  addEntity(entity) {
    this.state.entities.push(entity);
  }

  removeEntity(entity) {
    this.state.entities = this.state.entities.filter((e) => e !== entity);
  }

  addAnimation(animation) {
    this.state.animations.push(animation);
  }

  processEvent(e) {
    switch (e?.type) {
      case "attackTower":
        this.state.tower.hp -= e.strength;
        this.state.tower.y += e.strength * 8;
        this.state.wizard.y += e.strength * 8;

        const effect = new Entity("assets/Ouch.png");
        effect.x = 400 - 20;
        effect.y = 284;
        this.addEntity(effect);
        const animation = new LinearAnimation(effect, -8, -64, 2.0);
        animation.onComplete = () => this.removeEntity(effect);
        this.addAnimation(animation);
    }
  }

  spawnOrk(state) {
    const ork = new Entity("assets/Ork.png", 2);
    ork.x = 200;
    ork.y = 300;
    ork.vx = 0.5;
    ork.targetX = 400 - 24 + 8 * Math.random() - 4;
    ork.attackInterval = 1;
    ork.attackStrength = 1;
    ork.timeSinceLastAttack = 0;
    ork.collisionLayer = CollisionLayer.ENEMY;

    ork.afterUpdateBehaviors.push((_dt, _emit, entity) => {
      if (entity.x >= entity.targetX && entity.vx !== 0) {
        entity.vx = 0;
        entity.timeSinceLastAttack = 0;
      }
    });
    ork.afterUpdateBehaviors.push((dt, emit, entity) => {
      if (entity.x >= entity.targetX) {
        entity.timeSinceLastAttack += dt;
        while (entity.timeSinceLastAttack >= entity.attackInterval) {
          emit(attackTower(entity.attackStrength));
          entity.timeSinceLastAttack -= entity.attackInterval;
        }
      }
    });
    state.entities.push(ork);

    if (state.spawnCount === 0) {
      this.playVoice("hold");
    }

    state.spawnCount += 1;
  }

  spawnFireball(state) {
    const fireball = new Entity("assets/Fireball.png");
    fireball.x = 400;
    fireball.y = 200;
    fireball.w = 8;
    fireball.h = 8;
    fireball.collisionLayer = CollisionLayer.PROJECTILE;
    fireball.collisionMask = CollisionLayer.ENEMY;
    state.entities.push(fireball);
    this.playVoice("spell");
    const animation = new LinearAnimation(fireball, -100, 108, 1.0);
    animation.onComplete = () => this.removeEntity(fireball);
    this.addAnimation(animation);
  }

  playVoice(name) {
    this.voices.play(name).catch((error) => {
      console.warn(`Could not play wizard voice "${name}":`, error);
    });
  }
}

window.game = new Game(800, 600);
