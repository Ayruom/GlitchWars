import Phaser from 'phaser';

/**
 * HealthBar class to handle health visualization and updates
 */
export class HealthBar {
  /**
   * Create a new health bar
   * @param {Phaser.Scene} scene - The scene to add the health bar to
   * @param {Object} config - Configuration object for the health bar
   * @param {number} config.x - X position of the health bar
   * @param {number} config.y - Y position of the health bar
   * @param {number} config.width - Width of the health bar
   * @param {number} config.height - Height of the health bar
   * @param {number} config.maxHealth - Maximum health value
   * @param {number} config.currentHealth - Current health value
   * @param {boolean} config.showText - Whether to show health text
   * @param {string} config.label - Label for the health bar (optional)
   */
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    
    // Default values
    this.x = config.x || 10;
    this.y = config.y || scene.game.config.height - 40;
    this.width = config.width || 200;
    this.height = config.height || 20;
    this.maxHealth = config.maxHealth || 100;
    this.currentHealth = config.currentHealth || 100;
    this.showText = config.showText !== undefined ? config.showText : true;
    this.label = config.label || 'Health';
    this.fontSize = config.fontSize || Math.max(12, Math.min(18, scene.game.config.width / 50));
    
    // Create the UI elements
    this.createHealthBar();
  }
  
  /**
   * Create health bar UI elements
   * @private
   */
  createHealthBar() {
    // Health bar background (black)
    this.barBackground = this.scene.add.rectangle(
      this.x, 
      this.y, 
      this.width, 
      this.height, 
      0x000000
    ).setOrigin(0, 0);
    
    // Health bar border (white)
    this.barBorder = this.scene.add.rectangle(
      this.x, 
      this.y, 
      this.width, 
      this.height, 
      0x000000
    ).setOrigin(0, 0)
    .setStrokeStyle(2, 0xffffff, 1);
    
    // Health bar fill (starts green)
    this.barFill = this.scene.add.rectangle(
      this.x + 2, // +2 padding from left
      this.y + 2, // +2 padding from top
      this.width - 4, // -4 for left and right padding
      this.height - 4, // -4 for top and bottom padding
      0x00ff00
    ).setOrigin(0, 0);
    
    // Store the initial width for scaling
    this.initialBarWidth = this.width - 4;
    
    // Add health text label if needed
    if (this.label) {
      this.healthLabel = this.scene.add.text(
        this.x, 
        this.y - this.fontSize - 5, 
        this.label, 
        {
          fontSize: `${this.fontSize}px`,
          fill: '#ffffff'
        }
      );
    }
    
    // Add health value text if needed
    if (this.showText) {
      this.healthText = this.scene.add.text(
        this.x + this.width + 10, 
        this.y + 2, 
        `${Math.ceil(this.currentHealth)}/${this.maxHealth}`, 
        {
          fontSize: `${this.fontSize}px`,
          fill: '#ffffff'
        }
      );
    }
  }
  
  /**
   * Set the position of the health bar
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPosition(x, y) {
    // Calculate the difference in position
    const diffX = x - this.x;
    const diffY = y - this.y;
    
    // Update stored position
    this.x = x;
    this.y = y;
    
    // Move all components
    this.barBackground.x += diffX;
    this.barBackground.y += diffY;
    
    this.barBorder.x += diffX;
    this.barBorder.y += diffY;
    
    this.barFill.x += diffX;
    this.barFill.y += diffY;
    
    if (this.healthLabel) {
      this.healthLabel.x += diffX;
      this.healthLabel.y += diffY;
    }
    
    if (this.healthText) {
      this.healthText.x += diffX;
      this.healthText.y += diffY;
    }
    
    return this;
  }
  
  /**
   * Set the size of the health bar
   * @param {number} width - New width
   * @param {number} height - New height
   */
  setSize(width, height) {
    // Update stored dimensions
    this.width = width;
    this.height = height;
    
    // Resize components
    this.barBackground.setSize(width, height);
    this.barBorder.setSize(width, height);
    
    // Resize the fill bar initially (it will be scaled by current health)
    this.initialBarWidth = width - 4;
    this.barFill.setSize(this.initialBarWidth, height - 4);
    
    // Position the fill bar correctly
    this.barFill.setPosition(this.x + 2, this.y + 2);
    
    // Update health text position if it exists
    if (this.healthText) {
      this.healthText.setPosition(this.x + width + 10, this.y + 2);
    }
    
    // Update current health display
    this.updateHealth(this.currentHealth);
    
    return this;
  }
  
  /**
   * Set the font size for text elements
   * @param {number} size - New font size
   */
  setFontSize(size) {
    this.fontSize = size;
    
    if (this.healthLabel) {
      this.healthLabel.setFontSize(size);
      this.healthLabel.setPosition(this.x, this.y - size - 5);
    }
    
    if (this.healthText) {
      this.healthText.setFontSize(size);
    }
    
    return this;
  }
  
  /**
   * Update health value and bar display
   * @param {number} value - New health value
   * @param {number} maxHealth - New max health value (optional)
   */
  updateHealth(value, maxHealth = null) {
    // Update max health if provided
    if (maxHealth !== null) {
      this.maxHealth = maxHealth;
    }
    
    // Update current health
    this.currentHealth = Math.max(0, Math.min(value, this.maxHealth));
    
    // Calculate health percentage
    const healthPercent = this.currentHealth / this.maxHealth;
    
    // Update bar fill width
    this.barFill.displayWidth = Math.max(0, this.initialBarWidth * healthPercent);
    
    // Update color based on health percentage
    this.barFill.setFillStyle(this.getHealthColor(healthPercent)); 
    
    // Update health text if it exists
    if (this.healthText) {
      this.healthText.setText(`${Math.ceil(this.currentHealth)}/${this.maxHealth}`);
    }
    
    return this;
  }
  
  /**
   * Get color for health bar based on percentage
   * @param {number} percent - Health percentage (0-1)
   * @returns {number} - Color value
   * @private
   */
  getHealthColor(percent) {
    if (percent > 0.6) {
      // Green to yellow gradient for high health (100% to 60%)
      return Phaser.Display.Color.GetColor(
        Math.floor(255 * (1 - percent) * 2.5),
        255,
        0
      );
    } else {
      // Yellow to red gradient for low health (60% to 0%)
      return Phaser.Display.Color.GetColor(
        255,
        Math.floor(255 * (percent / 0.6)),
        0
      );
    }
  }
  
  /**
   * Show a damage animation on the health bar
   * @param {number} amount - Amount of damage
   */
  showDamage(amount) {
    // Flash the health bar red
    this.scene.tweens.add({
      targets: this.barFill,
      alpha: 0.5,
      yoyo: true,
      duration: 100,
      repeat: 1
    });
    
    // Update the health
    this.updateHealth(this.currentHealth - amount);
  }
  
  /**
   * Show a heal animation on the health bar
   * @param {number} amount - Amount of healing
   */
  showHeal(amount) {
    // Flash the health bar bright green
    this.scene.tweens.add({
      targets: this.barFill,
      alpha: 0.8,
      yoyo: true,
      duration: 100,
      repeat: 1
    });
    
    // Update the health
    this.updateHealth(this.currentHealth + amount);
  }
  
  /**
   * Update responsively based on canvas size
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  updateResponsive(width, height) {
    // Calculate new dimensions based on screen size
    const healthBarWidth = Math.max(150, Math.min(200, width / 6));
    const healthBarHeight = Math.max(15, Math.min(20, height / 30));
    const fontSize = Math.max(12, Math.min(18, width / 50));
    const healthBarY = height - healthBarHeight - 20;
    
    // Update health bar position and size
    this.setPosition(this.x, healthBarY);
    this.setSize(healthBarWidth, healthBarHeight);
    this.setFontSize(fontSize);
  }
  
  /**
   * Destroy all UI components
   */
  destroy() {
    if (this.barBackground) this.barBackground.destroy();
    if (this.barBorder) this.barBorder.destroy();
    if (this.barFill) this.barFill.destroy();
    if (this.healthLabel) this.healthLabel.destroy();
    if (this.healthText) this.healthText.destroy();
  }
}