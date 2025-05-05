import Phaser from 'phaser';

export class Player {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.config = config;
    
    // Player properties
    this.maxHealth = config.maxHealth || 100;
    this.currentHealth = config.currentHealth || this.maxHealth;
    this.speed = config.speed || 200;
    this.invulnerable = false;
    this.lastDamageTime = 0;
    this.facingRight = true;
    
    // Create the player sprite
    this.sprite = this.createSprite(x, y, config.spriteKey || 'playerCharacter');
  }
  
  /**
   * Create the player sprite with proper physics
   */
  createSprite(x, y, spriteKey) {
    try {
      // Create the player using the selected hero sprite
      const sprite = this.scene.physics.add.sprite(x, y, spriteKey);
      
      // Set the size of the player sprite
      const spriteSize = this.getSpriteSize();
      sprite.setDisplaySize(spriteSize.width, spriteSize.height);
      
      // Add physics to the sprite
      this.scene.physics.world.enable(sprite);
      
      // Set origin to the center for proper flipping
      sprite.setOrigin(0.5, 0.5);
      
      // Set world bounds collision
      sprite.body.collideWorldBounds = true;
      
      return sprite;
    } catch (error) {
      console.error('Error creating player sprite:', error);
      return this.createFallbackSprite(x, y);
    }
  }
  
  /**
   * Determine sprite size based on hero type
   */
  getSpriteSize() {
    const { id } = this.config.hero || {};
    
    // Default size
    const defaultSize = { width: 60, height: 60 };
    
    // Customize sizes based on hero type if needed
    if (id === 'archer') {
      return { width: 64, height: 64 };
    } else if (id === 'mage3') {
      return { width: 64, height: 64 };
    }
    
    return defaultSize;
  }
  
  /**
   * Create a fallback sprite if image loading fails
   */
  createFallbackSprite(x, y) {
    // Create a green rectangle as the player (fallback)
    const sprite = this.scene.add.rectangle(x, y, 30, 30, 0x00ff00);
    
    // Add physics to the rectangle
    this.scene.physics.add.existing(sprite);
    
    // Set world bounds collision
    sprite.body.collideWorldBounds = true;
    
    return sprite;
  }
  
  /**
   * Update player logic - called in the scene's update method
   */
  update() {
    if (!this.sprite || !this.sprite.active) return;
    
    this.handleMovement();
  }
  
  /**
   * Handle player movement based on input
   */
  handleMovement() {
    if (!this.sprite || !this.sprite.body) return;
    
    // Get input handlers from the scene
    const { cursors, wasd } = this.scene;
    if (!cursors || !wasd) return;
    
    // Reset velocity
    this.sprite.body.setVelocity(0);
    
    // Horizontal movement (prioritize WASD then arrow keys)
    if (wasd.left.isDown || cursors.left.isDown) {
      this.sprite.body.setVelocityX(-this.speed);
      
      // Flip sprite horizontally when moving left
      if (this.facingRight) {
        this.facingRight = false;
        this.sprite.scaleX = -1; // Flip sprite by setting negative scale
        // Maintain the physics body's correct position
        this.sprite.body.offset.x = this.sprite.width;
      }
    } else if (wasd.right.isDown || cursors.right.isDown) {
      this.sprite.body.setVelocityX(this.speed);
      
      // Reset sprite to normal when moving right
      if (!this.facingRight) {
        this.facingRight = true;
        this.sprite.scaleX = 1; // Normal scale
        // Reset the physics body offset
        this.sprite.body.offset.x = 0;
      }
    }
    
    // Vertical movement (prioritize WASD then arrow keys)
    if (wasd.up.isDown || cursors.up.isDown) {
      this.sprite.body.setVelocityY(-this.speed);
    } else if (wasd.down.isDown || cursors.down.isDown) {
      this.sprite.body.setVelocityY(this.speed);
    }
  }
  
  /**
   * Apply damage to the player
   * @param {number} amount - Damage amount
   * @returns {boolean} - True if player died from this damage
   */
  takeDamage(amount) {
    // Skip if player is invulnerable
    if (this.invulnerable) return false;
    
    // Apply damage
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    
    // Visual feedback - red flash
    const originalFillColor = this.sprite.fillColor;
    this.sprite.fillColor = 0xff0000;
    
    // Make player temporarily invulnerable
    this.invulnerable = true;
    
    // Reset after invulnerability period
    this.scene.time.delayedCall(1000, () => {
      if (this.sprite && this.sprite.active) {
        // Reset the color
        this.sprite.fillColor = originalFillColor || 0x00ff00;
        this.invulnerable = false;
      }
    });
    
    return this.currentHealth <= 0; // Return true if player died
  }
  
  /**
   * Heal the player
   * @param {number} amount - Healing amount
   * @returns {number} - Amount actually healed
   */
  heal(amount) {
    const prevHealth = this.currentHealth;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    return this.currentHealth - prevHealth; // Return amount actually healed
  }
  
  /**
   * Increase the player's maximum health
   * @param {number} amount - Amount to increase
   * @param {number} cap - Maximum cap for health
   * @returns {number} - Amount actually increased
   */
  increaseMaxHealth(amount, cap = Infinity) {
    const prevMax = this.maxHealth;
    this.maxHealth = Math.min(cap, this.maxHealth + amount);
    return this.maxHealth - prevMax; // Return amount actually increased
  }
  
  /**
   * Increase the player's movement speed
   * @param {number} amount - Amount to increase
   * @param {number} cap - Maximum cap for speed
   * @returns {number} - Amount actually increased
   */
  increaseSpeed(amount, cap = Infinity) {
    const prevSpeed = this.speed;
    this.speed = Math.min(cap, this.speed + amount);
    return this.speed - prevSpeed; // Return amount actually increased
  }
  
  /**
   * Clean up resources used by the player
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}