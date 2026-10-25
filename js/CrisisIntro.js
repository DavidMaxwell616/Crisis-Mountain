// Outline coordinates follow the CRISIS lettering in the 560 x 384 title art.
const LETTERS = [
  [[208, 115], [113, 115], [113, 154], [208, 154]],
  [[221, 154], [221, 115], [316, 115], [316, 132], [250, 132], [316, 154]],
  [[327, 115], [327, 154]],
  [[436, 115], [337, 115], [337, 132], [435, 132], [435, 154], [337, 154]],
  [[445, 115], [445, 154]],
  [[559, 115], [459, 115], [459, 132], [558, 132], [558, 154], [459, 154]],
];
const ORDER = [0, 5, 1, 4, 2, 3];
const LETTER_DURATION = 850;
const HOLD_DURATION = 450;

export default class CrisisIntro {
  constructor(scene) {
    this.graphics = scene.add.graphics();
    this.width = scene.sys.game.config.width;
    this.height = scene.sys.game.config.height;
    this.elapsed = 0;
    this.draw();
  }

  update(delta) {
    this.elapsed += delta;
    this.draw();
    return this.elapsed >= ORDER.length * LETTER_DURATION + HOLD_DURATION;
  }

  drawOutline(points, depth, color) {
    const g = this.graphics;
    const scaleX = this.width / 560;
    const scaleY = this.height / 384;
    // Each letter travels from the mountain's peak to its final title position.
    const apexX = 335;
    const apexY = 12;
    g.lineStyle(Math.max(4, 3 * scaleX), color, 1);
    g.beginPath();
    points.forEach(([x, y], index) => {
      const px = Math.round((apexX + (x - apexX) * depth) * scaleX);
      const py = Math.round((apexY + (y - apexY) * depth) * scaleY);
      if (index === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    });
    g.strokePath();
  }

  draw() {
    this.graphics.clear();
    ORDER.forEach((letter, index) => {
      const progress = Math.min(1, Math.max(0, (this.elapsed - index * LETTER_DURATION) / LETTER_DURATION));
      if (progress === 0) return;
      const depth = Math.min(1, progress / 0.85);
      // Discrete outlines give the original's stepped, blue extrusion effect.
      for (let slice = 1; slice <= Math.floor(depth * 32); slice++) {
        this.drawOutline(LETTERS[letter], slice / 32, 0x2424ff);
      }
    });
    // Draw completed white faces last so later trails cannot cover them.
    ORDER.forEach((letter, index) => {
      if (this.elapsed >= (index + 1) * LETTER_DURATION) {
        this.drawOutline(LETTERS[letter], 1, 0xffffff);
      }
    });
  }

  destroy() {
    this.graphics.destroy();
  }
}
