// filepath: /Users/mouryagandalla/Documents/Projects/Hackathon1/retro-pixel-app/retro-pixel-app/src/game/managers/EnemyManager.js
import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';

export class EnemyManager {
  static RAMP_DURATION_MS = 1500;
  static RAMP_START_FRACTION = 0.35;
  static SEPARATION_RADIUS = 60;
  static SEPARATION_STRENGTH = 0.8;

  constructor(scene) {
    this.scene = scene;

    // Enemy properties
    this.enemies = null;
    this.enemyBaseHealth = 40; // Wave 1 minimum per the health formula (40 × wave)
    this.enemySpawnRate = scene.enemySpawnRate || 2000; // ms
    this.enemyBaseSpeed = scene.enemyBaseSpeed || 100;
    this.maxEnemies = scene.maxEnemies || 50;

    // Game level properties for scaling
    this.level = scene.level || 1;
    this.wave = scene.wave || 1;

    // Wave lifecycle state
    this.wavePhase = 'SPAWNING'; // SPAWNING | DRAINING | COMPLETE
    this.enemiesPerWave = 10 + (2 * this.wave);
    this.enemiesSpawnedThisWave = 0;
    this.enemiesKilledThisWave = 0;
    this.onWaveCompleteCallback = null;

    // Prevents onWaveComplete from firing during scene teardown
    this.active = true;

    // Sprite keys
    this.enemyLeftKey = 'enemyLeft';
    this.enemyRightKey = 'enemyRight';

    // Setup enemy group
    this.setupEnemies();
  }
  
  /**
   * Setup the enemy group with physics
   */
  setupEnemies() {
    // Create enemy group with physics
    this.enemies = this.scene.physics.add.group();
    
    // Get the player reference - ensure we access the sprite if player is a Player class instance
    const player = this.scene.player;
    
    if (player) {
      const playerTarget = player.sprite || player;

      // Add collision detection between player and enemies
      this.scene.physics.add.collider(
        playerTarget,
        this.enemies,
        this.handlePlayerEnemyCollision,
        null,
        this
      );

      // Add overlap detection as a backup in case collider fails
      this.scene.physics.add.overlap(
        playerTarget,
        this.enemies,
        this.handlePlayerEnemyCollision,
        null,
        this
      );
    }
  }
  
  /**
   * Start spawning enemies at a specified rate
   */
  startWave(wave) {
    this.wave = wave;
    this.wavePhase = 'SPAWNING';
    this.enemiesPerWave = 10 + (2 * this.wave);
    this.enemiesSpawnedThisWave = 0;
    this.enemiesKilledThisWave = 0;

    if (this.enemySpawnTimer) {
      this.enemySpawnTimer.remove();
    }

    this.enemySpawnTimer = this.scene.time.addEvent({
      delay: this.enemySpawnRate,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
  }

  startSpawning() {
    this.startWave(this.wave);
  }
  
  /**
   * Stop spawning enemies
   */
  stopSpawning() {
    if (this.enemySpawnTimer) {
      this.enemySpawnTimer.remove();
      this.enemySpawnTimer = null;
    }
  }
  
  onWaveComplete(callback) {
    this.onWaveCompleteCallback = callback;
  }

  /**
   * Update the spawn rate (typically based on difficulty)
   * @param {number} newRate - New spawn rate in milliseconds
   */
  updateSpawnRate(newRate) {
    this.enemySpawnRate = newRate;
    
    // Update the timer if it exists
    if (this.enemySpawnTimer) {
      this.enemySpawnTimer.delay = this.enemySpawnRate;
    }
  }
  
  /**
   * Spawn a new enemy at a random location outside the screen
   */
  spawnEnemy() {
    try {
      if (!this.enemies || !this.scene.player || !this.scene.player.sprite) return;

      if (this.wavePhase !== 'SPAWNING') return;

      // Limit maximum number of enemies for performance
      if (this.enemies.getChildren().length >= this.maxEnemies) {
        return;
      }

      if (this.enemiesSpawnedThisWave >= this.enemiesPerWave) {
        this.wavePhase = 'DRAINING';
        this.stopSpawning();
        return;
      }

      this.enemiesSpawnedThisWave++;

      // Randomly spawn enemies outside the visible area
      const side = Math.floor(Math.random() * 4);
      const buffer = 40;
      let x, y;
      let spriteKey;
      
      const sceneWidth = this.scene.scale.width;
      const sceneHeight = this.scene.scale.height;

      switch(side) {
        case 0: // top
          x = Phaser.Math.Between(0, sceneWidth);
          y = -buffer;
          spriteKey = (x < this.scene.player.sprite.x) ? this.enemyRightKey : this.enemyLeftKey;
          break;
        case 1: // right
          x = sceneWidth + buffer;
          y = Phaser.Math.Between(0, sceneHeight);
          spriteKey = this.enemyLeftKey;
          break;
        case 2: // bottom
          x = Phaser.Math.Between(0, sceneWidth);
          y = sceneHeight + buffer;
          spriteKey = (x < this.scene.player.sprite.x) ? this.enemyRightKey : this.enemyLeftKey;
          break;
        case 3: // left
          x = -buffer;
          y = Phaser.Math.Between(0, sceneHeight);
          spriteKey = this.enemyRightKey;
          break;
      }
      
      // Health formula: Wave 1 = 40 HP (2 Archer hits), scales linearly per wave
      const HEALTH_PER_WAVE = 40;
      const LEVEL_HEALTH_STEP = 2;
      const maxHealth = (HEALTH_PER_WAVE * this.wave) + (LEVEL_HEALTH_STEP * (this.level - 1));
      
      const baseSpeed = this.enemyBaseSpeed;
      const damage = 5 + Math.floor(this.wave * 1.5) + Math.floor(this.level * 0.5);
      const value = 10 + Math.floor(this.wave * 2);
      
      // Create the enemy with the configured properties
      const enemy = new Enemy(this.scene, x, y, {
        spriteKey: spriteKey,
        maxHealth: maxHealth,
        speed: baseSpeed,
        damage: damage,
        value: value,
        side: side
      });
      
      // Add the enemy sprite to the group
      this.enemies.add(enemy.sprite);
    } catch (error) {
      console.error('Error spawning enemy:', error);
    }
  }
  
  /**
   * Update all enemies (movement, health bars, etc.)
   */
  update() {
    try {
      // Get all enemy sprites from the group
      const enemies = this.enemies.getChildren();
      
      // Update each enemy
      for (let i = 0; i < enemies.length; i++) {
        const enemySprite = enemies[i];
        
        // Skip if not active
        if (!enemySprite.active) continue;
        
        // Handle off-screen enemies
        if (this.isEnemyOffscreen(enemySprite)) {
          this.destroyEnemy(enemySprite);
          continue;
        }
        
        // Update movement toward player
        this.updateEnemyMovement(enemySprite);
        
        // Update health bar position
        this.updateEnemyHealthBar(enemySprite);
      }
    } catch (error) {
      console.error('Error updating enemies:', error);
    }
  }
  
  /**
   * Check if an enemy is off-screen and should be removed
   * @param {Phaser.GameObjects.Sprite} enemySprite - The enemy sprite to check
   * @returns {boolean} - True if the enemy is off-screen
   */
  isEnemyOffscreen(enemySprite) {
    const buffer = 50;
    const bounds = {
      left: -buffer,
      right: this.scene.scale.width + buffer,
      top: -buffer,
      bottom: this.scene.scale.height + buffer
    };
    
    return (
      enemySprite.x < bounds.left ||
      enemySprite.x > bounds.right ||
      enemySprite.y < bounds.top ||
      enemySprite.y > bounds.bottom
    );
  }
  
  /**
   * Update enemy movement toward the player
   * @param {Phaser.GameObjects.Sprite} enemySprite - The enemy sprite to update
   */
  updateEnemyMovement(enemySprite) {
    try {
      if (!enemySprite.active || !this.scene.player || !this.scene.player.sprite) return;
      
      const player = this.scene.player.sprite || this.scene.player;
      if (!player.active) return;
      
      // Calculate distance to player
      const distance = Phaser.Math.Distance.Between(
        enemySprite.x, enemySprite.y,
        player.x, player.y
      );
      
      // Update sprite based on position relative to player
      if (enemySprite.x < player.x) {
        if (enemySprite.setTexture) {
          try {
            enemySprite.setTexture(this.enemyRightKey);
          } catch (err) {
            console.debug('Failed to set enemy texture:', err);
          }
        }
      } else {
        if (enemySprite.setTexture) {
          try {
            enemySprite.setTexture(this.enemyLeftKey);
          } catch (err) {
            console.debug('Failed to set enemy texture:', err);
          }
        }
      }
      
      // Ramp speed from RAMP_START_FRACTION up to full over RAMP_DURATION_MS
      const baseSpeed = enemySprite.baseSpeed || this.enemyBaseSpeed;
      const elapsed = this.scene.time.now - (enemySprite.spawnTime || this.scene.time.now);
      const rampT = Math.min(1, elapsed / EnemyManager.RAMP_DURATION_MS);
      const rampMultiplier = EnemyManager.RAMP_START_FRACTION + (1 - EnemyManager.RAMP_START_FRACTION) * rampT;
      const speed = baseSpeed * rampMultiplier;

      const dx = player.x - enemySprite.x;
      const dy = player.y - enemySprite.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      let vx = (dx / len) * speed;
      let vy = (dy / len) * speed;

      this.enemies.getChildren().forEach((other) => {
        if (other === enemySprite || !other.active) return;
        const sx = enemySprite.x - other.x;
        const sy = enemySprite.y - other.y;
        const dist = Math.sqrt(sx * sx + sy * sy) || 1;
        if (dist < EnemyManager.SEPARATION_RADIUS) {
          const push = (EnemyManager.SEPARATION_RADIUS - dist) / EnemyManager.SEPARATION_RADIUS;
          vx += (sx / dist) * push * EnemyManager.SEPARATION_STRENGTH * speed;
          vy += (sy / dist) * push * EnemyManager.SEPARATION_STRENGTH * speed;
        }
      });

      const finalLen = Math.sqrt(vx * vx + vy * vy) || 1;
      enemySprite.body.setVelocity((vx / finalLen) * speed, (vy / finalLen) * speed);
    } catch (error) {
      console.error('Error updating enemy movement:', error);
    }
  }
  
  /**
   * Update enemy health bar position and appearance
   * @param {Phaser.GameObjects.Sprite} enemySprite - The enemy sprite to update
   */
  updateEnemyHealthBar(enemySprite) {
    try {
      if (!enemySprite.healthBar || !enemySprite.healthBarBg) return;
      
      // Position the health bar above the enemy
      enemySprite.healthBar.x = enemySprite.x - 10;
      enemySprite.healthBar.y = enemySprite.y - 15;
      
      // Position the health bar background
      enemySprite.healthBarBg.x = enemySprite.x - 10;
      enemySprite.healthBarBg.y = enemySprite.y - 15;
      
      // Update health bar width
      if (enemySprite.currentHealth !== undefined && enemySprite.maxHealth) {
        const healthPercent = enemySprite.currentHealth / enemySprite.maxHealth;
        enemySprite.healthBar.width = Math.max(0, 20 * healthPercent);
        
        // Update health bar color based on percentage
        let color;
        if (healthPercent === 1) {
          color = { r: 255, g: 255, b: 0 }; // Yellow at full health
        } else {
          // Green to red gradient
          color = Phaser.Display.Color.Interpolate.ColorWithColor(
            { r: 0, g: 255, b: 0 }, // Green
            { r: 255, g: 0, b: 0 }, // Red
            100,
            100 - Math.floor(healthPercent * 100)
          );
        }
        enemySprite.healthBar.fillColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
      }
    } catch (error) {
      console.error('Error updating enemy health bar:', error);
    }
  }
  
  /**
   * Handle collision between player and enemy
   * @param {Phaser.GameObjects.Sprite} playerSprite - Player sprite
   * @param {Phaser.GameObjects.Sprite} enemySprite - Enemy sprite
   */
  handlePlayerEnemyCollision(playerSprite, enemySprite) {
    try {
      const currentTime = this.scene.time.now;
      
      // Set up last damage time if it doesn't exist
      if (!this.scene.lastPlayerDamageRate) {
        this.scene.playerDamageRate = 500; // Default damage cooldown
      }
      
      if (!this.scene.lastPlayerDamageTime) {
        this.scene.lastPlayerDamageTime = 0;
      }
      
      // Check if player can take damage (not invulnerable and not on cooldown)
      const playerInvulnerable = this.scene.player && this.scene.player.invulnerable;
      if (!playerInvulnerable && 
          currentTime - this.scene.lastPlayerDamageTime > (this.scene.playerDamageRate || 500)) {
        
        this.scene.lastPlayerDamageTime = currentTime;
        const baseDamage = enemySprite.damage || 5; // Default damage if not set
        const level = this.level || 1;
        const levelMultiplier = 1 + (level * 0.05); // Increase damage with level
        const finalDamage = Math.max(1, Math.round(baseDamage * levelMultiplier));
        
        // Use the PlayScene damagePlayer method we've created
        if (typeof this.scene.damagePlayer === 'function') {
          this.scene.damagePlayer(finalDamage);
        } else {
          // Fallback to direct player damage if the method doesn't exist
          console.warn('damagePlayer method not found on scene, using direct damage');
          if (this.scene.player && typeof this.scene.player.takeDamage === 'function') {
            this.scene.player.takeDamage(finalDamage);
          }
        }
        
        // Add screen shake effect
        try {
          this.scene.cameras.main.shake(100, 0.01);
        } catch (e) {
          console.warn('Camera shake failed:', e);
        }
      }
      
      // Damage the enemy every 5ms of contact
      if (!enemySprite.lastDamageTime || currentTime - enemySprite.lastDamageTime >= 5) {
        enemySprite.lastDamageTime = currentTime;
        if (enemySprite.currentHealth === undefined) {
          enemySprite.currentHealth = enemySprite.maxHealth || this.enemyBaseHealth;
        }
        const damage = (enemySprite.maxHealth || this.enemyBaseHealth) * 0.1; // 10% of max health
        this.damageEnemy(enemySprite, damage);
      }
    } catch (error) {
      console.error('Error in collision handler:', error);
    }
  }
  
  /**
   * Damage an enemy
   * @param {Phaser.GameObjects.Sprite} enemySprite - The enemy to damage
   * @param {number} amount - Damage amount
   */
  damageEnemy(enemySprite, amount) {
    try {
      if (!enemySprite || !enemySprite.active) return;
      
      enemySprite.currentHealth = Math.max(0, enemySprite.currentHealth - amount);
      
      // Update health bar color
      this.updateEnemyHealthBar(enemySprite);
      
      if (enemySprite.currentHealth <= 0) {
        enemySprite.active = false;
        if (this.scene.levelManager) {
          this.scene.levelManager.addScore(enemySprite.value || 10);
        } else {
          console.warn('LevelManager not found, could not add score');
        }
        this.destroyEnemy(enemySprite);
      }
    } catch (error) {
      console.error('Error damaging enemy:', error);
      this.destroyEnemy(enemySprite);
    }
  }
  
  /**
   * Clean up and destroy an enemy with random effects
   * @param {Phaser.GameObjects.Sprite} enemySprite - The enemy to destroy
   */
  destroyEnemy(enemySprite) {
    try {
      // Clean up health bars
      if (enemySprite.healthBar) enemySprite.healthBar.destroy();
      if (enemySprite.healthBarBg) enemySprite.healthBarBg.destroy();

      // Count every removal (kill or offscreen) toward wave completion
      this.enemiesKilledThisWave++;
      if (
        this.active &&
        this.scene.sys.isActive() &&
        this.wavePhase === 'DRAINING' &&
        this.enemiesKilledThisWave >= this.enemiesPerWave
      ) {
        this.wavePhase = 'COMPLETE';
        if (typeof this.onWaveCompleteCallback === 'function') {
          this.onWaveCompleteCallback(this.wave);
        }
      }

      // Random destruction effect
      const effectType = Phaser.Math.Between(1, 3);
      switch (effectType) {
        case 1: // Pop effect
          this.scene.tweens.add({
            targets: enemySprite,
            scaleX: 0,
            scaleY: 0,
            duration: 300,
            onComplete: () => enemySprite.destroy(),
          });
          break;
        case 2: { // Blast effect
          const blast = this.scene.add.circle(enemySprite.x, enemySprite.y, 15, 0xff0000, 0.7);
          this.scene.tweens.add({
            targets: blast,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: () => blast.destroy(),
          });
          enemySprite.destroy();
          break;
        }
        case 3: // Glitch effect
          this.scene.tweens.add({
            targets: enemySprite,
            x: enemySprite.x + Phaser.Math.Between(-10, 10),
            y: enemySprite.y + Phaser.Math.Between(-10, 10),
            duration: 100,
            yoyo: true,
            repeat: 3,
            onComplete: () => enemySprite.destroy(),
          });
          break;
      }
    } catch (error) {
      console.error('Error destroying enemy:', error);
      if (enemySprite && enemySprite.destroy) {
        enemySprite.destroy();
      }
    }
  }
  
  /**
   * Clear all enemies from the screen
   */
  clearAllEnemies() {
    try {
      const enemies = this.enemies.getChildren();
      for (let i = 0; i < enemies.length; i++) {
        this.destroyEnemy(enemies[i]);
      }
    } catch (error) {
      console.error('Error clearing enemies:', error);
    }
  }
  
  /**
   * Update level and wave properties for enemy scaling
   * @param {number} level - Current game level
   * @param {number} wave - Current game wave
   */
  updateDifficulty(level, wave) {
    this.level = level;
    this.wave = wave;
    
    // Update enemy properties based on difficulty
    // enemyBaseHealth is NOT updated here — health is computed fresh in spawnEnemy to avoid double-scaling
    // enemyBaseSpeed is intentionally not scaled — speed is constant across all waves (100 px/s)
  }
  
  /**
   * Get the number of currently active enemies
   * @returns {number} - Number of active enemies
   */
  getEnemyCount() {
    return this.enemies ? this.enemies.getChildren().length : 0;
  }
  
  /**
   * Clean up resources before scene shutdown
   */
  destroy() {
    this.active = false;
    this.stopSpawning();
    this.clearAllEnemies();
  }
}