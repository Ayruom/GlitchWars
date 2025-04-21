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
    
    // Game objects
    this.enemies = null;
    
    // UI elements
    this.scoreText = null;
    this.levelText = null;
    
    // Input controls
    this.cursors = null;
    
    // Game settings
    this.enemySpawnRate = 2000; // ms
    this.enemyBaseSpeed = 100;
    this.maxEnemies = 50;
    this.difficultyIncreaseInterval = 10000; // ms
  }

  /**
   * Initialize scene with data from previous scene
   * @param {Object} data - Data passed from previous scene
   */
  init(data) {
    this.selectedHero = data.hero || { id: 'knight', name: 'Pixel Knight' };
    this.score = 0;
    this.level = 1;
  }

  /**
   * Create game objects, setup physics, and initialize the scene
   */
  create() {
    super.create();
    
    this.createPlayer();
    this.setupEnemies();
    this.createUI();
    this.setupInput();
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
    
    // Play idle animation if it exists
    if (this.anims.exists(`${this.selectedHero.id}_idle`)) {
      this.player.play(`${this.selectedHero.id}_idle`);
    }
    
    // Add optional player properties
    this.player.health = 100;
    this.player.invulnerable = false;
  }

  /**
   * Setup enemy group and collision detection
   */
  setupEnemies() {
    // Create enemy group with physics
    this.enemies = this.physics.add.group({
      collideWorldBounds: false
    });
    
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
      fill: '#00ff00',
      fontFamily: '"Press Start 2P"'
    });
    
    // Level text
    this.levelText = this.add.text(16, 46, `Level: ${this.level}`, {
      fontSize: '14px',
      fill: '#00ff00',
      fontFamily: '"Press Start 2P"'
    });
    
    // Character info
    this.characterText = this.add.text(
      this.config.width - 16, 
      16, 
      `Hero: ${this.selectedHero.name}`, 
      {
        fontSize: '12px',
        fill: '#00ff00',
        fontFamily: '"Press Start 2P"'
      }
    ).setOrigin(1, 0);
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
    this.handlePlayerMovement();
    this.updateEnemies();
    this.cleanupOffscreenEnemies();
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
      
      // Optional: Rotate enemy to face player
      const angle = Phaser.Math.Angle.Between(
        enemy.x, enemy.y,
        this.player.x, this.player.y
      );
      
      // Smooth rotation (lerp between current and target angle)
      const targetAngle = angle + Math.PI/2; // Adjust based on your sprite orientation
      const currentAngle = enemy.rotation;
      const rotationSpeed = 0.1; // Adjust for smoother or faster rotation
      
      enemy.rotation = Phaser.Math.Angle.RotateTo(
        currentAngle,
        targetAngle,
        rotationSpeed
      );
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
        enemy.destroy();
      }
    });
  }

  /**
   * Spawn a new enemy at a random location outside the screen
   */
  spawnEnemy() {
    // Limit maximum number of enemies for performance
    if (this.enemies.getChildren().length >= this.maxEnemies) {
      return;
    }
    
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
    
    // Create enemy (fallback to rectangle if sprite not available)
    let enemy;
    if (this.textures.exists('enemy')) {
      enemy = this.enemies.create(x, y, 'enemy');
    } else {
      // Create a red rectangle as fallback
      enemy = this.add.rectangle(x, y, 20, 20, 0xff0000);
      this.physics.add.existing(enemy);
      this.enemies.add(enemy);
    }
    
    // Add custom properties
    enemy.baseSpeed = this.enemyBaseSpeed * (0.8 + Math.random() * 0.4); // Randomize speed (80-120% of base)
    enemy.health = 1;
    enemy.damage = 1;
    enemy.value = 10; // Score value
    
    // Set initial movement toward the player
    this.physics.moveToObject(enemy, this.player, enemy.baseSpeed);
  }

  /**
   * Handle collision between player and enemy
   * @param {Phaser.GameObjects.Sprite} player - Player sprite
   * @param {Phaser.GameObjects.Sprite} enemy - Enemy sprite
   */
  handlePlayerEnemyCollision(player, enemy) {
    // Destroy the enemy
    enemy.destroy();
    
    // Add score
    this.addScore(enemy.value || 10);
    
    // Optional: Damage player (disabled in this implementation)
    // this.damagePlayer(enemy.damage || 1);
    
    // Optional: Add visual feedback
    this.createCollisionEffect(enemy.x, enemy.y);
  }

  /**
   * Create visual effect at collision point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  createCollisionEffect(x, y) {
    // Create a simple particle effect
    const particles = this.add.particles(x, y, 'particle', {
      lifespan: 500,
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      quantity: 5,
      emitting: false
    });
    
    // If particle texture doesn't exist, create a circle effect
    if (!this.textures.exists('particle')) {
      const effect = this.add.circle(x, y, 15, 0xff0000, 0.7);
      this.tweens.add({
        targets: effect,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => effect.destroy()
      });
    } else {
      particles.explode();
      this.time.delayedCall(500, () => particles.destroy());
    }
  }

  /**
   * Add points to score and update UI
   * @param {number} points - Points to add
   */
  addScore(points) {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
    
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
    this.levelText.setText(`Level: ${this.level}`);
    
    // Visual feedback for level up
    this.cameras.main.flash(500, 0, 255, 0, 0.3);
    
    // Increase player abilities
    this.playerSpeed = Math.min(300, this.playerSpeed + 10);
    
    // Optional: Add level up effects
    this.createLevelUpEffect();
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
    const newDelay = Math.max(500, this.enemySpawnRate - 100);
    if (newDelay !== this.enemySpawnRate) {
      this.enemySpawnRate = newDelay;
      this.enemySpawnTimer.delay = this.enemySpawnRate;
    }
    
    // Increase enemy speed
    this.enemyBaseSpeed = Math.min(200, this.enemyBaseSpeed + 5);
  }

  /**
   * Damage the player
   * @param {number} amount - Damage amount
   */
  damagePlayer(amount) {
    // Skip if player is invulnerable
    if (this.player.invulnerable) return;
    
    // Apply damage
    this.player.health -= amount;
    
    // Make player flash red
    this.player.setTint(0xff0000);
    
    // Make player temporarily invulnerable
    this.player.invulnerable = true;
    
    // Reset after invulnerability period
    this.time.delayedCall(1000, () => {
      this.player.clearTint();
      this.player.invulnerable = false;
    });
    
    // Check for game over
    if (this.player.health <= 0) {
      this.gameOver();
    }
  }

  /**
   * Handle game over state
   */
  gameOver() {
    // Stop enemy spawning
    this.enemySpawnTimer.remove();
    this.difficultyTimer.remove();
    
    // Create game over text
    const gameOverText = this.add.text(
      this.screenCenter[0],
      this.screenCenter[1],
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
      this.screenCenter[1] + 60,
      `Final Score: ${this.score}`,
      {
        fontSize: '24px',
        fontFamily: '"Press Start 2P"',
        fill: '#ffffff',
        stroke: '#000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    
    // Add restart button
    const restartButton = this.add.text(
      this.screenCenter[0],
      this.screenCenter[1] + 120,
      'RESTART',
      {
        fontSize: '24px',
        fontFamily: '"Press Start 2P"',
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
    
    // Create container for game over UI
    this.add.container(0, 0, [gameOverText, finalScoreText, restartButton]);
  }
}