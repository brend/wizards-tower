import { createGrayscaleImage, generateCanvas } from "./utils/utils.canvas.js";
import { Entity } from "./core/entity.js";
import { LinearAnimation } from "./core/animation.js";
import { VoicePlayer } from "./core/voice.js";
import { attackTower } from "./core/events.js";
import { Timer } from "./core/timer.js";

class Game {
  constructor(width, height, showFps = true, title = "My Game", zoom = 1) {
    this.constants = { width, height, showFps, zoom };
    this.frameId = null;
    this.previousTime = null;
    this.sampleTime = 0;
    this.sampleFrames = 0;
    this.fps = 0;
    // Keep the Game instance as `this` when the browser invokes the callback.
    this.frame = this.frame.bind(this);

    this.viewport = generateCanvas(width, height, zoom);
    this.viewport.id = "gameViewport";
    this.viewport.setAttribute("aria-label", title);
    this.context = this.viewport.getContext("2d");
    const container = document.getElementById("container");
    container.style.setProperty("--scene-aspect", width / height);
    container.appendChild(this.viewport);

    this.loadVoices();
    this.initialize();
    this.hookupControls();
  }

  loadVoices() {
    this.voices = new VoicePlayer({
      welcome: "assets/audio/wizard/cartridge/welcome.wav",
      hurt: "assets/audio/wizard/cartridge/hurt.wav",
      spell: "assets/audio/wizard/cartridge/spell.wav",
      victory: "assets/audio/wizard/cartridge/victory.wav",
      hold: "assets/audio/wizard/cartridge/hold.wav",
      itsover: "assets/audio/wizard/cartridge/itsover.wav",
    });
  }

  initialize() {
    const { width, height } = this.constants;
    const state = {};

    this.state = state;

    state.phase = "ready";
    state.elapsed = 0;
    state.enemies = new Set();
    state.projectiles = new Set();
    state.background = new Set();
    state.events = [];
    state.animations = new Set();
    state.spawnTimer = 3.0;
    state.spawnCount = 0;
    state.fireballTimer = new Timer(5);

    state.hudFireball = new Entity("assets/Fireball.png");
    state.hudFireball.x = 160 - 6 + 2;
    state.hudFireball.y = 120 + 2;

    state.hudGameOver = new Entity("assets/Itisover.png");

    const tower = new Entity("assets/Tower.png");
    const wizard = new Entity("assets/Wizard.png", 4);

    tower.x = (width - 32) / 2;
    tower.y = (height - 128) / 2;
    tower.hp = 10;

    wizard.x = tower.x + 8;
    wizard.y = tower.y + 8;
    // Wizard's hp prevent him from being de-spawned :P
    wizard.hp = 1;

    state.background.add(wizard, tower);
    state.wizard = wizard;
    state.tower = tower;
    // The tower sprite includes roots and transparent padding below ground.
    state.groundY = tower.y + 78;

    state.background.add(tower);

    for (let i = 0; i < Math.ceil(width / 16); ++i) {
      const grass = new Entity("assets/Ground-1.png");
      grass.x = 16 * i;
      grass.y = state.groundY;
      grass.hp = 1;
      state.background.add(grass);
    }

    for (let y = state.groundY + 16; y < height; y += 16) {
      for (let i = 0; i < Math.ceil(width / 16); ++i) {
        const soil = new Entity("assets/Ground-2.png");
        soil.x = 16 * i;
        soil.y = y;
        soil.hp = 1;
        state.background.add(soil);
      }
    }
  }

  hookupControls() {
    const startButton = document.getElementById("start-button");
    startButton.addEventListener("click", async () => {
      if (this.state.phase !== "ready" || startButton.disabled) return;
      startButton.disabled = true;
      startButton.textContent = "Starting…";
      try {
        // Unlock audio directly in the user gesture, before any other await.
        if (await this.voices.enable()) this.playVoice("welcome");
      } catch (error) {
        console.warn("Could not enable game sound:", error);
      } finally {
        // Audio failure should still allow play; the sound button can retry.
        document.getElementById("start-screen").hidden = true;
        this.state.phase = "paused";
        this.start();
        document.getElementById("pause-button").disabled = false;
        document.getElementById("resume-button").disabled = false;
        soundButton.disabled = false;
        this.voices.onStateChange();
        document.getElementById("pause-button").focus();
      }
    });

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

    this.viewport.addEventListener("click", (event) => {
      if (this.frameId === null) return; // Ignore clicks while paused.

      if (!this.state.fireballTimer.isOver) {
        return;
      }

      const rect = this.viewport.getBoundingClientRect();
      const x =
        ((event.clientX - rect.left) * this.constants.width) / rect.width;
      const y =
        ((event.clientY - rect.top) * this.constants.height) / rect.height;

      this.spawnFireball(this.state, x, y);
      this.state.fireballTimer.reset();
    });
  }

  start() {
    if (this.state.phase === "ready" || this.frameId !== null) return;
    this.previousTime = null;
    this.sampleTime = 0;
    this.sampleFrames = 0;
    this.fps = 0;
    this.frameId = window.requestAnimationFrame(this.frame);
    this.state.phase = "playing";
  }

  stop() {
    if (this.state.phase === "ready") return;
    window.cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.previousTime = null;
    this.state.phase = "paused";
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

    // update timers
    state.fireballTimer.advance(dt);

    // spawn orcs
    state.spawnTimer -= dt;
    while (state.spawnTimer <= 0) {
      this.spawnOrk(state);
      state.spawnTimer += 3.0;
    }

    // update entities
    for (const enemy of state.enemies) {
      enemy.update(dt);
    }

    for (const projectile of state.projectiles) {
      projectile.update(dt);
    }

    for (const object of state.background) {
      object.update(dt);
    }

    // check for collisions
    for (const a of state.projectiles) {
      for (const b of state.enemies) {
        if (!a.intersectsWith(b)) continue;
        b.hp -= a.strength;
      }
    }

    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) {
        state.enemies.delete(enemy);
      }
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
    for (const animation of this.state.animations) {
      if (animation.done) {
        this.state.animations.delete(animation);
      }
    }
    for (const animation of completed) {
      animation.onComplete?.();
    }

    // play a sound when the tower falls
    const fallenY = state.groundY - 14;
    if (originalTowerY < fallenY && state.tower.y >= fallenY) {
      this.playVoice("itsover");
      this.state.phase = "gameover";
    }
  }

  render() {
    const { width, height, showFps } = this.constants;
    const context = this.context;

    context.fillStyle = "#172036";
    context.fillRect(0, 0, width, height);

    if (showFps) {
      context.font = "6px monospace";
      context.fillStyle = "#facc15";
      context.fillText(`${this.fps} FPS`, width - 32, 10);
    }

    context.save();

    for (const background of this.state.background) {
      context.save();
      background.render(context);
      context.restore();
    }

    for (const entity of this.state.enemies) {
      context.save();
      entity.render(context);
      context.restore();
    }

    for (const projectile of this.state.projectiles) {
      context.save();
      projectile.render(context);
      context.restore();
    }

    this.renderHud(context);

    context.restore();
  }

  renderHud(context) {
    const { hudFireball, fireballTimer } = this.state;
    if (!hudFireball.ready) return;

    const remaining = Math.min(1, Math.max(0, fireballTimer.remainingFraction));
    if (remaining === 0) {
      hudFireball.render(context);
    } else {
      this.state.hudFireballGray ??= createGrayscaleImage(hudFireball.image);
      const width = hudFireball.width / hudFireball.frameCount;
      const height = hudFireball.height;
      const centerX = hudFireball.x + width / 2;
      const centerY = hudFireball.y + height / 2;
      // Extend the sector past the corners of the rectangular sprite.
      const radius = Math.hypot(width, height) / 2 + 1;
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + Math.PI * 2;
      const sweepAngle = startAngle + Math.PI * 2 * (1 - remaining);

      const drawSector = (image, from, to) => {
        context.save();
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.arc(centerX, centerY, radius, from, to);
        context.closePath();
        context.clip();
        context.drawImage(
          image,
          hudFireball.frame * width,
          0,
          width,
          height,
          hudFireball.x,
          hudFireball.y,
          width,
          height,
        );
        context.restore();
      };

      // Reveal color clockwise from twelve o'clock as the cooldown expires.
      if (remaining < 1) {
        drawSector(hudFireball.image, startAngle, sweepAngle);
      }
      drawSector(this.state.hudFireballGray, sweepAngle, endAngle);
    }

    // Render game over message
    if (this.state.phase === "gameover" && this.state.hudGameOver.ready) {
      this.state.hudGameOver.render(context);
    }
  }

  addAnimation(animation) {
    this.state.animations.add(animation);
  }

  processEvent(e) {
    switch (e?.type) {
      case "attackTower":
        this.state.tower.hp -= e.strength;
        this.state.tower.y += e.strength * 8;
        this.state.wizard.y += e.strength * 8;

        const effect = new Entity("assets/Ouch.png");
        effect.x = this.state.tower.x - 4;
        effect.y = this.state.groundY - 30;
        effect.vx = Math.random() * 0.4 - 0.2;
        this.state.background.add(effect);
        const animation = new LinearAnimation(effect, -8, -64, 2.0);
        animation.onComplete = () => this.state.background.delete(effect);
        this.addAnimation(animation);
    }
  }

  spawnOrk(state) {
    const ork = new Entity("assets/Ork.png", 2);
    ork.x = 0;
    ork.y = state.groundY - 14;
    ork.vx = 0.5;
    ork.targetX = state.tower.x - 8 + 8 * Math.random() - 4;
    ork.attackInterval = 1;
    ork.attackStrength = 1;
    ork.timeSinceLastAttack = 0;
    ork.hp = 10;
    ork.maxHp = 10;

    ork.afterUpdateBehaviors.push((_dt, entity) => {
      if (entity.x >= entity.targetX && entity.vx !== 0) {
        entity.vx = 0;
        entity.timeSinceLastAttack = 0;
      }
    });
    ork.afterUpdateBehaviors.push((dt, entity) => {
      if (entity.x >= entity.targetX) {
        entity.timeSinceLastAttack += dt;
        while (entity.timeSinceLastAttack >= entity.attackInterval) {
          state.events.push(attackTower(entity.attackStrength));
          entity.timeSinceLastAttack -= entity.attackInterval;
        }
      }
    });
    state.enemies.add(ork);

    if (state.spawnCount === 0) {
      this.playVoice("hold");
    }

    state.spawnCount += 1;
  }

  spawnFireball(state, destX, destY) {
    const fireball = new Entity("assets/Fireball.png");
    fireball.x = state.wizard.x + 8;
    fireball.y = state.wizard.y;
    fireball.w = 8;
    fireball.h = 8;
    const dx = destX - fireball.x - fireball.w / 2;
    const dy = destY - fireball.y - fireball.h / 2;
    const len = dx * dx + dy * dy;
    fireball.vx = 200 * (dx / len);
    fireball.vy = 200 * (dy / len);
    fireball.strength = 1;
    state.projectiles.add(fireball);
    this.playVoice("spell");
  }

  playVoice(name) {
    this.voices.play(name).catch((error) => {
      console.warn(`Could not play wizard voice "${name}":`, error);
    });
  }
}

window.game = new Game(320, 180, true, "Wizard's Tower", 5);
