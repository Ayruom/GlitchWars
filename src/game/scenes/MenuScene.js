import { BaseScene } from './BaseScene';

export class MenuScene extends BaseScene {
  constructor(config) {
    super('MenuScene', config);
    
    this.menu = [
      { scene: 'PlayScene', text: 'Play' },
      { scene: 'OptionsScene', text: 'Options' },
      { scene: 'CreditsScene', text: 'Credits' }
    ];
  }

  create() {
    super.create();
    
    // Calculate responsive title size
    const titleSize = Math.max(24, Math.min(48, this.config.width / 20));
    const titleOffset = Math.max(50, Math.min(100, this.config.height / 8));
    
    // Add title with responsive sizing
    const title = this.add.text(
      this.screenCenter[0], 
      this.screenCenter[1] - titleOffset, 
      'GLITCH WARS', 
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
    
    // Apply glitch effect
    this.createGlitchEffect(title);
    
    // Create menu items with responsive sizing from BaseScene
    this.createMenu(this.menu, (menuItem) => {
      const textGO = menuItem.textObject;
      textGO.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          textGO.setStyle({ fill: '#ff00ff' });
          // Add hover scale effect
          textGO.setScale(1.1);
        })
        .on('pointerout', () => {
          textGO.setStyle({ fill: '#00ff00' });
          // Reset scale
          textGO.setScale(1);
        })
        .on('pointerup', () => {
          this.scene.start(menuItem.scene);
        });
    });
  }
}