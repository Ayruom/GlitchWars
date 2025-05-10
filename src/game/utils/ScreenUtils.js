// filepath: /Users/mouryagandalla/Documents/Projects/Hackathon1/retro-pixel-app/retro-pixel-app/src/game/utils/ScreenUtils.js
import Phaser from 'phaser';

/**
 * ScreenUtils class provides utilities for responsive UI and screen management
 */
export class ScreenUtils {
  /**
   * Create a new screen utils instance
   * @param {Phaser.Scene} scene - The scene to bind the utils to
   */
  constructor(scene) {
    this.scene = scene;
    
    // Store current screen dimensions
    this.width = scene.scale.width;
    this.height = scene.scale.height;
    
    // UI scaling factors
    this.baseFontSize = Math.max(12, Math.min(18, this.width / 50));
    this.uiScale = Math.max(0.8, Math.min(1.2, this.width / 800));
    
    // Register resize event if available
    if (scene.scale && scene.scale.on) {
      scene.scale.on('resize', this.handleResize, this);
    }
  }
  
  /**
   * Handle resize events
   * @param {Object} gameSize - New game size object
   * @private
   */
  handleResize(gameSize) {
    this.width = gameSize.width;
    this.height = gameSize.height;
    
    // Update scaling factors
    this.baseFontSize = Math.max(12, Math.min(18, this.width / 50));
    this.uiScale = Math.max(0.8, Math.min(1.2, this.width / 800));
    
    // Notify the scene
    if (this.scene.onScreenResize) {
      this.scene.onScreenResize(this.width, this.height);
    }
  }
  
  /**
   * Get responsive font size based on current screen size
   * @param {number} baseSize - Base font size
   * @param {number} minSize - Minimum font size
   * @param {number} maxSize - Maximum font size
   * @returns {number} - Calculated font size
   */
  getFontSize(baseSize = 16, minSize = 12, maxSize = 24) {
    return Math.max(minSize, Math.min(maxSize, baseSize * this.uiScale));
  }
  
  /**
   * Calculate responsive element size
   * @param {number} baseWidth - Base width
   * @param {number} baseHeight - Base height
   * @returns {Object} - Calculated dimensions
   */
  getElementSize(baseWidth, baseHeight) {
    return {
      width: baseWidth * this.uiScale,
      height: baseHeight * this.uiScale
    };
  }
  
  /**
   * Calculate health bar dimensions based on screen size
   * @returns {Object} - Health bar configuration
   */
  getHealthBarConfig() {
    return {
      width: Math.max(150, Math.min(200, this.width / 6)),
      height: Math.max(15, Math.min(20, this.height / 30)),
      y: this.height - Math.max(15, Math.min(20, this.height / 30)) - 20,
      fontSize: this.baseFontSize
    };
  }
  
  /**
   * Create a black background
   * @returns {Phaser.GameObjects.Rectangle} - Background rectangle
   */
  createBackground() {
    return this.scene.add.rectangle(
      0, 0, this.width, this.height, 0x000000
    ).setOrigin(0).setDepth(-1);
  }
  
  /**
   * Create a centered container
   * @returns {Phaser.GameObjects.Container} - Centered container
   */
  createCenteredContainer() {
    return this.scene.add.container(this.width / 2, this.height / 2);
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    if (this.scene.scale && this.scene.scale.off) {
      this.scene.scale.off('resize', this.handleResize, this);
    }
  }
}