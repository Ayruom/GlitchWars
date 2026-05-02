// filepath: /Users/mouryagandalla/Documents/Projects/Hackathon1/retro-pixel-app/retro-pixel-app/src/game/managers/CollisionManager.js
import Phaser from 'phaser';

/**
 * CollisionManager class to handle all collision detection and responses
 */
export class CollisionManager {
  /**
   * Create a new collision manager
   * @param {Phaser.Scene} scene - The scene to handle collisions for
   * @param {Object} config - Configuration for the collision manager
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    
    // Store references to game objects
    this.player = null;
    this.enemies = null;
    
    // Collision settings
    this.playerDamageRate = config.playerDamageRate || 500; // ms between damage ticks
    this.lastPlayerDamageTime = 0;
    this.enemyContactDamage = config.enemyContactDamage || 5;
    this.weaponDamage = config.weaponDamage || 10;
    
    // Flag for active state
    this.active = false;
  }
  
  /**
   * Set up collision detection between player and enemies
   * @param {Player} player - Player object
   * @param {Phaser.GameObjects.Group} enemies - Enemy group
   */
  setup(player, enemies) {
    this.player = player;
    this.enemies = enemies;
    
    if (!player || !enemies) {
      console.warn('CollisionManager: Missing player or enemies');
      return this;
    }
    
    // Set up physics collision between player and enemies
    this.setupPlayerEnemyCollision();
    
    // Set active
    this.active = true;
    
    return this;
  }
  
  /**
   * Set up player-enemy collision
   * @private
   */
  setupPlayerEnemyCollision() {
    if (!this.player || !this.player.sprite || !this.enemies) {
      return;
    }
    
    // Add collision between player and enemies
    this.playerEnemyCollider = this.scene.physics.add.overlap(
      this.player.sprite,
      this.enemies,
      this.handlePlayerEnemyCollision,
      null,
      this
    );
    
  }
  
  /**
   * Handle collision between player and enemy
   * @param {Phaser.GameObjects.Sprite} playerSprite - Player sprite
   * @param {Phaser.GameObjects.Sprite} enemy - Enemy that collided with player
   * @private
   */
  handlePlayerEnemyCollision(playerSprite, enemy) {
    // Skip if game is paused or manager is inactive
    if (!this.active || this.scene.physics.world.isPaused) {
      return;
    }
    
    // Check rate limiting for damage
    const now = this.scene.time.now;
    if (now - this.lastPlayerDamageTime < this.playerDamageRate) {
      return;
    }
    
    // Apply damage to player
    const damage = this.enemyContactDamage;
    const died = this.player.takeDamage(damage);
    
    // Update last damage time
    this.lastPlayerDamageTime = now;
    
    // Create collision effect at the contact point (but no damage numbers)
    if (this.scene.effectsHelper) {
      this.scene.effectsHelper.createCollisionEffect(enemy.x, enemy.y);
      // Removed the damage number creation
    }
    
    // Notify the player died if needed
    if (died && this.scene.gameOver) {
      this.scene.gameOver();
    }
  }
  
  /**
   * Apply damage to an enemy
   * @param {Phaser.GameObjects.Sprite} enemy - Enemy to damage
   * @param {number} damage - Damage amount
   * @returns {boolean} - True if enemy was destroyed
   */
  damageEnemy(enemy, damage = this.weaponDamage) {
    if (!enemy || !enemy.active) {
      return false;
    }
    
    // If enemy has a takeDamage method, use it
    if (typeof enemy.takeDamage === 'function') {
      return enemy.takeDamage(damage);
    }
    
    // Otherwise try to access health property directly
    if (enemy.health !== undefined) {
      enemy.health -= damage;
      
      // Check if enemy is dead
      if (enemy.health <= 0) {
        this.destroyEnemy(enemy);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Handle enemy destruction and rewards
   * @param {Phaser.GameObjects.Sprite} enemy - Enemy to destroy
   * @private
   */
  destroyEnemy(enemy) {
    if (!enemy || !enemy.active) {
      return;
    }
    
    // Create death effect if available
    if (this.scene.effectsHelper) {
      this.scene.effectsHelper.createExplosion(enemy.x, enemy.y);
    }
    
    // Award score if level manager is available
    if (this.scene.levelManager) {
      // Base points for enemy kill
      const basePoints = enemy.points || 10;
      this.scene.levelManager.addScore(basePoints);
    }
    
    // Destroy the enemy sprite
    enemy.destroy();
  }
  
  /**
   * Update collision manager state
   * @param {number} time - Current game time
   * @param {number} delta - Time since last update
   */
  update(time, delta) {
    // Nothing to update in the base implementation
    // This is here in case we need to add dynamic collision checking
  }
  
  /**
   * Pause collision detection
   */
  pause() {
    this.active = false;
    if (this.playerEnemyCollider) {
      this.playerEnemyCollider.active = false;
    }
  }
  
  /**
   * Resume collision detection
   */
  resume() {
    this.active = true;
    if (this.playerEnemyCollider) {
      this.playerEnemyCollider.active = true;
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    if (this.playerEnemyCollider) {
      this.playerEnemyCollider.destroy();
    }
    
    this.player = null;
    this.enemies = null;
    this.active = false;
  }
}