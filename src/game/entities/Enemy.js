import Phaser from 'phaser';

export class Enemy {
  /**
   * Create a new enemy entity
   * @param {Phaser.Scene} scene - The scene this enemy belongs to
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {Object} config - Configuration object
   */
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    
    // Set default properties
    this.maxHealth = config.maxHealth || 100;
    this.currentHealth = this.maxHealth;
    this.speed = config.speed || 100;
    this.damage = config.damage || 5;
    this.value = config.value || 10;
    this.side = config.side || 0;
    
    // Create the sprite
    const spriteKey = config.spriteKey || 'enemyLeft';
    
    try {
      // Create sprite with physics
      this.sprite = scene.physics.add.sprite(x, y, spriteKey);
      
      // Enable physics body
      this.sprite.setCollideWorldBounds(false);
      
      // Add properties to the sprite for easy access
      this.sprite.maxHealth = this.maxHealth;
      this.sprite.currentHealth = this.currentHealth;
      this.sprite.baseSpeed = this.speed;
      this.sprite.damage = this.damage;
      this.sprite.value = this.value;
      this.sprite.spawnTime = scene.time.now;

      // Create health bar for this enemy
      this.createHealthBar();
    } catch (error) {
      console.error('Error creating enemy:', error);
      // Create a fallback sprite if normal creation fails
      this.createFallbackSprite(x, y);
    }
  }
  
  /**
   * Create a fallback sprite if normal sprite creation fails
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  createFallbackSprite(x, y) {
    try {
      // Create a simple rectangle as fallback
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xff0000);
      graphics.fillRect(0, 0, 40, 40);
      
      // Generate texture from graphics
      const textureKey = 'fallbackEnemy' + Date.now();
      graphics.generateTexture(textureKey, 40, 40);
      
      // Clear graphics after generating texture
      graphics.clear();
      
      // Create sprite with new texture
      this.sprite = this.scene.physics.add.sprite(x, y, textureKey);
      
      // Set properties on sprite
      this.sprite.maxHealth = this.maxHealth;
      this.sprite.currentHealth = this.currentHealth;
      this.sprite.baseSpeed = this.speed;
      this.sprite.damage = this.damage;
      this.sprite.value = this.value;
      this.sprite.spawnTime = this.scene.time.now;

      // Create health bar
      this.createHealthBar();
    } catch (error) {
      console.error('Failed to create fallback enemy sprite:', error);
    }
  }
  
  /**
   * Create a health bar for the enemy
   */
  createHealthBar() {
    try {
      // Create health bar background (gray)
      this.sprite.healthBarBg = this.scene.add.rectangle(
        this.sprite.x - 10,
        this.sprite.y - 15,
        20,
        2,
        0x888888
      ).setOrigin(0, 0.5);
      
      // Create health bar (initially green)
      this.sprite.healthBar = this.scene.add.rectangle(
        this.sprite.x - 10,
        this.sprite.y - 15,
        20,
        2,
        0x00ff00
      ).setOrigin(0, 0.5);
    } catch (error) {
      console.error('Failed to create enemy health bar:', error);
    }
  }
  
  /**
   * Update enemy health
   * @param {number} amount - Amount of damage (positive) or healing (negative)
   * @returns {boolean} - True if enemy died
   */
  takeDamage(amount) {
    if (!this.sprite) return true;
    
    this.sprite.currentHealth = Math.max(0, this.sprite.currentHealth - amount);
    
    // Check if dead
    if (this.sprite.currentHealth <= 0) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get enemy position
   * @returns {Object} - Position object with x and y coordinates
   */
  getPosition() {
    if (!this.sprite) return { x: 0, y: 0 };
    return { x: this.sprite.x, y: this.sprite.y };
  }
  
  /**
   * Move toward a target position with current speed
   * @param {number} targetX - Target X position
   * @param {number} targetY - Target Y position
   */
  moveToward(targetX, targetY) {
    if (!this.sprite) return;
    
    this.scene.physics.moveTo(this.sprite, targetX, targetY, this.sprite.baseSpeed);
  }
  
  /**
   * Destroy the enemy and its associated objects
   */
  destroy() {
    if (this.sprite) {
      if (this.sprite.healthBar) this.sprite.healthBar.destroy();
      if (this.sprite.healthBarBg) this.sprite.healthBarBg.destroy();
      this.sprite.destroy();
    }
  }
}