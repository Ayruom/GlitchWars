// filepath: /Users/mouryagandalla/Documents/Projects/Hackathon1/retro-pixel-app/retro-pixel-app/src/game/ui/ScoreDisplay.js
import Phaser from 'phaser';

/**
 * ScoreDisplay class to handle score, level and wave UI elements
 */
export class ScoreDisplay {
  /**
   * Create a new score display
   * @param {Phaser.Scene} scene - The scene to add the score display to
   * @param {Object} config - Configuration for the score display
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    
    // Default values
    this.x = config.x || 16;
    this.y = config.y || 16;
    this.fontSize = config.fontSize || Math.max(12, Math.min(18, scene.scale.width / 50));
    this.color = config.color || '#00ff00';
    this.spacing = config.spacing || 10;
    
    // Game data
    this.score = config.score || 0;
    this.level = config.level || 1;
    this.wave = config.wave || 1;
    this.characterName = config.characterName || 'Hero';
    
    // Create UI elements
    this.createUI();
  }
  
  /**
   * Create all UI text elements
   * @private
   */
  createUI() {
    // Score text
    this.scoreText = this.scene.add.text(
      this.x, 
      this.y, 
      `Score: ${this.score}`, 
      { 
        fontSize: `${this.fontSize}px`, 
        fill: this.color
      }
    );
    
    // Level text
    this.levelText = this.scene.add.text(
      this.x, 
      this.y + this.fontSize + this.spacing, 
      `Level: ${this.level}`, 
      {
        fontSize: `${this.fontSize}px`,
        fill: this.color
      }
    );
    
    // Wave text
    this.waveText = this.scene.add.text(
      this.x, 
      this.y + (this.fontSize + this.spacing) * 2, 
      `Wave: ${this.wave}`, 
      {
        fontSize: `${this.fontSize}px`,
        fill: this.color
      }
    );
    
    // Character info
    this.characterText = this.scene.add.text(
      this.scene.scale.width - 16, 
      this.y, 
      `Hero: ${this.characterName}`, 
      {
        fontSize: `${this.fontSize}px`,
        fill: this.color
      }
    ).setOrigin(1, 0);
  }
  
  /**
   * Update the score
   * @param {number} score - New score value
   */
  updateScore(score) {
    this.score = score;
    this.scoreText.setText(`Score: ${this.score}`);
    return this;
  }
  
  /**
   * Update the level
   * @param {number} level - New level value
   */
  updateLevel(level) {
    this.level = level;
    this.levelText.setText(`Level: ${this.level}`);
    return this;
  }
  
  /**
   * Update the wave
   * @param {number} wave - New wave value
   */
  updateWave(wave) {
    this.wave = wave;
    this.waveText.setText(`Wave: ${this.wave}`);
    return this;
  }
  
  /**
   * Update character name
   * @param {string} name - New character name
   */
  updateCharacter(name) {
    this.characterName = name;
    this.characterText.setText(`Hero: ${this.characterName}`);
    return this;
  }
  
  /**
   * Set the font size for all text elements
   * @param {number} size - New font size in pixels
   */
  setFontSize(size) {
    this.fontSize = size;
    
    // Apply to all text elements
    this.scoreText.setFontSize(size);
    this.levelText.setFontSize(size);
    this.waveText.setFontSize(size);
    this.characterText.setFontSize(size);
    
    // Reposition for correct spacing
    this.updatePositions();
    
    return this;
  }
  
  /**
   * Update text positions based on current font size and spacing
   * @private
   */
  updatePositions() {
    this.scoreText.setPosition(this.x, this.y);
    this.levelText.setPosition(this.x, this.y + this.fontSize + this.spacing);
    this.waveText.setPosition(this.x, this.y + (this.fontSize + this.spacing) * 2);
    this.characterText.setPosition(this.scene.scale.width - 16, this.y);
    
    return this;
  }
  
  /**
   * Update all UI elements responsively when screen size changes
   * @param {number} width - Screen width
   * @param {number} height - Screen height
   */
  updateResponsive(width, height) {
    const newFontSize = Math.max(12, Math.min(18, width / 50));
    
    // Update font size
    this.setFontSize(newFontSize);
    
    // Update character text position for right alignment
    this.characterText.setPosition(width - 16, this.y);
    
    return this;
  }
  
  /**
   * Destroy all UI elements
   */
  destroy() {
    if (this.scoreText) this.scoreText.destroy();
    if (this.levelText) this.levelText.destroy();
    if (this.waveText) this.waveText.destroy();
    if (this.characterText) this.characterText.destroy();
  }
}