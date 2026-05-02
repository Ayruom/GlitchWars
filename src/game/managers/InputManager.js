// filepath: /Users/mouryagandalla/Documents/Projects/Hackathon1/retro-pixel-app/retro-pixel-app/src/game/managers/InputManager.js
import Phaser from 'phaser';

/**
 * InputManager class to handle all keyboard input for the game
 */
export class InputManager {
  /**
   * Create a new input manager
   * @param {Phaser.Scene} scene - The scene to bind inputs to
   */
  constructor(scene) {
    this.scene = scene;
    
    // Initialize input handlers
    this.cursors = null;
    this.wasd = null;
    this.keyR = null;
    
    // Create input handlers
    this.setupInput();
  }
  
  /**
   * Setup input controls for the game
   * @private
   */
  setupInput() {
    // Create cursor keys
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    
    // Add WASD keys as alternative controls
    this.wasd = {
      up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    
    // Add special keys
    this.keyR = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keySpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyEsc = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    
  }
  
  /**
   * Check if any horizontal movement keys are pressed
   * @returns {number} -1 for left, 1 for right, 0 for no horizontal movement
   */
  getHorizontalMovement() {
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      return -1;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      return 1;
    }
    return 0;
  }
  
  /**
   * Check if any vertical movement keys are pressed
   * @returns {number} -1 for up, 1 for down, 0 for no vertical movement
   */
  getVerticalMovement() {
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      return -1;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      return 1;
    }
    return 0;
  }
  
  /**
   * Get movement vector based on current key presses
   * @returns {Phaser.Math.Vector2} Normalized movement vector
   */
  getMovementVector() {
    const vector = new Phaser.Math.Vector2(
      this.getHorizontalMovement(),
      this.getVerticalMovement()
    );
    
    // Normalize for diagonal movement
    if (vector.length() > 0) {
      vector.normalize();
    }
    
    return vector;
  }
  
  /**
   * Register callback for the restart key
   * @param {Function} callback - Function to call when the restart key is pressed
   */
  onRestartKey(callback) {
    this.keyR.on('down', callback);
    return this;
  }
  
  /**
   * Register callback for the space key
   * @param {Function} callback - Function to call when the space key is pressed
   */
  onSpaceKey(callback) {
    this.keySpace.on('down', callback);
    return this;
  }
  
  /**
   * Register callback for the escape key
   * @param {Function} callback - Function to call when the escape key is pressed
   */
  onEscapeKey(callback) {
    this.keyEsc.on('down', callback);
    return this;
  }
  
  /**
   * Clean up resources and event listeners
   */
  destroy() {
    // Remove key event listeners
    if (this.keyR) this.keyR.removeAllListeners();
    if (this.keySpace) this.keySpace.removeAllListeners();
    if (this.keyEsc) this.keyEsc.removeAllListeners();
  }
}