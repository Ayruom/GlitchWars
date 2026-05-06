import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor(config) {
    super("BootScene");
    this.config = config;
  }

  preload() {
    // Create loading bar
    const width = this.config.width;
    const height = this.config.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: "Loading...",
      style: {
        font: '20px "Press Start 2P"',
        fill: "#00ff00",
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    // Loading event handlers
    this.load.on("progress", (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Check if we're in production (based on hostname)
    const isProduction = window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1';
    
    // Base path for assets - adjust for production
    let basePath = '/assets';
    
    // For Netlify or similar hosting, we may need to adjust the path
    if (isProduction) {
      // Try to determine the base path from the current URL
      const pathParts = window.location.pathname.split('/');
      if (pathParts.length > 2) {
        // If we're in a subdirectory like /game/
        basePath = '.' + basePath;
      }
    }

    this.load.image("background", `${basePath}/scanline.png`);

    // Hero character sprites - Male (with path adjustment)
    this.load.image("wizard_male_1", `${basePath}/WizardsInGameImages/Male/FinalPlayUse/Wizard Male1 60X60.png`);
    this.load.image("wizard_male_2", `${basePath}/WizardsInGameImages/Male/FinalPlayUse/Wizard Male2 60X60.png`);
    this.load.image("wizard_male_3", `${basePath}/WizardsInGameImages/Male/FinalPlayUse/Wizard Male3 64X64.png`);
    
    // Hero character sprites - Female (with path adjustment)
    this.load.image("wizard_female_1", `${basePath}/WizardsInGameImages/Female/FinalPlayUse/Wizard Female1 60X60.png`);
    this.load.image("wizard_female_2", `${basePath}/WizardsInGameImages/Female/FinalPlayUse/Wizard Female2 60X60.png`);
    this.load.image("archer_female", `${basePath}/ArchersInGameImages/Female/FinalPlayUse/Archer Female 64X64.png`);

    // Enemy sprites - load both facing directions (with path adjustment)
    this.load.image("enemyRight", `${basePath}/EnemiesInGameImages/FinalPlayUse/Enemy1 40X40rightFacing.png`);
    this.load.image("enemyLeft", `${basePath}/EnemiesInGameImages/FinalPlayUse/Enemy1 40X40LeftFacing.png`);

    // UI elements (with path adjustment)
    this.load.image("button", `${basePath}/button.png`);
  }

  create() {
    // Create placeholder graphics for missing assets
    if (!this.textures.exists("enemyRight")) {
      const enemyRightGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      enemyRightGraphics.fillStyle(0xff0000);
      enemyRightGraphics.fillRect(0, 0, 32, 32);
      enemyRightGraphics.generateTexture("enemyRight", 32, 32);
    }

    if (!this.textures.exists("enemyLeft")) {
      const enemyLeftGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      enemyLeftGraphics.fillStyle(0xff0000);
      enemyLeftGraphics.fillRect(0, 0, 32, 32);
      enemyLeftGraphics.generateTexture("enemyLeft", 32, 32);
    }

    if (!this.textures.exists("button")) {
      const buttonGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      buttonGraphics.fillStyle(0x00ffff);
      buttonGraphics.fillRect(0, 0, 64, 32);
      buttonGraphics.generateTexture("button", 64, 32);
    }
    
    // Create placeholder for missing hero assets
    // Male placeholders
    this.createPlaceholderIfMissing("wizard_male_1", 0x0000ff);
    this.createPlaceholderIfMissing("wizard_male_2", 0x0000ff);
    this.createPlaceholderIfMissing("wizard_male_3", 0x0000ff);
    
    // Female placeholders
    this.createPlaceholderIfMissing("wizard_female_1", 0xff00ff);
    this.createPlaceholderIfMissing("wizard_female_2", 0xff00ff);
    this.createPlaceholderIfMissing("archer_female", 0xff00ff);

    this.scene.start("MenuScene");
  }

  /**
   * Create a placeholder graphic if the texture doesn't exist
   * @param {string} key - The texture key to check
   * @param {number} color - The color to use for the placeholder
   */
  createPlaceholderIfMissing(key, color = 0x00ff00) {
    if (!this.textures.exists(key)) {
      const placeholder = this.make.graphics({ x: 0, y: 0, add: false });
      placeholder.fillStyle(color);
      placeholder.fillRect(0, 0, 60, 60);
      placeholder.generateTexture(key, 60, 60);
    }
  }

  createAnimations() {
    // Knight animations
    if (this.textures.exists("knight")) {
      this.anims.create({
        key: "knight_idle",
        frames: this.anims.generateFrameNumbers("knight", { start: 0, end: 0 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // Similar animations for other characters and enemies
    // ...

    // Mage animations
    if (this.textures.exists("mage")) {
      this.anims.create({
        key: "mage_idle",
        frames: this.anims.generateFrameNumbers("mage", { start: 0, end: 0 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // Archer animations
    if (this.textures.exists("archer")) {
      this.anims.create({
        key: "archer_idle",
        frames: this.anims.generateFrameNumbers("archer", { start: 0, end: 0 }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }
}
