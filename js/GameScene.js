import PhysicsWorld, { physicsVector, PIXELS_PER_METER } from './physics.js';
import Rocks from './Rocks.js';

const MINER_SPEED = 120; // Pixels per second.
const JUMP_SPEED = 400; // One upward launch, in pixels per second.
// Polygons and object placements use the original map, regardless of artwork resolution.
const MAP_WIDTH = 560;
const MAP_HEIGHT = 384;
const LAVA_COLUMNS = [
  { x: 184, y: 266, width: 26, bottom: 382, period: 12000 },
  { x: 436, y: 330, width: 26, bottom: 382, period: 14000 },
];

// Positions are in background-image pixels, matched to sample.png.
const PRIZES = [
  { key: 'prize-purple', x: 83, y: 19, start: 10, end: 14, yoyo: true },
  { key: 'prize-orange', x: 391, y: 63, start: 5, end: 8 },
  { key: 'prize-blue', x: 237, y: 161, start: 20, end: 23 },
  { key: 'prize-star', x: 27, y: 183, start: 15, end: 18 },
  { key: 'prize-green', x: 349, y: 277, start: 0, end: 4, yoyo: true },
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    const text = this.add.text(32, 32, 'Loading ...', { color: '#ffffff' });
    const showProgress = progress => text.setText('Loading ...' + Math.round(progress * 100) + '%');
    this.load.on('progress', showProgress);
    this.load.once('complete', () => {
      this.load.off('progress', showProgress);
      text.destroy();
    });
    this.load.image('background', 'assets/images/background.png');
    this.load.image('lives', 'assets/images/lives.png');
    this.load.image('shovel', 'assets/images/shovel.png');
    this.load.spritesheet('bomb', 'assets/images/bomb.png', { frameWidth: 90, frameHeight: 23 });
    this.load.spritesheet('rocks', 'assets/images/rocks.png', { frameWidth: 64, frameHeight: 56 });
    this.load.spritesheet('prizes', 'assets/images/prizes.png', { frameWidth: 110, frameHeight: 55 });
    this.load.spritesheet('lava', 'assets/images/lava.png', { frameWidth: 116, frameHeight: 34, endFrame: 3 });
    this.load.json('shapeData', 'assets/json/objects.json');
    // Shared with SplashScene; also allow this scene to start independently.
    if (!this.textures.exists('miner')) {
      this.load.spritesheet('miner', 'assets/images/miner.png', { frameWidth: 44, frameHeight: 38 });
    }
  }

  create() {
    this.lives = 3;
    this.minerDead = false;
    this.gameOver = false;
    this.won = false;
    this.carryingShovel = false;
    this.shovelReturning = false;
    this.digging = null;
    this.score = 0;
    this.level = 1;
    this.isJumping = false;
    this.isFalling = false;
    this.walkFrame = 0;
    this.walkAnimationTicks = 0;
    const { width, height } = this.sys.game.config;
    this.minerSpawn = { x: width * 610 / 800, y: height * 30 / 600 };
    this.add.image(0, 0, 'background').setOrigin(0).setDisplaySize(width, height);
    this.worldScaleX = width / MAP_WIDTH;
    this.worldScaleY = height / MAP_HEIGHT;
    // Bottom-left floor position from sample.png, in original map coordinates.
    this.shovelHome = { x: 126 * this.worldScaleX, y: 373 * this.worldScaleY };
    this.shovel = this.add.sprite(this.shovelHome.x, this.shovelHome.y, 'shovel')
      .setDisplaySize(28 * this.worldScaleX, (28 * 39 / 118) * this.worldScaleY);
    this.createLivesDisplay();
    this.createScoreDisplay();
    this.createLava();
    this.createPrizes();
    this.createBombs();
    this.planckPhysics = new PhysicsWorld(this);
    this.planckPhysics.createTerrain(this.cache.json.get('shapeData').mine, this.worldScaleX, this.worldScaleY);
    const miner = this.planckPhysics.createMiner(
      this.minerSpawn.x, this.minerSpawn.y, true,
      1.1 * width / 800, 1.1 * height / 600
    );
    this.miner = miner.sprite;
    this.miner.carryingShovel = false;
    this.walkFrameCount = 5; // Frames 0–4 run; 5 jumps; 6–7 crawl.
    this.minerBody = miner.body;
    this.rockSpawner = new Rocks(this, LAVA_COLUMNS);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.fireButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.crawlButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.digButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.digWasDown = this.digButton.isDown;
    this.isCrawling = false;
    this.jumpWasDown = this.fireButton.isDown;
  }

  createBombs() {
    if (!this.anims.get('bomb-tick')) {
      this.anims.create({
        key: 'bomb-tick',
        frames: this.anims.generateFrameNumbers('bomb', { start: 0, end: 2 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    // Recessed ledges in sample.png, in original map coordinates.
    this.bombs = [{ x: 100, y: 244 }, { x: 500, y: 218 }].map(({ x, y }) => {
      const sprite = this.add.sprite(x * this.worldScaleX, y * this.worldScaleY, 'bomb')
        .setOrigin(0).setDisplaySize(56 * this.worldScaleX, 23 * this.worldScaleY).play('bomb-tick');
      const counter = this.add.text((x + 55) * this.worldScaleX, (y + 16) * this.worldScaleY, '90', {
        fontFamily: 'monospace', fontSize: '17px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(1, 0.5).setScale(this.worldScaleX, this.worldScaleY);
      return { sprite, counter, remainingMs: 90000, seconds: 90, digs: 0, deactivated: false };
    });
  }

  updateBombs(delta) {
    for (const bomb of this.bombs) {
      if (bomb.deactivated) continue;
      bomb.remainingMs = Math.max(0, bomb.remainingMs - delta);
      const seconds = Math.ceil(bomb.remainingMs / 1000);
      if (seconds !== bomb.seconds) {
        bomb.seconds = seconds;
        bomb.counter.setText(String(seconds).padStart(2, '0'));
      }
    }
  }

  createLivesDisplay() {
    const y = 368 * this.worldScaleY;
    this.livesText = this.add.text(487 * this.worldScaleX, y, String(this.lives), {
      fontFamily: 'monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setScale(this.worldScaleX, this.worldScaleY);
    this.lifeIcons = [514, 538].map(x => this.add.sprite(x * this.worldScaleX, y, 'lives')
      .setDisplaySize(20 * this.worldScaleX, (20 * 30 / 62) * this.worldScaleY));
  }

  createScoreDisplay() {
    this.scoreText = this.add.text(512 * this.worldScaleX, 342 * this.worldScaleY, String(this.score).padStart(4, '0'), {
      fontFamily: 'monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setScale(this.worldScaleX, this.worldScaleY);
  }

  setScore(score) {
    this.score = Math.max(0, Math.floor(score));
    this.scoreText.setText(String(this.score).padStart(4, '0'));
  }

  createLava() {
    if (!this.anims.get('lava-surface')) {
      this.anims.create({
        key: 'lava-surface',
        frames: this.anims.generateFrameNumbers('lava', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }
    this.lavaColumns = this.add.graphics();
    this.lavaElapsed = 0;
    this.lavaSurfaces = LAVA_COLUMNS.map(({ x, y, width, bottom }) => {
      return this.add.sprite(x * this.worldScaleX, y * this.worldScaleY, 'lava')
        .setOrigin(0, 1)
        .setScale(width * this.worldScaleX / 116, width * this.worldScaleY / 116)
        .play('lava-surface');
    });
    this.updateLava(0);
  }

  updateLava(delta) {
    this.lavaElapsed += delta;
    this.lavaColumns.clear();
    this.lavaColumns.fillStyle(0xff6a00);
    LAVA_COLUMNS.forEach(({ x, y, width, bottom, period }, index) => {
      // Ease between the existing high-water mark and a shallow pool at the bottom.
      const progress = (1 - Math.cos(2 * Math.PI * (this.lavaElapsed % period) / period)) / 2;
      const surfaceY = y + (bottom - 10 - y) * progress;
      this.lavaColumns.fillRect(
        x * this.worldScaleX, surfaceY * this.worldScaleY,
        width * this.worldScaleX, (bottom - surfaceY) * this.worldScaleY
      );
      this.lavaSurfaces[index].setY(surfaceY * this.worldScaleY);
    });
  }

  createPrizes() {
    this.prizes = PRIZES.map(({ key, x, y, start, end, yoyo = false }) => {
      if (!this.anims.get(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers('prizes', { start, end }),
          frameRate: 8,
          yoyo,
          repeat: -1,
        });
      }
      return this.add.sprite(x * this.worldScaleX, y * this.worldScaleY, 'prizes', start)
        .setScale(0.25 * this.worldScaleX, 0.25 * this.worldScaleY)
        .play(key);
    });
  }

  update(time, delta) {
    const digPressed = this.digButton.isDown && !this.digWasDown;
    this.digWasDown = this.digButton.isDown;
    if (this.won) return;
    this.updateLava(delta);
    if (this.gameOver) {
      const restart = this.fireButton.isDown && !this.jumpWasDown;
      this.jumpWasDown = this.fireButton.isDown;
      if (restart) this.scene.restart();
      return;
    }
    this.updateBombs(delta);
    if (this.minerDead) return;
    this.planckPhysics.step(delta, seconds => {
      this.updateMiner();
      this.rockSpawner.step(seconds);
    });
    this.rockSpawner.sync();
    if (this.minerDead) return;
    if (this.checkLavaContact()) return;
    this.collectPrizes();
    this.collectShovel();
    if (this.digging) this.updateDig(delta);
    else if (digPressed) this.tryDig();
  }

  collectShovel() {
    if (this.carryingShovel || this.shovelReturning || this.minerDead) return;
    const a = this.miner.getBounds();
    const b = this.shovel.getBounds();
    if (a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom) return;
    this.carryingShovel = true;
    this.miner.carryingShovel = true;
    this.shovel.setVisible(false);
  }

  returnShovel() {
    if (!this.carryingShovel) return;
    this.carryingShovel = false;
    this.miner.carryingShovel = false;
    this.shovelReturning = true;
    this.shovel.setPosition(this.miner.x, this.miner.y).setRotation(0).setVisible(true).setDepth(5);
    this.tweens.add({
      targets: this.shovel,
      x: this.shovelHome.x,
      y: this.shovelHome.y,
      rotation: Math.PI * 6,
      duration: 1200,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.shovel.setPosition(this.shovelHome.x, this.shovelHome.y).setRotation(0).setDepth(0);
        this.shovelReturning = false;
      },
    });
  }

  isOverBomb(bomb) {
    const a = this.miner.getBounds();
    const b = bomb.sprite.getBounds();
    // Allow the small contact gap between the miner's feet and the ledge top.
    return a.right > b.left && a.left < b.right
      && a.bottom >= b.top - 6 * this.worldScaleY
      && a.bottom <= b.bottom + 4 * this.worldScaleY;
  }

  tryDig() {
    if (this.minerDead || this.gameOver || this.digging || !this.carryingShovel
      || !this.isCrawling || !this.planckPhysics.isGrounded(this.minerBody)) return;
    const bomb = this.bombs.find(bomb => !bomb.deactivated && this.isOverBomb(bomb));
    if (!bomb) return;
    const tool = this.add.sprite(this.miner.x, this.miner.y, 'shovel')
      .setDisplaySize(20 * this.worldScaleX, 7 * this.worldScaleY).setDepth(5);
    this.digging = { bomb, tool, elapsed: 0 };
    this.updateDig(0);
  }

  updateDig(delta) {
    const dig = this.digging;
    dig.elapsed += delta;
    const progress = Math.min(1, dig.elapsed / 300);
    const direction = this.miner.flipX ? -1 : 1;
    const stroke = Math.sin(progress * Math.PI);
    dig.tool.setFlipX(direction > 0)
      .setPosition(this.miner.x + direction * 10 * this.worldScaleX,
        this.miner.y + (9 + stroke * 5) * this.worldScaleY)
      .setRotation(direction * (-0.5 + stroke));
    this.miner.setFrame(progress < 0.5 ? 6 : 7);
    if (progress < 1) return;
    dig.tool.destroy();
    this.digging = null;
    if (!this.isOverBomb(dig.bomb) || !this.planckPhysics.isGrounded(this.minerBody)) return;
    dig.bomb.digs++;
    if (dig.bomb.digs === 4) this.deactivateBomb(dig.bomb);
  }

  deactivateBomb(bomb) {
    bomb.deactivated = true;
    bomb.sprite.setVisible(false);
    bomb.sprite.anims.stop();
    bomb.counter.setVisible(false);
    bomb.safeText = this.add.text(bomb.sprite.x + bomb.sprite.displayWidth / 2,
      bomb.sprite.y + bomb.sprite.displayHeight / 2, 'SAFE', {
        fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold', color: '#00ff00',
      }).setOrigin(0.5).setScale(this.worldScaleX, this.worldScaleY);
    if (this.bombs.every(bomb => bomb.deactivated)) {
      this.won = true;
      this.gameOver = true;
      this.minerBody.setLinearVelocity(physicsVector(0, 0));
      const { width, height } = this.sys.game.config;
      this.add.text(width / 2, height / 2, 'GAME OVER YOU WON!', {
        fontFamily: 'monospace', fontSize: '28px', fontStyle: 'bold',
        color: '#ffffff', backgroundColor: '#000000',
      }).setOrigin(0.5).setDepth(10);
      this.time.delayedCall(3000, () => this.scene.start('SplashScene'));
    }
  }

  checkLavaContact() {
    const bounds = this.miner.getBounds();
    const touching = LAVA_COLUMNS.some(({ x, width, bottom }, index) => {
      const surface = this.lavaSurfaces[index];
      return bounds.right > x * this.worldScaleX
        && bounds.left < (x + width) * this.worldScaleX
        && bounds.bottom >= surface.y - surface.displayHeight
        && bounds.top < bottom * this.worldScaleY;
    });
    if (touching) this.killMiner();
    return touching;
  }

  killMiner() {
    if (this.minerDead || this.won) return;
    this.returnShovel();
    if (this.digging) {
      this.digging.tool.destroy();
      this.digging = null;
    }
    this.minerDead = true;
    this.miner.setVisible(false);
    this.minerBody.setLinearVelocity(physicsVector(0, 0));
    this.minerBody.setActive(false);
    this.lives--;
    this.livesText.setText(String(this.lives));
    this.lifeIcons.forEach((icon, index) => icon.setVisible(index < this.lives - 1));

    if (this.lives === 0) {
      this.gameOver = true;
      this.jumpWasDown = this.fireButton.isDown;
      const { width, height } = this.sys.game.config;
      this.add.text(width / 2, height / 2, 'GAME OVER\nPress Space to restart', {
        fontFamily: 'monospace', fontSize: '24px', color: '#ffffff',
        backgroundColor: '#000000', align: 'center',
      }).setOrigin(0.5).setDepth(10);
      return;
    }

    this.time.delayedCall(1000, () => {
      const { x, y } = this.minerSpawn;
      this.minerBody.setPosition(physicsVector(x, y));
      this.isCrawling = this.planckPhysics.setCrawling(this.minerBody, false);
      this.minerBody.setActive(true);
      this.miner.setPosition(x, y).setFlipX(true).setFrame(5).setVisible(true);
      this.walkFrame = 0;
      this.walkAnimationTicks = 0;
      this.isJumping = false;
      this.isFalling = false;
      this.jumpWasDown = this.fireButton.isDown;
      this.minerDead = false;
    });
  }

  collectPrizes() {
    const minerBounds = this.miner.getBounds();
    for (let i = this.prizes.length - 1; i >= 0; i--) {
      const prize = this.prizes[i];
      const bounds = prize.getBounds();
      if (minerBounds.right < bounds.left || minerBounds.left > bounds.right
        || minerBounds.bottom < bounds.top || minerBounds.top > bounds.bottom) continue;

      // Remove it from collection checks before awarding points.
      this.prizes.splice(i, 1);
      prize.destroy();
      this.setScore(this.score + 700);
    }
  }

  updateMiner() {
    if (this.digging) {
      this.minerBody.setLinearVelocity(physicsVector(0, this.minerBody.getLinearVelocity().y * PIXELS_PER_METER));
      this.jumpWasDown = this.fireButton.isDown;
      return;
    }
    const grounded = this.planckPhysics.isGrounded(this.minerBody);
    const crawling = this.planckPhysics.setCrawling(this.minerBody,
      this.crawlButton.isDown && (grounded || this.isCrawling));
    if (crawling !== this.isCrawling) {
      this.walkFrame = 0;
      this.walkAnimationTicks = 0;
      this.miner.setFrame(crawling ? 6 : 0);
    }
    this.isCrawling = crawling;
    let direction = 0;
    if (!this.isFalling && !this.isJumping) {
      if (this.cursors.left.isDown) direction = -1;
      if (this.cursors.right.isDown) direction = 1;
    }
    const velocity = this.minerBody.getLinearVelocity();
    let verticalSpeed = velocity.y * PIXELS_PER_METER;
    const jumpPressed = this.fireButton.isDown && !this.jumpWasDown;
    this.jumpWasDown = this.fireButton.isDown;
    if (jumpPressed && grounded && !this.isCrawling) {
      verticalSpeed = -JUMP_SPEED;
      this.planckPhysics.markJump(this.minerBody);
    }
    this.minerBody.setLinearVelocity(physicsVector(direction * MINER_SPEED * (this.isCrawling ? 0.5 : 1), verticalSpeed));
    if (direction) {
      this.miner.setFlipX(direction < 0);
      if (grounded && !(jumpPressed && !this.isCrawling)) {
        // Six physics ticks per frame: 10 animation FPS at 60 Hz.
        this.walkAnimationTicks++;
        if (this.walkAnimationTicks >= 6) {
          this.walkAnimationTicks = 0;
          this.walkFrame = (this.walkFrame + 1) % (this.isCrawling ? 2 : this.walkFrameCount);
          this.miner.setFrame(this.walkFrame + (this.isCrawling ? 6 : 0));
        }
      }
    }
  }
}
