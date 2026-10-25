import SplashScene from './SplashScene.js';
import GameScene from './GameScene.js';

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 500,
  backgroundColor: '#000000',
  pixelArt: true,
  scene: [SplashScene, GameScene],
});
