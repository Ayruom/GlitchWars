import { BaseScene } from './BaseScene';
import Phaser from 'phaser';

export class PlayScene extends BaseScene {
  constructor(config) {
    super('PlayScene', { ...config, canGoBack: true });
    this.initializeProperties();
  }

  /**
   * Initialize all class properties with default values
   */
  initializeProperties() {
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
    this.healthUI = {
      playerBar: null,
      playerBarBackground: null,
      playerBarBorder: null,
      playerText: null,
      label: null
    };
    this.enemyBaseHealth = 30;
    
    // Game objects groups
    this.enemies = null;
    this.healthBars = null;
    
    // UI elements
    this.uiElements = {
      scoreText: null,
      levelText: null,
      waveText: null,
      characterText: null
    };
    
    // Input controls
    this.cursors = null;
    this.wasd = null;
    
    // Game settings
    this.settings = {
      enemySpawnRate: 2000,
      enemyBaseSpeed: 100,
      maxEnemies: 50,
      difficultyIncreaseInterval: 10000,
      playerDamageRate: 500,
      enemyContactDamage: 5,
      weaponDamage: 10,
      enemyHealthScalingFactor: 5,
      playerInvulnerabilityTime: 1000
    };
    
    // Timers
    this.timers = {
      lastPlayerDamageTime: 0,
      enemySpawnTimer: null,
      difficultyTimer: null
    };
  }

  /**
   * Initialize scene with data from previous scene
   * @param {Object} data - Data passed from previous scene
   */
  init(data) {
    this.selectedHero = data.hero || { id: 'knight', name: 'Pixel Knight' };
    this.resetGameState();
  }

  /**
   * Reset game state for a new game
   */
  resetGameState() {
    this.score = 0;
    this.level = 1;
    this.wave = 1;
    this.playerCurrentHealth = this.playerMaxHealth;
  }

  /**
   * Create game objects, setup physics, and initialize the scene
   */
  create() {
    super.create();
    
    this.createPlayer();
    this.setupGroups();
    this.createUI();
    this.createHealthUI();
    this.setupInput();
    this.setupCollisions();
    this.startGameLoop();
  }

  /**
   * Create and configure the player character
   */
  createPlayer() {
    // Initialize the player with the selected hero
    this.player = this.physics.add.sprite(
      this.screenCenter[0], 
      this.screenCenter[1], 
      this.selectedHero.id
    );
    
    // Configure player physics
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10); // Ensure player is above other elements
    
    // Play idle animation if it exists
    if (this.anims.exists(`${this.selectedHero.id}_idle`)) {
      this.player.play(`${this.selectedHero.id}_idle`);
    }
    
    // Add player properties
    this.player.data = this.player.data || {};
    this.player.data.set('maxHealth', this.playerMaxHealth);
    this.player.data.set('currentHealth', this.playerCurrentHealth);
    this.player.data.set('invulnerable', false);
  }

  /**
   * Setup game object groups
   */
  setupGroups() {
    // Create enemy group with physics
    this.enemies = this.physics.add.group({
      collideWorldBounds: false
    });
    
    // Create a group for health bars (not physics-based)
    this.healthBars = this.add.group();
  }

  /**
   * Setup collision detection
   */
  setupCollisions() {
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
    const textStyle = {
      fontSize: '16px', 
      fill: '#00ff00',
      fontFamily: '"Press Start 2P"'
    };
    
    // Score text
    this.uiElements.scoreText = this.add.text(16, 16, 'Score: 0', textStyle);
    
    // Level text
    this.uiElements.levelText = this.add.text(16, 46, `Level: ${this.level}`, {
      ...textStyle,
      fontSize: '14px'
    });
    
    // Wave text
    this.uiElements.waveText = this.add.text(16, 76, `Wave: ${this.wave}`, {
      ...textStyle,
      fontSize: '14px'
    });
    
    // Character info
    this.uiElements.characterText = this.add.text(
      this.config.width - 16, 
      16, 
      `Hero: ${this.selectedHero.name}`, 
      {
        ...textStyle,
        fontSize: '12px'
      }
    ).setOrigin(1, 0);
    
    // Create a UI container to group these elements
    this.uiContainer = this.add.container(0, 0, Object.values(this.uiElements));
    this.uiContainer.setDepth(100); // Make sure UI is always on top
  }

  /**
   * Create health UI elements
   */
  createHealthUI() {
    // Health bar configuration
    const config = {
      x: 20,
      y: this.config.height - 50,
      width: 200,
      height: 20,
      padding: 2
    };
    
    // Create a container for the health bar elements
    const healthContainer = this.add.container(0, 0);
    
    // Health bar background (black)
    this.healthUI.playerBarBackground = this.add.rectangle(
      config.x, 
      config.y, 
      config.width, 
      config.height, 
      0x000000
    ).setOrigin(0, 0);
    
    // Health bar border (white)
    this.healthUI.playerBarBorder = this.add.rectangle(
      config.x, 
      config.y, 
      config.width, 
      config.height, 
      0xffffff
    ).setOrigin(0, 0)
    .setStrokeStyle(2, 0xffffff, 1)
    .setFillStyle(0x000000, 0); // Transparent fill
    
    // Health bar fill (red)
    this.healthUI.playerBar = this.add.rectangle(
      config.x + config.padding, 
      config.y + config.padding, 
      config.width - (config.padding * 2), 
      config.height - (config.padding * 2), 
      0xff0000
    ).setOrigin(0, 0);
    
    // Health text label
    this.healthUI.label = this.add.text(
      config.x, 
      config.y - 25, 
      'Health', 
      {
        fontSize: '14px',
        fill: '#ffffff',
        fontFamily: '"Press Start 2P"'
      }
    );
    
    // Health value text
    this.healthUI.playerText = this.add.text(
      config.x + config.width + 10, 
      config.y + 2, 
      `${this.playerCurrentHealth}/${this.playerMaxHealth}`, 
      {
        fontSize: '12px',
        fill: '#ffffff',
        fontFamily: '"Press Start 2P"'
      }
    );
    
    // Add all elements to the container
    healthContainer.add([
      this.healthUI.playerBarBackground,
      this.healthUI.playerBarBorder,
      this.healthUI.playerBar,
      this.healthUI.label,
      this.healthUI.playerText
    ]);
    
    // Set high depth to ensure it's visible
    healthContainer.setDepth(100);
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
    this.timers.enemySpawnTimer = this.time.addEvent({
      delay: this.settings.enemySpawnRate,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
    
    // Increase difficulty over time
    this.timers.difficultyTimer = this.time.addEvent({
      delay: this.settings.difficultyIncreaseInterval,
      callback: this.increaseDifficulty,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Main update loop
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
    // Update player health bar
    const healthPercent = this.playerCurrentHealth / this.playerMaxHealth;
    const barWidth = this.healthUI.playerBarBorder.width - 4; // Account for padding
    this.healthUI.playerBar.width = Math.max(0, barWidth * healthPercent);
    
    // Update health text
    this.healthUI.playerText.setText(`${Math.ceil(this.playerCurrentHealth)}/${this.playerMaxHealth}`);
    
    // Update enemy health bars
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.healthBar && enemy.data && enemy.data.has('currentHealth')) {
        const enemyHealthPercent = enemy.data.get('currentHealth') / enemy.data.get('maxHealth');
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
    // Reset velocity
    this.player.setVelocity(0);
    
    // Horizontal movement (prioritize WASD then arrow keys)
    if (this.wasd.left.isDown || this.cursors.left.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
    } else if (this.wasd.right.isDown || this.cursors.right.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    }
    
    // Vertical movement (prioritize WASD then arrow keys)
    if (this.wasd.up.isDown || this.cursors.up.isDown) {
      this.player.setVelocityY(-this.playerSpeed);
    } else if (this.wasd.down.isDown || this.cursors.down.isDown) {
      this.player.setVelocityY(this.playerSpeed);
    }
  }

  /**
   * Update enemy behaviors
   */
  updateEnemies() {
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || !this.player.active) return;
      
      // Calculate distance to player
      const distance = Phaser.Math.Distance.Between(
        enemy.x, enemy.y,
        this.player.x, this.player.y
      );
      
      // Dynamic speed based on distance (faster when further away)
      const baseSpeed = enemy.data.get('baseSpeed') || this.settings.enemyBaseSpeed;
      const minSpeed = baseSpeed * 0.5;
      const maxSpeed = baseSpeed * 1.2;
      const speedFactor = Math.min(1, Math.max(0.5, distance / 300));
      const speed = minSpeed + (maxSpeed - minSpeed) * speedFactor;
      
      // Update enemy direction to follow player
      this.physics.moveToObject(enemy, this.player, speed);
      
      // Rotate enemy to face player (if it's a sprite)
      if (enemy.rotation !== undefined) {
        const angle = Phaser.Math.Angle.Between(
          enemy.x, enemy.y,
          this.player.x, this.player.y
        );
        
        // Smooth rotation using Phaser's built-in function
        const targetAngle = angle + Math.PI/2; // Adjust based on sprite orientation
        const rotationSpeed = 0.1;
        
        enemy.rotation = Phaser.Math.Angle.RotateTo(
          enemy.rotation,
          targetAngle,
          rotationSpeed
        );
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
    // Limit maximum number of enemies for performance
    if (this.enemies.getChildren().length >= this.settings.maxEnemies) {
      return;
    }
    
    // Get spawn position from a helper method
    const position = this.getEnemySpawnPosition();
    
    // Create enemy sprite or fallback to rectangle
    const enemy = this.createEnemySprite(position.x, position.y);
    
    // Set enemy properties using data manager for better organization
    this.setEnemyProperties(enemy);
    
    // Create health bar for the enemy
    this.createEnemyHealthBar(enemy);
    
    // Set initial movement toward the player
    this.physics.moveToObject(
      enemy, 
      this.player, 
      enemy.data.get('baseSpeed')
    );
    
    return enemy;
  }

  /**
   * Calculate a random position outside the screen for enemy spawning
   * @returns {Object} Position with x and y coordinates
   */
  getEnemySpawnPosition() {
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
    
    return { x, y };
  }

  /**
   * Create enemy sprite or fallback to rectangle
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} The created enemy
   */
  createEnemySprite(x, y) {
    let enemy;
    
    if (this.textures.exists('enemy')) {
      enemy = this.enemies.create(x, y, 'enemy');
    } else {
      // Create a red rectangle as fallback
      enemy = this.add.rectangle(x, y, 20, 20, 0xff0000);
      this.physics.add.existing(enemy);
      this.enemies.add(enemy);
    }
    
    // Initialize data manager if not exists
    if (!enemy.data) {
      enemy.setDataEnabled();
    }
    
    return enemy;
  }

  /**
   * Set properties for a newly created enemy
   * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} enemy - The enemy to set properties for
   */
  setEnemyProperties(enemy) {
    // Calculate health based on wave
    const maxHealth = this.enemyBaseHealth + (this.wave * this.settings.enemyHealthScalingFactor);
    
    // Set all properties using the data manager for better organization
    enemy.data.set('maxHealth', maxHealth);
    enemy.data.set('currentHealth', maxHealth);
    enemy.data.set('baseSpeed', this.settings.enemyBaseSpeed * (0.8 + Math.random() * 0.4));
    enemy.data.set('damage', 5 + Math.floor(this.wave / 2));
    enemy.data.set('value', 10); // Score value
  }

  /**
   * Create health bar for an enemy
   * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} enemy - The enemy to add a health bar to
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
    
    // Add both to the health bars group for easier management
    this.healthBars.add(enemy.healthBarBg);
    this.healthBars.add(enemy.healthBar);
  }

  /**
   * Handle collision between player and enemy
   * @param {Phaser.GameObjects.Sprite} player - Player sprite
   * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} enemy - Enemy sprite
   */
  handlePlayerEnemyCollision(player, enemy) {
    // Check if enough time has passed since last damage
    const currentTime = this.time.now;
    
    // Damage the player if not invulnerable and cooldown has passed
    if (!player.data.get('invulnerable') && 
        currentTime - this.timers.lastPlayerDamageTime > this.settings.playerDamageRate) {
      this.timers.lastPlayerDamageTime = currentTime;
      
      // Calculate damage based on enemy properties and game state
      const baseDamage = enemy.data.get('damage') || this.settings.enemyContactDamage;
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
    if (this.player.data.get('invulnerable')) return;
    
    // Apply damage
    this.playerCurrentHealth = Math.max(0, this.playerCurrentHealth - amount);
    this.player.data.set('currentHealth', this.playerCurrentHealth);
    
    // Make player flash red
    this.player.setTint(0xff0000);
    
    // Make player temporarily invulnerable
    this.player.data.set('invulnerable', true);
    
    // Reset after invulnerability period
    this.time.delayedCall(this.settings.playerInvulnerabilityTime, () => {
      if (this.player && this.player.active) {
        this.player.clearTint();
        this.player.data.set('invulnerable', false);
      }
    });
    
    // Check for game over
    if (this.playerCurrentHealth <= 0) {
      this.gameOver();
    }
  }

  /**
   * Damage an enemy
   * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} enemy - The enemy to damage
   * @param {number} amount - Damage amount
   */
  damageEnemy(enemy, amount) {
    if (!enemy.active) return;
    
    // Calculate damage based on player level
    const levelBonus = this.level * 0.2; // 20% more damage per level
    const finalDamage = Math.round(amount * (1 + levelBonus));
    
    // Apply damage using data manager
    const currentHealth = enemy.data.get('currentHealth') - finalDamage;
    enemy.data.set('currentHealth', currentHealth);
    
    // Flash enemy red
    enemy.setTint(0xff0000);
    this.time.delayedCall(100, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });
    
    // Check if enemy is defeated
    if (currentHealth <= 0) {
      this.addScore(enemy.data.get('value') || 10);
      this.destroyEnemy(enemy);
    }
  }

  /**
   * Clean up and destroy an enemy
   * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} enemy - The enemy to destroy
   */
  destroyEnemy(enemy) {
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
  }

  /**
   * Create visual effect at collision point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  createCollisionEffect(x, y) {
    // Create a simple particle effect if texture exists
    if (this.textures.exists('particle')) {
      const particles = this.add.particles(x, y, 'particle', {
        lifespan: 500,
        speed: { min: 50, max: 100 },
        scale: { start: 0.5, end: 0 },
        quantity: 5,
        emitting: false
      });
      
      particles.explode();
      this.time.delayedCall(500, () => particles.destroy());
    } else {
      // Create a circle effect as fallback
      const effect = this.add.circle(x, y, 15, 0xff0000, 0.7);
      this.tweens.add({
        targets: effect,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => effect.destroy()
      });
    }
  }

  /**
   * Add points to score and update UI
   * @param {number} points - Points to add
   */
  addScore(points) {
    this.score += points;
    this.uiElements.scoreText.setText(`Score: ${this.score}`);
    
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
    this.uiElements.levelText.setText(`Level: ${this.level}`);
    
    // Increase wave after certain levels
    if (this.level % 3 === 0) {
      this.advanceWave();
    }
    
    // Visual feedback for level up
    this.cameras.main.flash(500, 0, 255, 0, 0.3);
    
    // Increase player abilities
    this.playerSpeed = Math.min(300, this.playerSpeed + 10);
    
    // Optional: Add level up effects
    this.createLevelUpEffect();
  }

  /**
   * Advance to the next wave, updating game state
   */
  advanceWave() {
    this.wave++;
    this.uiElements.waveText.setText(`Wave: ${this.wave}`);
    
    // Increase player max health with each wave
    const oldMaxHealth = this.playerMaxHealth;
    this.playerMaxHealth += 20; // Add 20 health per wave
    
    // Also heal the player a bit on wave completion
    this.playerCurrentHealth = Math.min(
      this.playerMaxHealth, 
      this.playerCurrentHealth + (this.playerMaxHealth * 0.3)
    );
    
    // Create wave advancement effect
    this.createWaveAdvanceEffect();
  }

  /**
   * Create visual effect for wave advancement
   */
  createWaveAdvanceEffect() {
    const text = this.add.text(
      this.screenCenter[0],
      this.screenCenter[1],
      `WAVE ${this.wave}`,
      {
        fontSize: '32px',
        fontFamily: '"Press Start 2P"',
        fill: '#ffff00',
        stroke: '#000',
        strokeThickness: 6
      }
    ).setOrigin(0.5);
    
    // Make text appear with a zoom effect
    text.setScale(0.1);
    this.tweens.add({
      targets: text,
      scale: 1,
      duration: 500,
      ease: 'Back.out',
      onComplete: () => {
        // Then fade it out
        this.tweens.add({
          targets: text,
          alpha: 0,
          y: text.y - 50,
          duration: 1000,
          delay: 500,
          ease: 'Power2.out',
          onComplete: () => text.destroy()
        });
      }
    });
  }

  /**
   * Create visual effect for level up
   */
  createLevelUpEffect() {
    const text = this.add.text(
      this.player.x,
      this.player.y - 50,
      'LEVEL UP!',
      {
        fontSize: '24px',
        fontFamily: '"Press Start 2P"',
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
  }

  /**
   * Increase game difficulty over time
   */
  increaseDifficulty() {
    // Increase enemy spawn rate
    const newDelay = Math.max(500, this.settings.enemySpawnRate - 100);
    if (newDelay !== this.settings.enemySpawnRate) {
      this.settings.enemySpawnRate = newDelay;
      this.timers.enemySpawnTimer.delay = this.settings.enemySpawnRate;
    }
    
    // Increase enemy speed
    this.settings.enemyBaseSpeed = Math.min(200, this.settings.enemyBaseSpeed + 5);
  }

  /**
   * Handle game over state
   */
  gameOver() {
    // Stop timers
    this.stopAllTimers();
    
    // Create game over UI
    this.createGameOverUI();
  }

  /**
   * Stop all active timers
   */
  stopAllTimers() {
    // Stop enemy spawning
    if (this.timers.enemySpawnTimer) {
      this.timers.enemySpawnTimer.remove();
    }
    
    // Stop difficulty scaling
    if (this.timers.difficultyTimer) {
      this.timers.difficultyTimer.remove();
    }
  }

  /**
   * Create the game over UI
   */
  createGameOverUI() {
    // Create a container for game over UI
    const gameOverContainer = this.add.container(0, 0);
    gameOverContainer.setDepth(1000); // Ensure it's on top
    
    // Semi-transparent overlay
    const overlay = this.add.rectangle(
      0, 0,
      this.config.width,
      this.config.height,
      0x000000, 0.7
    ).setOrigin(0, 0);
    
    // Game over text
    const gameOverText = this.add.text(
      this.screenCenter[0],
      this.screenCenter[1] - 50,
      'GAME OVER',
      {
        fontSize: '48px',
        fontFamily: '"Press Start 2P"',
        fill: '#ff0000',
        stroke: '#000',
        strokeThickness: 6
      }
    ).setOrigin(0.5);
    
    // Add final score
    const finalScoreText = this.add.text(
      this.screenCenter[0],
      this.screenCenter[1] + 30,
      `Final Score: ${this.score}`,
      {
        fontSize: '24px',
        fontFamily: '"Press Start 2P"',
        fill: '#ffffff',
        stroke: '#000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    
    // Add wave reached
    const waveText = this.add.text(
      this.screenCenter[0],
      this.screenCenter[1] + 70,
      `Wave: ${this.wave}`,
      {
        fontSize: '16px',
        fontFamily: '"Press Start 2P"',
        fill: '#00ffff',
        stroke: '#000',
        strokeThickness: 2
      }
    ).setOrigin(0.5);
    
    // Add restart button
    const restartButton = this.createButton(
      this.screenCenter[0],
      this.screenCenter[1] + 130,
      'RESTART',
      () => this.scene.restart()
    );
    
    // Add menu button
    const menuButton = this.createButton(
      this.screenCenter[0],
      this.screenCenter[1] + 180,
      'MAIN MENU',
      () => this.scene.start('MenuScene')
    );
    
    // Add all elements to container
    gameOverContainer.add([
      overlay,
      gameOverText,
      finalScoreText,
      waveText,
      restartButton,
      menuButton
    ]);
    
    // Add a tween to fade in the game over UI
    this.tweens.add({
      targets: gameOverContainer,
      alpha: { from: 0, to: 1 },
      duration: 1000,
      ease: 'Power2'
    });
  }
  
  /**
   * Helper method to create interactive buttons
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} text - Button text
   * @param {Function} callback - Click callback
   * @returns {Phaser.GameObjects.Text} The button
   */
  createButton(x, y, text, callback) {
    const button = this.add.text(
      x, y, text,
      {
        fontSize: '20px',
        fontFamily: '"Press Start 2P"',
        fill: '#00ff00',
        stroke: '#000',
        strokeThickness: 3,
        padding: { x: 20, y: 10 }
      }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
    
    // Add hover effects
    button
      .on('pointerover', () => {
        button.setStyle({ fill: '#ff00ff' });
        button.setScale(1.1);
      })
      .on('pointerout', () => {
        button.setStyle({ fill: '#00ff00' });
        button.setScale(1);
      })
      .on('pointerdown', callback);
    
    return button;
  }
}