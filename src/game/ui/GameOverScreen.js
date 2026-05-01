// filepath: /Users/mouryagandalla/Documents/Projects/Hackathon1/retro-pixel-app/retro-pixel-app/src/game/ui/GameOverScreen.js
import Phaser from 'phaser';

/**
 * GameOverScreen class to handle game over UI and interactions
 */
export class GameOverScreen {
  /**
   * Create a new game over screen
   * @param {Phaser.Scene} scene - The scene to add the game over screen to
   * @param {Object} config - Configuration for the game over screen
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    
    // Default values
    this.score = config.score || 0;
    this.width = config.width || scene.scale.width;
    this.height = config.height || scene.scale.height;
    this.fontFamily = config.fontFamily || '"Press Start 2P"';
    this.isVisible = false;
    
    // Create UI elements
    this.createUI();
    
    // Hide initially
    this.hide();
  }
  
  /**
   * Create all game over UI elements
   * @private
   */
  createUI() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // Create centered container for game over elements
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    
    // Black overlay
    this.overlay = this.scene.add.rectangle(
      0, 0, this.width, this.height, 0x000000, 0.7
    ).setOrigin(0);
    
    // Game over text
    this.gameOverText = this.scene.add.text(
      centerX,
      centerY - 80,
      'GAME OVER',
      {
        fontSize: '48px',
        fontFamily: this.fontFamily,
        fill: '#ff0000',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center'
      }
    ).setOrigin(0.5);
    
    // Add final score text
    this.finalScoreText = this.scene.add.text(
      centerX,
      centerY,
      `Final Score: ${this.score}`,
      {
        fontSize: '24px',
        fontFamily: this.fontFamily,
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      }
    ).setOrigin(0.5);
    
    // Add restart button
    this.restartButton = this.scene.add.text(
      centerX,
      centerY + 70,
      'RESTART',
      {
        fontSize: '24px',
        fontFamily: this.fontFamily,
        fill: '#00ff00',
        stroke: '#000000',
        strokeThickness: 4,
        padding: { x: 20, y: 10 },
        align: 'center'
      }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      this.restartButton.setStyle({ fill: '#ff00ff' });
      this.restartButton.setScale(1.1);
    })
    .on('pointerout', () => {
      this.restartButton.setStyle({ fill: '#00ff00' });
      this.restartButton.setScale(1);
    })
    .on('pointerdown', () => this.restart());

    // Add main menu button
    this.mainMenuButton = this.scene.add.text(
      centerX,
      centerY + 130,
      'MAIN MENU',
      {
        fontSize: '24px',
        fontFamily: this.fontFamily,
        fill: '#00ffff',
        stroke: '#000000',
        strokeThickness: 4,
        padding: { x: 20, y: 10 },
        align: 'center'
      }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      this.mainMenuButton.setStyle({ fill: '#ff00ff' });
      this.mainMenuButton.setScale(1.1);
    })
    .on('pointerout', () => {
      this.mainMenuButton.setStyle({ fill: '#00ffff' });
      this.mainMenuButton.setScale(1);
    })
    .on('pointerdown', () => this.scene.scene.start('MenuScene'));

    // Add restart instruction
    this.restartInstruction = this.scene.add.text(
      centerX,
      centerY + 190,
      'Press R to restart',
      {
        fontSize: '16px',
        fontFamily: this.fontFamily,
        fill: '#666666',
        align: 'center'
      }
    ).setOrigin(0.5);

    // Add elements to container
    this.container.add([
      this.overlay,
      this.gameOverText,
      this.finalScoreText,
      this.restartButton,
      this.mainMenuButton,
      this.restartInstruction
    ]);
    
    // Add keyboard restart option
    this.keyR = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyR.on('down', () => this.restart());
  }
  
  /**
   * Show the game over screen with the final score
   * @param {number} score - Final score to display
   */
  show(score) {
    // Update score if provided
    if (score !== undefined) {
      this.score = score;
      this.finalScoreText.setText(`Final Score: ${this.score}`);
    }
    
    this.container.setVisible(true);
    this.isVisible = true;
    
    // Add animation effect (slide down from top)
    this.container.setPosition(0, -this.height);
    this.scene.tweens.add({
      targets: this.container,
      y: 0,
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    return this;
  }
  
  /**
   * Hide the game over screen
   */
  hide() {
    this.container.setVisible(false);
    this.isVisible = false;
    return this;
  }
  
  /**
   * Restart the game
   * @private
   */
  restart() {
    // Call the scene's restart method
    this.scene.scene.restart();
  }
  
  /**
   * Update screen size and position elements accordingly
   * @param {number} width - New width
   * @param {number} height - New height
   */
  updateSize(width, height) {
    this.width = width;
    this.height = height;
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Update overlay size
    this.overlay.setSize(width, height);
    
    // Update text positions
    this.gameOverText.setPosition(centerX, centerY - 80);
    this.finalScoreText.setPosition(centerX, centerY);
    this.restartButton.setPosition(centerX, centerY + 70);
    this.mainMenuButton.setPosition(centerX, centerY + 130);
    this.restartInstruction.setPosition(centerX, centerY + 190);
    
    return this;
  }
  
  /**
   * Clean up resources when destroyed
   */
  destroy() {
    if (this.keyR) this.keyR.removeAllListeners();
    if (this.container) this.container.destroy();
  }
}