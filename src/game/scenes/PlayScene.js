import { BaseScene } from './BaseScene';
import Phaser from 'phaser';

export class PlayScene extends BaseScene {
  constructor(config) {
    super('PlayScene', { ...config, canGoBack: true });
    
    // Player properties
    this.player = null;
    this.playerSpeed = 200;
    this.selectedHero = null;
    
    // Game state
    this.score = 0;
    this.level = 1;
    this.wave = 1;
    
    // Health system
    this.playerMaxHealth = 100;
    this.playerCurrentHealth = 100;
    this.playerHealthBar = null;
    this.playerHealthText = null;
    
    // Game objects
    this.enemies = null;
    
    // UI elements
    this.scoreText = null;
    this.levelText = null;
    this.waveText = null;
    
    // Input controls
    this.cursors = null;
    
    // Game settings
    this.enemySpawnRate = 2000; // ms
    this.enemyBaseSpeed = 100;
    this.maxEnemies = 50;
    this.difficultyIncreaseInterval = 10000; // ms
    
    // Damage settings
    this.playerDamageRate = 500; // ms between damage ticks
    this.lastPlayerDamageTime = 0;
    this.enemyContactDamage = 5;
    this.weaponDamage = 10;
  }

  /**
   * Initialize scene with data from previous scene
   * @param {Object} data - Data passed from previous scene
   */
  init(data) {
    this.selectedHero = data.hero || { id: 'knight', name: 'Pixel Knight' };
    this.score = 0;
    this.level = 1;
    this.wave = 1;
    this.playerCurrentHealth = this.playerMaxHealth;
  }

  /**
   * Create game objects, setup physics, and initialize the scene
   */
  create() {
    try {
      // We'll create a simplified version of what BaseScene.create() does
      // instead of calling super.create() which might cause errors
      this.createBackground();
      
      // Create other game elements
      this.createPlayer();
      this.setupEnemies();
      this.createUI();
      this.createHealthBars();
      this.setupInput();
      this.startGameLoop();
    } catch (error) {
      console.error('Error in PlayScene.create:', error);
      // Create minimal fallback UI to show something
      this.createFallbackUI();
    }
  }

  /**
   * Create a background for the scene
   */
  createBackground() {
    // Create a black background
    this.add.rectangle(0, 0, this.config.width, this.config.height, 0x000000)
      .setOrigin(0)
      .setDepth(-1);
      
    // Add scanlines effect (simple version)
    const scanlines = this.add.rectangle(
      0, 0, 
      this.config.width, this.config.height, 
      0x000000, 0.2
    );
    scanlines.setOrigin(0, 0);
  }

  /**
   * Create a fallback UI in case the main create method fails
   */
  createFallbackUI() {
    // Create a simple black background
    this.add.rectangle(0, 0, this.config.width, this.config.height, 0x000000)
      .setOrigin(0);
      
    // Add error message
    const errorText = this.add.text(
      this.config.width / 2,
      this.config.height / 2,
      'Error loading game.\nPress R to restart.',
      {
        fontSize: '24px',
        fill: '#ff0000',
        align: 'center'
      }
    ).setOrigin(0.5);
    
    // Add restart key
    this.input.keyboard.once('keydown-R', () => {
      this.scene.restart();
    });
  }

  /**
   * Create and configure the player character
   */
  createPlayer() {
    try {
      // Create player as a simple shape instead of trying to use a sprite
      // This avoids issues with missing assets
      this.player = this.physics.add.image(
        this.config.width / 2, 
        this.config.height / 2, 
        'pixel' // We'll generate this texture if needed
      );
      
      // If the texture doesn't exist, create a temporary one
      if (!this.textures.exists('pixel')) {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x00ff00); // Green
        graphics.fillRect(0, 0, 30, 30);
        graphics.generateTexture('pixel', 30, 30);
        graphics.destroy();
      }

      // Configure player physics
      this.player.setCollideWorldBounds(true);
      
      // Add health properties as direct properties of the player
      this.player.maxHealth = this.playerMaxHealth;
      this.player.currentHealth = this.playerCurrentHealth;
      this.player.invulnerable = false;
      
    } catch (error) {
      console.error('Error creating player:', error);
      
      // Create a very basic fallback that will at least work
      const graphics = this.add.graphics();
      graphics.fillStyle(0x00ff00); // Green
      graphics.fillRect(0, 0, 30, 30);
      
      // Create a physics-enabled rectangle as the player
      const playerX = this.config.width / 2;
      const playerY = this.config.height / 2;
      
      this.player = this.add.rectangle(playerX, playerY, 30, 30, 0x00ff00);
      this.physics.add.existing(this.player);
      
      // Manually add a flag to track if player is at world bounds
      this.player.body.collideWorldBounds = true;
      
      // Add health properties
      this.player.maxHealth = this.playerMaxHealth;
      this.player.currentHealth = this.playerCurrentHealth;
      this.player.invulnerable = false;
    }
  }

  /**
   * Setup enemy group and collision detection
   */
  setupEnemies() {
    // Create enemy group with physics
    this.enemies = this.physics.add.group();
    
    // Add collision detection between player and enemies
    this.physics.add.collider(
      this.player, 
      this.enemies, 
      this.handlePlayerEnemyCollision, 
      null, 
      this
    );
  }

  /**
   * Create UI elements like score, level indicator, etc.
   */
  createUI() {
    // Score text
    this.scoreText = this.add.text(16, 16, 'Score: 0', { 
      fontSize: '18px', 
      fill: '#00ff00'
    });
    
    // Level text
    this.levelText = this.add.text(16, 46, `Level: ${this.level}`, {
      fontSize: '14px',
      fill: '#00ff00'
    });
    
    // Wave text
    this.waveText = this.add.text(16, 76, `Wave: ${this.wave}`, {
      fontSize: '14px',
      fill: '#00ff00'
    });
    
    // Character info
    this.characterText = this.add.text(
      this.config.width - 16, 
      16, 
      `Hero: ${this.selectedHero.name}`, 
      {
        fontSize: '12px',
        fill: '#00ff00'
      }
    ).setOrigin(1, 0);
  }

  /**
   * Create health bars for player
   */
  createHealthBars() {
    // Create player health bar container
    const healthBarX = 20;
    const healthBarY = this.config.height - 75;
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    
    // Health bar background (black)
    this.add.rectangle(
      healthBarX, 
      healthBarY, 
      healthBarWidth, 
      healthBarHeight, 
      0x000000
    ).setOrigin(0, 0);
    
    // Health bar border (white)
    this.add.rectangle(
      healthBarX, 
      healthBarY, 
      healthBarWidth, 
      healthBarHeight, 
      0xffffff
    ).setOrigin(0, 0).setStrokeStyle(2, 0xffffff, 1);
    
    // Health bar fill (red)
    this.playerHealthBar = this.add.rectangle(
      healthBarX + 2, 
      healthBarY + 2, 
      healthBarWidth - 4, 
      healthBarHeight - 4, 
      0xff0000
    ).setOrigin(0, 0);
    
    // Health text label
    this.add.text(
      healthBarX, 
      healthBarY - 25, 
      'Health', 
      {
        fontSize: '14px',
        fill: '#ffffff'
      }
    );
    
    // Health value text
    this.playerHealthText = this.add.text(
      healthBarX + healthBarWidth + 10, 
      healthBarY + 2, 
      `${this.playerCurrentHealth}/${this.playerMaxHealth}`, 
      {
        fontSize: '12px',
        fill: '#ffffff'
      }
    );
  }

  /**
   * Setup input controls for the game
   */
  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Add WASD keys as alternative controls
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
  }

  /**
   * Start game loop elements like enemy spawning and difficulty scaling
   */
  startGameLoop() {
    // Start spawning enemies
    this.enemySpawnTimer = this.time.addEvent({
      delay: this.enemySpawnRate,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
    
    // Increase difficulty over time
    this.difficultyTimer = this.time.addEvent({
      delay: this.difficultyIncreaseInterval,
      callback: this.increaseDifficulty,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Update game state on each frame
   * @param {number} time - Current time
   * @param {number} delta - Time since last update
   */
  update(time, delta) {
    if (!this.player || !this.player.active) return;
    
    this.handlePlayerMovement();
    this.updateEnemies();
    this.updateHealthBars();
    this.cleanupOffscreenEnemies();
  }

  /**
   * Update health bars for player and enemies
   */
  updateHealthBars() {
    if (!this.playerHealthBar || !this.playerHealthText) return;
    
    // Update player health bar
    const healthPercent = this.playerCurrentHealth / this.playerMaxHealth;
    const barWidth = 196; // 200 - 4 for padding
    this.playerHealthBar.width = Math.max(0, barWidth * healthPercent);
    
    // Update health text
    this.playerHealthText.setText(`${Math.ceil(this.playerCurrentHealth)}/${this.playerMaxHealth}`);
    
    // Update enemy health bars
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.healthBar && enemy.currentHealth) {
        const enemyHealthPercent = enemy.currentHealth / enemy.maxHealth;
        enemy.healthBar.width = Math.max(0, 20 * enemyHealthPercent);
        
        // Position the health bar above the enemy
        enemy.healthBar.x = enemy.x - 10;
        enemy.healthBar.y = enemy.y - 15;
        
        // Position the health bar background
        if (enemy.healthBarBg) {
          enemy.healthBarBg.x = enemy.x - 10;
          enemy.healthBarBg.y = enemy.y - 15;
        }
      }
    });
  }

  /**
   * Handle player movement based on input
   */
  handlePlayerMovement() {
    if (!this.player || !this.player.body) return;
    
    // Reset velocity
    this.player.body.setVelocity(0);
    
    // Horizontal movement (prioritize WASD then arrow keys)
    if (this.wasd.left.isDown || this.cursors.left.isDown) {
      this.player.body.setVelocityX(-this.playerSpeed);
    } else if (this.wasd.right.isDown || this.cursors.right.isDown) {
      this.player.body.setVelocityX(this.playerSpeed);
    }
    
    // Vertical movement (prioritize WASD then arrow keys)
    if (this.wasd.up.isDown || this.cursors.up.isDown) {
      this.player.body.setVelocityY(-this.playerSpeed);
    } else if (this.wasd.down.isDown || this.cursors.down.isDown) {
      this.player.body.setVelocityY(this.playerSpeed);
    }
  }

  /**
   * Update enemy behaviors
   */
  updateEnemies() {
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || !this.player.active) return;
      
      try {
        // Calculate distance to player
        const distance = Phaser.Math.Distance.Between(
          enemy.x, enemy.y,
          this.player.x, this.player.y
        );
        
        // Dynamic speed based on distance (faster when further away)
        const minSpeed = enemy.baseSpeed * 0.5;
        const maxSpeed = enemy.baseSpeed * 1.2;
        const speedFactor = Math.min(1, Math.max(0.5, distance / 300));
        const speed = minSpeed + (maxSpeed - minSpeed) * speedFactor;
        
        // Update enemy direction to follow player
        this.physics.moveToObject(enemy, this.player, speed);
        
      } catch (error) {
        console.error('Error updating enemy:', error);
      }
    });
  }

  /**
   * Clean up enemies that have moved off-screen
   */
  cleanupOffscreenEnemies() {
    // Define a larger boundary to avoid premature destruction
    const buffer = 50;
    const bounds = {
      left: -buffer,
      right: this.config.width + buffer,
      top: -buffer,
      bottom: this.config.height + buffer
    };
    
    this.enemies.getChildren().forEach(enemy => {
      if (
        enemy.x < bounds.left ||
        enemy.x > bounds.right ||
        enemy.y < bounds.top ||
        enemy.y > bounds.bottom
      ) {
        this.destroyEnemy(enemy);
      }
    });
  }

  /**
   * Spawn a new enemy at a random location outside the screen
   */
  spawnEnemy() {
    if (!this.enemies) return;
    
    // Limit maximum number of enemies for performance
    if (this.enemies.getChildren().length >= this.maxEnemies) {
      return;
    }
    
    try {
      // Randomly spawn enemies outside the visible area
      const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      const buffer = 40; // Distance outside the screen
      let x, y;
      
      switch(side) {
        case 0: // top
          x = Phaser.Math.Between(0, this.config.width);
          y = -buffer;
          break;
        case 1: // right
          x = this.config.width + buffer;
          y = Phaser.Math.Between(0, this.config.height);
          break;
        case 2: // bottom
          x = Phaser.Math.Between(0, this.config.width);
          y = this.config.height + buffer;
          break;
        case 3: // left
          x = -buffer;
          y = Phaser.Math.Between(0, this.config.height);
          break;
      }
      
      // Create a red rectangle as enemy
      const enemy = this.add.rectangle(x, y, 20, 20, 0xff0000);
      
      // Add physics to the rectangle
      this.physics.add.existing(enemy);
      
      // Add to the enemies group
      this.enemies.add(enemy);
      
      // Calculate enemy health based on wave
      const scalingFactor = 5; // Health increases by 5 per wave
      enemy.maxHealth = this.enemyBaseHealth + (this.wave * scalingFactor);
      enemy.currentHealth = enemy.maxHealth;
      
      // Add custom properties
      enemy.baseSpeed = this.enemyBaseSpeed * (0.8 + Math.random() * 0.4); // Randomize speed (80-120% of base)
      enemy.damage = 5 + Math.floor(this.wave / 2); // Damage increases with waves
      enemy.value = 10; // Score value
      
      // Create enemy health bar
      this.createEnemyHealthBar(enemy);
      
      // Set initial movement toward the player
      this.physics.moveToObject(enemy, this.player, enemy.baseSpeed);
      
    } catch (error) {
      console.error('Error spawning enemy:', error);
    }
  }

  /**
   * Create health bar for an enemy
   * @param {Phaser.GameObjects.Rectangle} enemy - The enemy to add a health bar to
   */
  createEnemyHealthBar(enemy) {
    // Black background for health bar
    enemy.healthBarBg = this.add.rectangle(
      enemy.x - 10, 
      enemy.y - 15, 
      22, 
      6, 
      0x000000
    );
    
    // Red health bar
    enemy.healthBar = this.add.rectangle(
      enemy.x - 10, 
      enemy.y - 15, 
      20, 
      4, 
      0xff0000
    );
  }

  /**
   * Handle collision between player and enemy
   * @param {Phaser.GameObjects.Rectangle} player - Player object
   * @param {Phaser.GameObjects.Rectangle} enemy - Enemy object
   */
  handlePlayerEnemyCollision(player, enemy) {
    // Check if enough time has passed since last damage
    const currentTime = this.time.now;
    
    // Damage the player if not invulnerable
    if (!player.invulnerable && currentTime - this.lastPlayerDamageTime > this.playerDamageRate) {
      this.lastPlayerDamageTime = currentTime;
      
      // Calculate damage based on enemy properties and game state
      const baseDamage = enemy.damage || this.enemyContactDamage;
      const levelMultiplier = 1 - (this.level * 0.01); // Damage reduction with level
      const finalDamage = Math.max(1, Math.round(baseDamage * levelMultiplier)); 
      
      this.damagePlayer(finalDamage);
      
      // Visual feedback
      this.cameras.main.shake(100, 0.01);
    }
    
    // Always damage the enemy when colliding with player
    this.damageEnemy(enemy, 5); // Small damage on collision
  }

  /**
   * Damage the player
   * @param {number} amount - Damage amount
   */
  damagePlayer(amount) {
    // Skip if player is invulnerable
    if (this.player.invulnerable) return;
    
    // Apply damage
    this.playerCurrentHealth = Math.max(0, this.playerCurrentHealth - amount);
    this.player.currentHealth = this.playerCurrentHealth;
    
    // Make player flash red
    this.player.setTint(0xff0000);
    
    // Make player temporarily invulnerable
    this.player.invulnerable = true;
    
    // Reset after invulnerability period
    this.time.delayedCall(1000, () => {
      if (this.player && this.player.active) {
        this.player.clearTint();
        this.player.invulnerable = false;
      }
    });
    
    // Check for game over
    if (this.playerCurrentHealth <= 0) {
      this.gameOver();
    }
  }

  /**
   * Damage an enemy
   * @param {Phaser.GameObjects.Rectangle} enemy - The enemy to damage
   * @param {number} amount - Damage amount
   */
  damageEnemy(enemy, amount) {
    if (!enemy || !enemy.active) return;
    
    // Calculate damage based on player level
    const levelBonus = this.level * 0.2; // 20% more damage per level
    const finalDamage = Math.round(amount * (1 + levelBonus));
    
    // Apply damage
    enemy.currentHealth -= finalDamage;
    
    // Flash enemy red
    enemy.setTint(0xff0000);
    this.time.delayedCall(100, () => {
      if (enemy && enemy.active) {
        enemy.clearTint();
      }
    });
    
    // Check if enemy is defeated
    if (enemy.currentHealth <= 0) {
      this.addScore(enemy.value || 10);
      this.destroyEnemy(enemy);
    }
  }

  /**
   * Clean up and destroy an enemy
   * @param {Phaser.GameObjects.Rectangle} enemy - The enemy to destroy
   */
  destroyEnemy(enemy) {
    try {
      // Destroy health bars
      if (enemy.healthBar) {
        enemy.healthBar.destroy();
      }
      if (enemy.healthBarBg) {
        enemy.healthBarBg.destroy();
      }
      
      // Create death effect
      this.createCollisionEffect(enemy.x, enemy.y);
      
      // Destroy the enemy
      enemy.destroy();
    } catch (error) {
      console.error('Error destroying enemy:', error);
    }
  }

  /**
   * Create visual effect at collision point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  createCollisionEffect(x, y) {
    // Create a simple circle effect
    const effect = this.add.circle(x, y, 15, 0xff0000, 0.7);
    this.tweens.add({
      targets: effect,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => effect.destroy()
    });
  }

  /**
   * Add points to score and update UI
   * @param {number} points - Points to add
   */
  addScore(points) {
    this.score += points;
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${this.score}`);
    }
    
    // Check for level up condition
    if (this.score >= this.level * 100) {
      this.levelUp();
    }
  }

  /**
   * Increase player level and difficulty
   */
  levelUp() {
    this.level++;
    if (this.levelText) {
      this.levelText.setText(`Level: ${this.level}`);
    }
    
    // Increase wave after certain levels
    if (this.level % 3 === 0) {
      this.wave++;
      if (this.waveText) {
        this.waveText.setText(`Wave: ${this.wave}`);
      }
      
      // Increase player max health with each wave
      const oldMaxHealth = this.playerMaxHealth;
      this.playerMaxHealth += 20; // Add 20 health per wave
      
      // Also heal the player a bit on wave completion
      this.playerCurrentHealth = Math.min(
        this.playerMaxHealth, 
        this.playerCurrentHealth + (this.playerMaxHealth * 0.3)
      );
      
      // Update text
      if (this.playerHealthText) {
        this.playerHealthText.setText(`${Math.ceil(this.playerCurrentHealth)}/${this.playerMaxHealth}`);
      }
    }
    
    // Visual feedback for level up
    try {
      this.cameras.main.flash(500, 0, 255, 0, 0.3);
    } catch (error) {
      console.error('Error flashing camera:', error);
    }
    
    // Increase player abilities
    this.playerSpeed = Math.min(300, this.playerSpeed + 10);
    
    // Create level up effect
    this.createLevelUpEffect();
  }

  /**
   * Create visual effect for level up
   */
  createLevelUpEffect() {
    try {
      const text = this.add.text(
        this.player.x,
        this.player.y - 50,
        'LEVEL UP!',
        {
          fontSize: '24px',
          fill: '#00ff00',
          stroke: '#000',
          strokeThickness: 4
        }
      ).setOrigin(0.5);
      
      this.tweens.add({
        targets: text,
        y: text.y - 30,
        alpha: 0,
        duration: 1500,
        ease: 'Power2',
        onComplete: () => text.destroy()
      });
    } catch (error) {
      console.error('Error creating level up effect:', error);
    }
  }

  /**
   * Increase game difficulty over time
   */
  increaseDifficulty() {
    // Increase enemy spawn rate
    const newDelay = Math.max(500, this.enemySpawnRate - 100);
    if (newDelay !== this.enemySpawnRate) {
      this.enemySpawnRate = newDelay;
      if (this.enemySpawnTimer) {
        this.enemySpawnTimer.delay = this.enemySpawnRate;
      }
    }
    
    // Increase enemy speed
    this.enemyBaseSpeed = Math.min(200, this.enemyBaseSpeed + 5);
  }

  /**
   * Handle game over state
   */
  gameOver() {
    try {
      // Stop enemy spawning
      if (this.enemySpawnTimer) {
        this.enemySpawnTimer.remove();
      }
      if (this.difficultyTimer) {
        this.difficultyTimer.remove();
      }
      
      // Create game over text
      const gameOverText = this.add.text(
        this.config.width / 2,
        this.config.height / 2 - 50,
        'GAME OVER',
        {
          fontSize: '48px',
          fill: '#ff0000',
          stroke: '#000',
          strokeThickness: 6
        }
      ).setOrigin(0.5);
      
      // Add final score
      const finalScoreText = this.add.text(
        this.config.width / 2,
        this.config.height / 2 + 20,
        `Final Score: ${this.score}`,
        {
          fontSize: '24px',
          fill: '#ffffff',
          stroke: '#000',
          strokeThickness: 4
        }
      ).setOrigin(0.5);
      
      // Add restart button
      const restartButton = this.add.text(
        this.config.width / 2,
        this.config.height / 2 + 80,
        'RESTART',
        {
          fontSize: '24px',
          fill: '#00ff00',
          stroke: '#000',
          strokeThickness: 4,
          padding: { x: 20, y: 10 }
        }
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => restartButton.setStyle({ fill: '#ff00ff' }))
      .on('pointerout', () => restartButton.setStyle({ fill: '#00ff00' }))
      .on('pointerdown', () => this.scene.restart());
    } catch (error) {
      console.error('Error showing game over screen:', error);
      
      // Fallback restart option
      this.input.keyboard.once('keydown-R', () => {
        this.scene.restart();
      });
    }
  }
}