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
    this.maxHealthCap = 200; // Maximum possible health cap
    this.healthIncreaseAmount = 10; // Smaller health increase per wave
    
    // Game objects
    this.enemies = null;
    
    // UI elements
    this.scoreText = null;
    this.levelText = null;
    this.waveText = null;
    
    // Input controls
    this.cursors = null;
    
    // Game settings
    this.enemyBaseHealth = 100;
    this.enemySpawnRate = 2000; // ms
    this.enemyBaseSpeed = 100;
    this.maxEnemies = 50;
    this.difficultyIncreaseInterval = 10000; // ms
    
    // Damage settings
    this.playerDamageRate = 500; // ms between damage ticks
    this.lastPlayerDamageTime = 0;
    this.enemyContactDamage = 5;
    this.weaponDamage = 10;
    
    // Score settings
    this.baseScoreToLevel = 200; // Base score needed to level up
    this.levelScoreMultiplier = 1.5; // Score requirement increases by 50% each level
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
      // Create a black background
      this.add.rectangle(0, 0, this.config.width, this.config.height, 0x000000)
        .setOrigin(0)
        .setDepth(-1);
      
      // Pre-load the wizard image first
      this.load.image('playerCharacter', '/assets/Wizards/Male/Wizard Male2 60X60.png');
      
      // Once the image is loaded, set up the game elements
      this.load.once('complete', () => {
        this.createPlayer();
        this.setupEnemies();
        this.createUI();
        this.createHealthBars();
        this.setupInput();
        this.startGameLoop();
      });
      
      // Start the loader
      this.load.start();
    } catch (error) {
      console.error('Error in PlayScene.create:', error);
      // Create minimal fallback UI to show something
      this.createFallbackUI();
    }
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
      // Create the player using the wizard sprite
      this.player = this.add.sprite(
        this.config.width / 2,
        this.config.height / 2,
        'playerCharacter'
      );
      
      // Set the size of the player sprite
      this.player.setDisplaySize(60, 60);
      
      // Add physics to the sprite
      this.physics.add.existing(this.player);
      
      // Set world bounds collision
      this.player.body.collideWorldBounds = true;
      
      // Add health properties as direct properties of the player
      this.player.maxHealth = this.playerMaxHealth;
      this.player.currentHealth = this.playerCurrentHealth;
      this.player.invulnerable = false;
    } catch (error) {
      console.error('Error creating player:', error);
      // Fallback to a rectangle if image loading fails
      this.createFallbackPlayer();
    }
  }
  
  /**
   * Create a fallback player if the image loading fails
   */
  createFallbackPlayer() {
    // Create a green rectangle as the player (fallback)
    this.player = this.add.rectangle(
      this.config.width / 2,
      this.config.height / 2,
      30, 30,
      0x00ff00
    );
    
    // Add physics to the rectangle
    this.physics.add.existing(this.player);
    
    // Set world bounds collision
    this.player.body.collideWorldBounds = true;
    
    // Add health properties as direct properties of the player
    this.player.maxHealth = this.playerMaxHealth;
    this.player.currentHealth = this.playerCurrentHealth;
    this.player.invulnerable = false;
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
    const baseFontSize = Math.max(12, Math.min(18, this.config.width / 50));
    
    // Score text
    this.scoreText = this.add.text(16, 16, 'Score: 0', { 
      fontSize: `${baseFontSize}px`, 
      fill: '#00ff00'
    });
    
    // Level text
    this.levelText = this.add.text(16, 16 + baseFontSize + 10, `Level: ${this.level}`, {
      fontSize: `${baseFontSize}px`,
      fill: '#00ff00'
    });
    
    // Wave text
    this.waveText = this.add.text(16, 16 + (baseFontSize + 10) * 2, `Wave: ${this.wave}`, {
      fontSize: `${baseFontSize}px`,
      fill: '#00ff00'
    });
    
    // Character info
    this.characterText = this.add.text(
      this.config.width - 16, 
      16, 
      `Hero: ${this.selectedHero.name}`, 
      {
        fontSize: `${baseFontSize}px`,
        fill: '#00ff00'
      }
    ).setOrigin(1, 0);
  }

  /**
   * Create health bars for player and enemies
   */
  createHealthBars() {
    const healthBarWidth = Math.max(150, Math.min(200, this.config.width / 6));
    const healthBarHeight = Math.max(15, Math.min(20, this.config.height / 30));
    const healthBarY = this.config.height - healthBarHeight - 20;
    const baseFontSize = Math.max(12, Math.min(18, this.config.width / 50));
    
    // Health bar background (black)
    this.playerHealthBarBg = this.add.rectangle(
      10, 
      healthBarY, 
      healthBarWidth, 
      healthBarHeight, 
      0x000000
    ).setOrigin(0, 0);
    
    // Health bar border (white)
    this.playerHealthBarBorder = this.add.rectangle(
      10, 
      healthBarY, 
      healthBarWidth, 
      healthBarHeight, 
      0x000000
    ).setOrigin(0, 0)
    .setStrokeStyle(2, 0xffffff, 1);
    
    // Health bar fill (starts green)
    this.playerHealthBar = this.add.rectangle(
      12, // +2 padding from left
      healthBarY + 2, // +2 padding from top
      healthBarWidth - 4, // -4 for left and right padding
      healthBarHeight - 4, // -4 for top and bottom padding
      0x00ff00
    ).setOrigin(0, 0);
    
    // Store the initial width for scaling
    this.playerHealthBarInitialWidth = healthBarWidth - 4;
    
    // Health text label
    this.healthLabel = this.add.text(
      10, 
      healthBarY - baseFontSize - 5, 
      'Health', 
      {
        fontSize: `${baseFontSize}px`,
        fill: '#ffffff'
      }
    );
    
    // Health value text
    this.playerHealthText = this.add.text(
      10 + healthBarWidth + 10, 
      healthBarY + 2, 
      `${this.playerCurrentHealth}/${this.playerMaxHealth}`, 
      {
        fontSize: `${baseFontSize}px`,
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
    try {
      if (!this.player || !this.player.body) return;
      
      this.handlePlayerMovement();
      this.updateEnemies();
      this.updateHealthBars();
      this.cleanupOffscreenEnemies();
      this.updateUIPositions();
    } catch (error) {
      console.error('Error in update loop:', error);
    }
  }

  // Add this method to handle UI repositioning
  updateUIPositions() {
    if (!this.config) return;

    // Calculate responsive font sizes
    const baseFontSize = Math.max(12, Math.min(18, this.config.width / 50));
    const headerFontSize = Math.max(14, Math.min(24, this.config.width / 40));
    const healthBarWidth = Math.max(150, Math.min(200, this.config.width / 6));
    const healthBarHeight = Math.max(15, Math.min(20, this.config.height / 30));
    
    // Update score and level text
    if (this.scoreText) {
      this.scoreText.setFontSize(baseFontSize);
      this.scoreText.setPosition(16, 16);
    }
    
    if (this.levelText) {
      this.levelText.setFontSize(baseFontSize);
      this.levelText.setPosition(16, 16 + baseFontSize + 10);
    }
    
    if (this.waveText) {
      this.waveText.setFontSize(baseFontSize);
      this.waveText.setPosition(16, 16 + (baseFontSize + 10) * 2);
    }
    
    if (this.characterText) {
      this.characterText.setFontSize(baseFontSize);
      this.characterText.setPosition(this.config.width - 16, 16);
    }
    
    // Update health bar dimensions and position
    const healthBarY = this.config.height - healthBarHeight - 20;
    
    if (this.playerHealthBar) {
      // Background
      this.playerHealthBarBg.setPosition(10, healthBarY)
        .setSize(healthBarWidth, healthBarHeight);
      
      // Border
      this.playerHealthBarBorder.setPosition(10, healthBarY)
        .setSize(healthBarWidth, healthBarHeight);
      
      // Fill
      this.playerHealthBar.setPosition(12, healthBarY + 2)
        .setSize(healthBarWidth - 4, healthBarHeight - 4);
      
      // Update health text position and size
      if (this.playerHealthText) {
        this.playerHealthText.setFontSize(baseFontSize)
          .setPosition(10 + healthBarWidth + 10, healthBarY + 2);
      }
      
      // Update health label
      if (this.healthLabel) {
        this.healthLabel.setFontSize(baseFontSize)
          .setPosition(10, healthBarY - baseFontSize - 5);
      }
    }
  }

  /**
   * Update health bars for player and enemies
   */
  updateHealthBars() {
    try {
      if (!this.playerHealthBar || !this.playerHealthText) return;
      
      // Update player health bar
      const healthPercent = this.playerCurrentHealth / this.playerMaxHealth;
      
      // Important: Set the DisplayWidth instead of width to properly scale the rectangle
      const initialWidth = this.playerHealthBarInitialWidth;
      this.playerHealthBar.displayWidth = Math.max(0, initialWidth * healthPercent);
      
      // Update color based on health percentage
      let color;
      if (healthPercent > 0.6) {
        // Green to yellow gradient for high health (100% to 60%)
        const t = (1 - healthPercent) * 2.5;
        color = Phaser.Display.Color.Interpolate.ColorWithColor(
          { r: 0, g: 255, b: 0 },
          { r: 255, g: 255, b: 0 },
          100,
          Math.floor(t * 100)
        );
      } else {
        // Yellow to red gradient for low health (60% to 0%)
        const t = (0.6 - healthPercent) * (1 / 0.6);
        color = Phaser.Display.Color.Interpolate.ColorWithColor(
          { r: 255, g: 255, b: 0 },
          { r: 255, g: 0, b: 0 },
          100,
          Math.floor(t * 100)
        );
      }
      
      const finalColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
      this.playerHealthBar.setFillStyle(finalColor);
      
      // Update health text
      this.playerHealthText.setText(`${Math.ceil(this.playerCurrentHealth)}/${this.playerMaxHealth}`);
      
      // Update enemy health bars
      this.enemies.getChildren().forEach(enemy => {
        try {
          if (enemy.healthBar && enemy.currentHealth !== undefined) {
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
        } catch (e) {
          // Skip this enemy if there's an error updating its health bar
        }
      });
    } catch (error) {
      console.error('Error updating health bars:', error);
    }
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
      try {
        if (!enemy.active || !this.player.active) return;
        
        // Calculate distance and position relative to player
        const distance = Phaser.Math.Distance.Between(
          enemy.x, enemy.y,
          this.player.x, this.player.y
        );
        
        // Update sprite based on position relative to player
        if (enemy.x < this.player.x) {
          enemy.setTexture('enemyRight');
        } else {
          enemy.setTexture('enemyLeft');
        }
        
        // Dynamic speed based on distance (faster when further away)
        const baseSpeed = enemy.baseSpeed || this.enemyBaseSpeed;
        const minSpeed = baseSpeed * 0.5;
        const maxSpeed = baseSpeed * 1.2;
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
    try {
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
    } catch (error) {
      console.error('Error cleaning up enemies:', error);
    }
  }

  /**
   * Spawn a new enemy at a random location outside the screen
   */
  spawnEnemy() {
    try {
      if (!this.enemies) return;
      
      // Limit maximum number of enemies for performance
      if (this.enemies.getChildren().length >= this.maxEnemies) {
        return;
      }
      
      // Randomly spawn enemies outside the visible area
      const side = Math.floor(Math.random() * 4);
      const buffer = 40;
      let x, y;
      let spriteKey;
      
      switch(side) {
        case 0: // top
          x = Phaser.Math.Between(0, this.config.width);
          y = -buffer;
          // Compare with player's x position to determine facing
          spriteKey = (x < this.player.x) ? 'enemyRight' : 'enemyLeft';
          break;
        case 1: // right
          x = this.config.width + buffer;
          y = Phaser.Math.Between(0, this.config.height);
          spriteKey = 'enemyLeft'; // Always face left when spawning from right
          break;
        case 2: // bottom
          x = Phaser.Math.Between(0, this.config.width);
          y = this.config.height + buffer;
          // Compare with player's x position to determine facing
          spriteKey = (x < this.player.x) ? 'enemyRight' : 'enemyLeft';
          break;
        case 3: // left
          x = -buffer;
          y = Phaser.Math.Between(0, this.config.height);
          spriteKey = 'enemyRight'; // Always face right when spawning from left
          break;
      }
      
      // Create enemy sprite using the determined facing direction
      const enemy = this.physics.add.sprite(x, y, spriteKey);
      enemy.setDisplaySize(40, 40);
      this.physics.add.existing(enemy);
      this.enemies.add(enemy);
      
      // Store initial spawn side to update texture later if needed
      enemy.spawnSide = side;
      
      // Enhanced enemy scaling with wave and level
      const waveScaling = this.wave * 8;
      const levelScaling = this.level * 3;
      enemy.maxHealth = this.enemyBaseHealth + waveScaling + levelScaling;
      enemy.currentHealth = enemy.maxHealth;
      
      // Enhanced enemy properties scaling
      const speedScaling = 1 + (this.wave * 0.1) + (this.level * 0.05);
      enemy.baseSpeed = this.enemyBaseSpeed * speedScaling * (0.8 + Math.random() * 0.4);
      enemy.damage = 5 + Math.floor(this.wave * 1.5) + Math.floor(this.level * 0.5);
      enemy.value = 10 + Math.floor(this.wave * 2);
      
      this.createEnemyHealthBar(enemy);
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
    try {
      // Black background for health bar
      enemy.healthBarBg = this.add.rectangle(
        enemy.x - 10, 
        enemy.y - 15, 
        22, 
        6, 
        0x000000
      );
      
      // Yellow health bar at full health
      enemy.healthBar = this.add.rectangle(
        enemy.x - 10, 
        enemy.y - 15, 
        20, 
        4, 
        0xFFFF00 // Yellow color for full health
      );
    } catch (error) {
      console.error('Error creating enemy health bar:', error);
    }
  }

  /**
   * Handle collision between player and enemy
   * @param {Phaser.GameObjects.Rectangle} player - Player object
   * @param {Phaser.GameObjects.Rectangle} enemy - Enemy object
   */
  handlePlayerEnemyCollision(player, enemy) {
    try {
      const currentTime = this.time.now;

      // Damage the player if not invulnerable
      if (!player.invulnerable && currentTime - this.lastPlayerDamageTime > this.playerDamageRate) {
        this.lastPlayerDamageTime = currentTime;
        const baseDamage = enemy.damage || this.enemyContactDamage;
        const levelMultiplier = 1 - (this.level * 0.01);
        const finalDamage = Math.max(1, Math.round(baseDamage * levelMultiplier));
        this.damagePlayer(finalDamage);
        this.cameras.main.shake(100, 0.01);
      }

      // Damage the enemy every 5ms of contact
      if (!enemy.lastDamageTime || currentTime - enemy.lastDamageTime >= 5) {
        enemy.lastDamageTime = currentTime;
        if (enemy.currentHealth === undefined) {
          enemy.currentHealth = enemy.maxHealth || this.enemyBaseHealth;
        }
        const damage = (enemy.maxHealth || this.enemyBaseHealth) * 0.1; // 10% of max health
        this.damageEnemy(enemy, damage);
      }
    } catch (error) {
      console.error('Error in collision handler:', error);
    }
  }

  /**
   * Damage the player
   * @param {number} amount - Damage amount
   */
  damagePlayer(amount) {
    try {
      // Skip if player is invulnerable
      if (!this.player || this.player.invulnerable) return;
      
      // Apply damage
      this.playerCurrentHealth = Math.max(0, this.playerCurrentHealth - amount);
      this.player.currentHealth = this.playerCurrentHealth;
      
      // Visual feedback - red flash
      // We'll use a fill color change for the rectangle instead of tinting
      const originalColor = this.player.fillColor;
      this.player.fillColor = 0xff0000;
      
      // Make player temporarily invulnerable
      this.player.invulnerable = true;
      
      // Reset after invulnerability period
      this.time.delayedCall(1000, () => {
        if (this.player && this.player.active) {
          // Reset the color
          this.player.fillColor = 0x00ff00; // Back to green
          this.player.invulnerable = false;
        }
      });
      
      // Check for game over
      if (this.playerCurrentHealth <= 0) {
        this.gameOver();
      }
    } catch (error) {
      console.error('Error damaging player:', error);
    }
  }

  /**
   * Damage an enemy
   * @param {Phaser.GameObjects.Rectangle} enemy - The enemy to damage
   * @param {number} amount - Damage amount
   */
  damageEnemy(enemy, amount) {
    try {
      if (!enemy || !enemy.active) return;

      enemy.currentHealth = Math.max(0, enemy.currentHealth - amount);

      // Health bar color: yellow at full, green to red gradient as it decreases
      const healthPercent = enemy.currentHealth / enemy.maxHealth;
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
      enemy.healthBar.fillColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

      if (enemy.currentHealth <= 0) {
        this.addScore(enemy.value || 10);
        this.destroyEnemy(enemy);
      }
    } catch (error) {
      console.error('Error damaging enemy:', error);
      try {
        this.destroyEnemy(enemy);
      } catch (e) {
        if (enemy && enemy.destroy) {
          enemy.destroy();
        }
      }
    }
  }

  /**
   * Clean up and destroy an enemy with random effects
   * @param {Phaser.GameObjects.Rectangle} enemy - The enemy to destroy
   */
  destroyEnemy(enemy) {
    try {
      if (enemy.healthBar) enemy.healthBar.destroy();
      if (enemy.healthBarBg) enemy.healthBarBg.destroy();

      // Random destruction effect
      const effectType = Phaser.Math.Between(1, 3);
      switch (effectType) {
        case 1: // Pop effect
          this.tweens.add({
            targets: enemy,
            scaleX: 0,
            scaleY: 0,
            duration: 300,
            onComplete: () => enemy.destroy(),
          });
          break;
        case 2: { // Blast effect
          const blast = this.add.circle(enemy.x, enemy.y, 15, 0xff0000, 0.7);
          this.tweens.add({
            targets: blast,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: () => blast.destroy(),
          });
          enemy.destroy();
          break;
        }
        case 3: // Glitch effect
          this.tweens.add({
            targets: enemy,
            x: enemy.x + Phaser.Math.Between(-10, 10),
            y: enemy.y + Phaser.Math.Between(-10, 10),
            duration: 100,
            yoyo: true,
            repeat: 3,
            onComplete: () => enemy.destroy(),
          });
          break;
      }
    } catch (error) {
      console.error('Error destroying enemy:', error);
      if (enemy && enemy.destroy) {
        enemy.destroy();
      }
    }
  }

  /**
   * Create visual effect at collision point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  createCollisionEffect(x, y) {
    try {
      // Create a simple circle effect
      const effect = this.add.circle(x, y, 15, 0xff0000, 0.7);
      this.tweens.add({
        targets: effect,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => {
          if (effect && effect.destroy) {
            effect.destroy();
          }
        }
      });
    } catch (error) {
      console.error('Error creating collision effect:', error);
    }
  }

  /**
   * Add points to score and update UI
   * @param {number} points - Points to add
   */
  addScore(points) {
    try {
      // Increase points based on level and wave for more challenge
      const scaledPoints = Math.floor(points * (1 + (this.level * 0.1) + (this.wave * 0.2)));
      this.score += scaledPoints;
      
      if (this.scoreText) {
        this.scoreText.setText(`Score: ${this.score}`);
      }
      
      // Check for level up condition using exponential scaling
      const scoreToLevel = this.baseScoreToLevel * Math.pow(this.levelScoreMultiplier, this.level - 1);
      if (this.score >= scoreToLevel) {
        this.levelUp();
      }
    } catch (error) {
      console.error('Error adding score:', error);
    }
  }

  /**
   * Increase player level and difficulty
   */
  levelUp() {
    try {
      this.level++;
      if (this.levelText) {
        this.levelText.setText(`Level: ${this.level}`);
      }
      
      // Increase wave after certain levels (made less frequent)
      if (this.level % 5 === 0) { // Changed from 3 to 5
        this.wave++;
        if (this.waveText) {
          this.waveText.setText(`Wave: ${this.wave}`);
        }
        
        // Limited health increase with cap
        const prevMaxHealth = this.playerMaxHealth;
        this.playerMaxHealth = Math.min(this.maxHealthCap, this.playerMaxHealth + this.healthIncreaseAmount);
        
        // Smaller heal on wave completion (20% instead of 30%)
        const healAmount = this.playerMaxHealth * 0.2;
        this.playerCurrentHealth = Math.min(
          this.playerMaxHealth,
          this.playerCurrentHealth + healAmount
        );
        
        // Update text
        if (this.playerHealthText) {
          this.playerHealthText.setText(`${Math.ceil(this.playerCurrentHealth)}/${this.playerMaxHealth}`);
        }
      }
      
      // Visual feedback for level up
      try {
        this.cameras.main.flash(500, 0, 255, 0, 0.3);
      } catch (e) {
        // Flash effect failed, continue anyway
      }
      
      // Slower player speed increase
      this.playerSpeed = Math.min(300, this.playerSpeed + 5); // Changed from 10 to 5
      
      // Increase enemy spawn rate and damage with each level
      this.enemySpawnRate = Math.max(500, this.enemySpawnRate - 50);
      this.enemyContactDamage = Math.min(20, this.enemyContactDamage + 1);
      
      // Create level up effect
      this.createLevelUpEffect();
    } catch (error) {
      console.error('Error in level up:', error);
    }
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
        onComplete: () => {
          if (text && text.destroy) {
            text.destroy();
          }
        }
      });
    } catch (error) {
      console.error('Error creating level up effect:', error);
    }
  }

  /**
   * Increase game difficulty over time
   */
  increaseDifficulty() {
    try {
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
    } catch (error) {
      console.error('Error increasing difficulty:', error);
    }
  }

  /**
   * Handle game over state
   */
  gameOver() {
    try {
      // Stop physics and game loops
      this.physics.pause();
      if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
      if (this.difficultyTimer) this.difficultyTimer.remove();
      
      // Create centered container for game over elements
      const centerX = this.config.width / 2;
      const centerY = this.config.height / 2;
      
      // Create game over text with consistent styling
      const gameOverText = this.add.text(
        centerX,
        centerY - 80,
        'GAME OVER',
        {
          fontSize: '48px',
          fontFamily: '"Press Start 2P"',
          fill: '#ff0000',
          stroke: '#000000',
          strokeThickness: 6,
          align: 'center'
        }
      ).setOrigin(0.5);
      
      // Add final score with consistent styling
      const finalScoreText = this.add.text(
        centerX,
        centerY,
        `Final Score: ${this.score}`,
        {
          fontSize: '24px',
          fontFamily: '"Press Start 2P"',
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
          align: 'center'
        }
      ).setOrigin(0.5);
      
      // Add centered restart button with consistent styling
      const restartButton = this.add.text(
        centerX,
        centerY + 80,
        'RESTART',
        {
          fontSize: '24px',
          fontFamily: '"Press Start 2P"',
          fill: '#00ff00',
          stroke: '#000000',
          strokeThickness: 4,
          padding: { x: 20, y: 10 },
          align: 'center'
        }
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        restartButton.setStyle({ fill: '#ff00ff' });
        restartButton.setScale(1.1);
      })
      .on('pointerout', () => {
        restartButton.setStyle({ fill: '#00ff00' });
        restartButton.setScale(1);
      })
      .on('pointerdown', () => this.scene.restart());
      
      // Add centered restart instruction
      const restartInstruction = this.add.text(
        centerX,
        centerY + 140,
        'Press R to restart',
        {
          fontSize: '16px',
          fontFamily: '"Press Start 2P"',
          fill: '#666666',
          align: 'center'
        }
      ).setOrigin(0.5);
      
      // Add keyboard restart option
      this.input.keyboard.once('keydown-R', () => {
        this.scene.restart();
      });
    } catch (error) {
      console.error('Error showing game over screen:', error);
      // Force restart after a delay if game over screen fails
      this.time.delayedCall(3000, () => {
        this.scene.restart();
      });
    }
  }
}