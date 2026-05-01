import { BaseScene } from './BaseScene';

export class OptionsScene extends BaseScene {
  constructor(config) {
    super('OptionsScene', { ...config, canGoBack: true });
  }

  create() {
    super.create();

    const titleSize = Math.max(24, Math.min(48, this.config.width / 20));
    const titleOffset = Math.max(60, Math.min(120, this.config.height / 6));

    const title = this.add.text(
      this.screenCenter[0],
      this.screenCenter[1] - titleOffset,
      'OPTIONS',
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
    const entryOptions = {
      font: `${entrySize}px "Press Start 2P"`,
      fill: '#00ff00',
      stroke: '#000000',
      strokeThickness: Math.max(1, entrySize / 16)
    };
    const labelOptions = {
      font: `${entrySize}px "Press Start 2P"`,
      fill: '#00ffff',
      stroke: '#000000',
      strokeThickness: Math.max(1, entrySize / 16)
    };

    const lineHeight = entrySize * 2.2;
    const startY = this.screenCenter[1] - lineHeight;

    // Sound placeholder
    this.add.text(
      this.screenCenter[0],
      startY,
      'SOUND: [COMING SOON]',
      entryOptions
    ).setOrigin(0.5);

    // Keybindings header
    this.add.text(
      this.screenCenter[0],
      startY + lineHeight * 1.6,
      'CONTROLS',
      labelOptions
    ).setOrigin(0.5);

    const controlLines = [
      'MOVE:  ARROW KEYS / WASD',
    ];

    controlLines.forEach((line, i) => {
      this.add.text(
        this.screenCenter[0],
        startY + lineHeight * 2.6 + i * lineHeight,
        line,
        {
          font: `${Math.max(10, entrySize - 2)}px "Press Start 2P"`,
          fill: '#00ff00',
          stroke: '#000000',
          strokeThickness: Math.max(1, (entrySize - 2) / 16)
        }
      ).setOrigin(0.5);
    });
  }
}
