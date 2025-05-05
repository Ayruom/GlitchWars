// filepath: /Users/mouryagandalla/Documents/Projects/Hackathon1/retro-pixel-app/retro-pixel-app/src/game/entities/Enemy.js
import Phaser from 'phaser';

export class Enemy {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.config = config;
    
    // Enemy properties
    this.maxHealth = config.maxHealth || 100;
    this.currentHealth = config.maxHealth || 100;
    this.baseSpeed = config.speed || 100;
    this.damage = config.damage || 5;
    this.value = config.value || 10;
    this.side = config.side || 0; // Spawn side
    this.lastDamageTime = 0;
    this.healthBar = null;
    this.healthBarBg = null;
    
    // Create the enemy sprite
    this.sprite = this.createSprite(x, y, config.spriteKey);
  }
  
  /**
   * Create the enemy sprite with proper physics
   */
  createSprite(x, y, spriteKey) {
    try {
      // Create the enemy sprite
      const sprite = this.scene.physics.add.sprite(x, y, spriteKey);
      
      // Set the size of the enemy sprite
      sprite.setDisplaySize(40, 40);
      
      // Add physics to the sprite
      this.scene.physics.world.enable(sprite);
      
      // Add enemy properties to the sprite for easy access
      sprite.maxHealth = this.maxHealth;
      sprite.currentHealth = this.currentHealth;
      sprite.baseSpeed = this.baseSpeed;
      sprite.damage = this.damage;
      sprite.value = this.value;
      sprite.spawnSide = this.side;
      
      // Create health bar
      this.createHealthBar(sprite);
      
      return sprite;
    } catch (error) {
      console.error('Error creating enemy sprite:', error);
      return this.createFallbackSprite(x, y);
    }
  }
  
  /**
   * Create a fallback sprite if image loading fails
   */
  createFallbackSprite(x, y) {
    // Create a red rectangle as the enemy (fallback)
    const sprite = this.scene.add.rectangle(x, y, 30, 30, 0xff0000);
    
    // Add physics to the rectangle
    this.scene.physics.add.existing(sprite);
    
    // Add enemy properties to the sprite for easy access
    sprite.maxHealth = this.maxHealth;
    sprite.currentHealth = this.currentHealth;
    sprite.baseSpeed = this.baseSpeed;
    sprite.damage = this.damage;
    sprite.value = this.value;
    
    // Create health bar
    this.createHealthBar(sprite);
    
    return sprite;
  }
  
  /**
   * Create health bar for the enemy
   */
  createHealthBar(sprite) {
    try {
      // Black background for health bar
      sprite.healthBarBg = this.scene.add.rectangle(
        sprite.x - 10, 
        sprite.y - 15, 
        22, 
        6, 
        0x000000
      );
      
      // Yellow health bar at full health
      sprite.healthBar = this.scene.add.rectangle(
        sprite.x - 10, 
        sprite.y - 15, 
        20, 
        4, 
        0xFFFF00 // Yellow color for full health
      );
      
      // Store references for updating
      this.healthBar = sprite.healthBar;
      this.healthBarBg = sprite.healthBarBg;
    } catch (error) {
      console.error('Error creating enemy health bar:', error);
    }
  }
  
  /**
   * Update enemy logic - called in the scene's update method
   */
  update() {
    if (!this.sprite || !this.sprite.active) return;
    
    this.updateMovement();
    this.updateHealthBar();
  }
  
  /**
   * Update enemy movement to follow player
   */
  updateMovement() {
    try {
      if (!this.sprite || !this.sprite.active) return;
      
      const playerSprite = this.scene.player.sprite;
      if (!playerSprite || !playerSprite.active) return;
      
      // Calculate distance to player
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        playerSprite.x, playerSprite.y
      );
      
      // Update sprite based on position relative to player
      if (this.sprite.x < playerSprite.x) {
        this.sprite.setTexture('enemyRight');
      } else {
        this.sprite.setTexture('enemyLeft');
      }
      
      // Dynamic speed based on distance (faster when further away)
      const minSpeed = this.sprite.baseSpeed * 0.5;
      const maxSpeed = this.sprite.baseSpeed * 1.2;
      const speedFactor = Math.min(1, Math.max(0.5, distance / 300));
      const speed = minSpeed + (maxSpeed - minSpeed) * speedFactor;
      
      // Move towards player
      this.scene.physics.moveToObject(this.sprite, playerSprite, speed);
    } catch (error) {
      console.error('Error updating enemy movement:', error);
    }
  }
  
  /**
   * Update enemy health bar position and fill
   */
  updateHealthBar() {
    try {
      if (!this.sprite || !this.sprite.active || !this.healthBar || !this.healthBarBg) return;
      
      // Update health bar position
      this.healthBar.x = this.sprite.x - 10;
      this.healthBar.y = this.sprite.y - 15;
      
      this.healthBarBg.x = this.sprite.x - 10;
      this.healthBarBg.y = this.sprite.y - 15;
      
      // Update health bar width based on health percentage
      const healthPercent = this.sprite.currentHealth / this.sprite.maxHealth;
      this.healthBar.width = Math.max(0, 20 * healthPercent);
      
      // Update color based on health percentage
      let color;
      if (healthPercent === 1) {
        color = { r: 255, g: 255, b: 0 }; // Yellow
      } else {
        // Green to red gradient
        color = Phaser.Display.Color.Interpolate.ColorWithColor(
          { r: 0, g: 255, b: 0 }, // Green
          { r: 255, g: 0, b: 0 }, // Red
          100,
          100 - Math.floor(healthPercent * 100)
        );
      }
      this.healthBar.fillColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
    } catch (error) {
      console.error('Error updating enemy health bar:', error);
    }
  }
  
  /**
   * Apply damage to the enemy
   * @param {number} amount - Damage amount
   * @returns {boolean} - True if enemy died from this damage
   */
  takeDamage(amount) {
    if (!this.sprite || !this.sprite.active) return false;
    
    // Apply damage
    this.sprite.currentHealth = Math.max(0, this.sprite.currentHealth - amount);
    this.currentHealth = this.sprite.currentHealth;
    
    // Update health bar color
    this.updateHealthBar();
    
    // Check if enemy is dead
    if (this.sprite.currentHealth <= 0) {
      this.scene.addScore(this.sprite.value || 10);
      this.destroy();
      return true;
    }
    
    return false;
  }
  
  /**
   * Create visual effect for enemy destruction
   */
  createDestroyEffect() {
    try {
      if (!this.sprite || !this.sprite.active) return;
      
      // Random destruction effect
      const effectType = Phaser.Math.Between(1, 3);
      switch (effectType) {
        case 1: // Pop effect
          this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 0,
            scaleY: 0,
            duration: 300,
            onComplete: () => {
              this.clearHealthBars();
              this.sprite.destroy();
            },
          });
          break;
        case 2: { // Blast effect
          const blast = this.scene.add.circle(this.sprite.x, this.sprite.y, 15, 0xff0000, 0.7);
          this.scene.tweens.add({
            targets: blast,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: () => blast.destroy(),
          });
          this.clearHealthBars();
          this.sprite.destroy();
          break;
        }
        case 3: // Glitch effect
          this.scene.tweens.add({
            targets: this.sprite,
            x: this.sprite.x + Phaser.Math.Between(-10, 10),
            y: this.sprite.y + Phaser.Math.Between(-10, 10),
            duration: 100,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
              this.clearHealthBars();
              this.sprite.destroy();
            },
          });
          break;
      }
    } catch (error) {
      console.error('Error creating enemy destroy effect:', error);
      this.clearHealthBars();
      if (this.sprite && this.sprite.destroy) {
        this.sprite.destroy();
      }
    }
  }
  
  /**
   * Clear health bars
   */
  clearHealthBars() {
    try {
      if (this.healthBar) this.healthBar.destroy();
      if (this.healthBarBg) this.healthBarBg.destroy();
      if (this.sprite) {
        if (this.sprite.healthBar) this.sprite.healthBar.destroy();
        if (this.sprite.healthBarBg) this.sprite.healthBarBg.destroy();
      }
    } catch (error) {
      console.error('Error clearing health bars:', error);
    }
  }
  
  /**
   * Check if enemy is offscreen and should be removed
   */
  isOffscreen() {
    if (!this.sprite || !this.scene.config) return true;
    
    const buffer = 50;
    const bounds = {
      left: -buffer,
      right: this.scene.config.width + buffer,
      top: -buffer,
      bottom: this.scene.config.height + buffer
    };
    
    return (
      this.sprite.x < bounds.left ||
      this.sprite.x > bounds.right ||
      this.sprite.y < bounds.top ||
      this.sprite.y > bounds.bottom
    );
  }
  
  /**
   * Clean up resources used by the enemy
   */
  destroy() {
    this.createDestroyEffect();
  }
}