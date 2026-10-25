import PhysicsWorld, { physicsVector, PIXELS_PER_METER } from './physics.js';
import CrisisIntro from './CrisisIntro.js';

export default class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
  }

  preload() {
    const text = this.add.text(32, 32, 'Loading ...', { color: '#ffffff' });
    const showProgress = progress => text.setText('Loading ...' + Math.round(progress * 100) + '%');
    this.load.on('progress', showProgress);
    this.load.once('complete', () => {
      this.load.off('progress', showProgress);
      text.destroy();
    });
    this.load.image('pre-splash', 'assets/images/pre_splash.png');
    this.load.image('title', 'assets/images/mountain_title.png');
    this.load.image('ground', 'assets/images/splash_ground.png');
    this.load.image('mountain', 'assets/images/mountain.png');
    this.load.image('maxxdaddy', 'assets/images/maxxdaddy.gif');
    this.load.spritesheet('miner', 'assets/images/miner.png', { frameWidth: 44, frameHeight: 38 });
  }

  create() {
    const { width, height } = this.sys.game.config;
    this.showingPreSplash = true;
    this.crisisIntro = null;
    this.crisisIntroComplete = false;
    this.events.once('shutdown', () => {
      if (this.crisisIntro) this.crisisIntro.destroy();
      this.crisisIntro = null;
    });
    const preSplash = this.add.image(0, 0, 'pre-splash').setOrigin(0).setDisplaySize(width, height);
    this.time.delayedCall(3000, () => {
      preSplash.destroy();
      this.crisisIntro = new CrisisIntro(this);
      this.showingPreSplash = false;
    });
  }

  showMainSplash() {
    const { width, height } = this.sys.game.config;
    this.starting = false;
    this.jumping = false;
    this.walkFrame = 0;
    this.walkAnimationTicks = 0;
    const layoutScaleY = height / 600;
    const ground = this.add.image(0, height * 0.8, 'ground').setOrigin(0).setDisplaySize(width, height * 0.1);
    this.groundReveal = this.make.graphics({ x: 0, y: 0, add: false });
    this.groundRevealMask = this.groundReveal.createGeometryMask();
    ground.setMask(this.groundRevealMask);
    this.groundRevealX = 0;
    this.groundTop = ground.y;
    this.groundBottom = ground.y + ground.displayHeight;
    // The green baseline begins at source row 33, below the credit lettering.
    this.groundLineY = ground.y + 33 * ground.scaleY;
    this.drawGroundReveal();
    const mountain = this.add.image(width * 0.2, 14 * layoutScaleY - 1, 'mountain').setOrigin(0).setDisplaySize(width * 0.8, 165 * layoutScaleY).setDepth(2);
    const title = this.add.image(0, 130 * layoutScaleY, 'title').setOrigin(0).setDisplaySize(width, height / 2);
    this.titleReveal = this.make.graphics({ x: 0, y: 0, add: false });
    this.titleRevealMask = this.titleReveal.createGeometryMask();
    mountain.setMask(this.titleRevealMask);
    title.setMask(this.titleRevealMask);
    this.titleRevealTop = Math.min(mountain.y, title.y);
    this.titleRevealBottom = Math.max(mountain.y + mountain.displayHeight, title.y + title.displayHeight);
    this.titleRevealElapsed = 0;
    this.updateTitleReveal(0);

    this.planckPhysics = new PhysicsWorld(this);
    const miner = this.planckPhysics.createMiner(20, this.groundLineY - 23, false);
    this.miner = miner.sprite;
    this.walkFrameCount = 5; // Frames 0–4 run; 5 jumps; 6–7 crawl.
    this.minerBody = miner.body;
    this.planckPhysics.createStaticBox(width / 2, this.groundLineY + 2.5, width, 5);
    const lettersTop = ground.y + 13 * ground.scaleY;
    const lettersHeight = 18 * ground.scaleY;
    this.planckPhysics.createStaticBox(width * 0.5125, lettersTop + lettersHeight / 2, width * 0.625, lettersHeight);
    this.add.image(width * 0.98, height * 0.98, 'maxxdaddy').setOrigin(1);
    this.fireButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.once('pointerdown', this.startGame, this);
    this.events.once('shutdown', () => {
      this.input.off('pointerdown', this.startGame, this);
      ground.clearMask();
      this.groundRevealMask.destroy();
      this.groundReveal.destroy();
      mountain.clearMask();
      title.clearMask();
      this.titleRevealMask.destroy();
      this.titleReveal.destroy();
    });
  }

  drawGroundReveal() {
    const width = this.sys.game.config.width;
    this.groundReveal.clear();
    this.groundReveal.fillStyle(0xffffff);
    this.groundReveal.fillRect(0, this.groundLineY, width, this.groundBottom - this.groundLineY);
    this.groundReveal.fillRect(0, this.groundTop, this.groundRevealX, this.groundLineY - this.groundTop);
  }

  updateGroundReveal(x) {
    const revealedX = Math.max(this.groundRevealX, Math.min(this.sys.game.config.width, x));
    if (revealedX === this.groundRevealX) return;
    this.groundRevealX = revealedX;
    this.drawGroundReveal();
  }

  updateTitleReveal(delta) {
    const { width, height } = this.sys.game.config;
    this.titleRevealElapsed = Math.min(2400, this.titleRevealElapsed + delta);
    const bottom = this.titleRevealBottom;
    const revealedHeight = (bottom - this.titleRevealTop) * this.titleRevealElapsed / 2400;
    this.titleReveal.clear();
    this.titleReveal.fillStyle(0xffffff);
    this.titleReveal.fillRect(0, bottom - revealedHeight, width, revealedHeight);
  }

  update(time, delta) {
    if (this.showingPreSplash) return;
    if (this.crisisIntro && !this.crisisIntroComplete) {
      if (this.crisisIntro.update(delta)) {
        this.crisisIntroComplete = true;
        this.showMainSplash();
        this.crisisIntro.graphics.setDepth(1);
      }
      return;
    }
    if (this.starting) return;
    if (this.titleRevealElapsed < 2400) this.updateTitleReveal(delta);
    if (this.fireButton.isDown) {
      this.startGame();
      return;
    }
    this.planckPhysics.step(delta, () => {
      const position = this.minerBody.getPosition();
      const x = position.x * PIXELS_PER_METER;
      let verticalSpeed = this.minerBody.getLinearVelocity().y * PIXELS_PER_METER;
      if (x > this.sys.game.config.width - 20) {
        this.minerBody.setPosition(physicsVector(20, position.y * PIXELS_PER_METER));
      }
      if ((Math.abs(125 - x) < 2 || Math.abs(625 - x) < 2) && !this.jumping) {
        verticalSpeed -= 400;
        this.planckPhysics.markJump(this.minerBody);
        this.jumping = true;
      } else {
        this.jumping = false;
      }
      this.minerBody.setLinearVelocity(physicsVector(120, verticalSpeed));
      if (this.planckPhysics.isGrounded(this.minerBody)) {
        // Six physics ticks per frame: 10 animation FPS at 60 Hz.
        this.walkAnimationTicks++;
        if (this.walkAnimationTicks >= 6) {
          this.walkAnimationTicks = 0;
          this.walkFrame = (this.walkFrame + 1) % this.walkFrameCount;
          this.miner.setFrame(this.walkFrame);
        }
      }
    });
    this.updateGroundReveal(this.miner.x);
  }

  startGame() {
    if (this.showingPreSplash || !this.crisisIntroComplete || this.starting) return;
    this.starting = true;
    this.scene.start('GameScene');
  }
}
