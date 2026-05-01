import { BaseScene } from './BaseScene';

export class CreditsScene extends BaseScene {
  constructor(config) {
    super('CreditsScene', { ...config, canGoBack: true });
  }

  create() {
    super.create();

    const titleSize = Math.max(24, Math.min(48, this.config.width / 20));
    const titleOffset = Math.max(60, Math.min(120, this.config.height / 6));

    const title = this.add.text(
      this.screenCenter[0],
      this.screenCenter[1] - titleOffset,
      'CREDITS',
      {
        font: `${titleSize}px "Press Start 2P"`,
        fill: '#00ff00',
        stroke: '#000000',
        strokeThickness: Math.max(3, titleSize / 16),
        shadow: {
          offsetX: Math.max(1, titleSize / 24),
          offsetY: Math.max(1, titleSize / 24),
          color: '#0ff',
          blur: Math.max(4, titleSize / 12),
          stroke: true,
          fill: true
        }
      }
    ).setOrigin(0.5);

    this.createGlitchEffect(title);

    const entrySize = Math.max(12, Math.min(20, this.config.width / 50));
    const lineHeight = entrySize * 2.2;
    const startY = this.screenCenter[1] - lineHeight * 0.5;

    const creditEntries = [
      { text: 'GLITCH WARS', color: '#00ffff' },
      { text: 'A GAME BY MOURYA6', color: '#00ff00' },
      { text: 'MOURYA GANDALLA', color: '#00ff00' },
      { text: 'BUILT WITH PHASER 3 + REACT', color: '#ff00ff' },
    ];

    creditEntries.forEach((entry, i) => {
      this.add.text(
        this.screenCenter[0],
        startY + i * lineHeight,
        entry.text,
        {
          font: `${entrySize}px "Press Start 2P"`,
          fill: entry.color,
          stroke: '#000000',
          strokeThickness: Math.max(1, entrySize / 16)
        }
      ).setOrigin(0.5);
    });
  }
}
