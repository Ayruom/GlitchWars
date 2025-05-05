import { BaseScene } from './BaseScene';
import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EnemyManager } from '../managers/EnemyManager';

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
    this.enemyManager = null;
    
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
    
    // Hero image mapping - maps hero IDs from selection to in-game sprites
    this.heroImageMapping = {
      male: {
        mage1: '/assets/WizardsInGameImages/Male/FinalPlayUse/Wizard Male1 60X60.png',
        mage2: '/assets/WizardsInGameImages/Male/FinalPlayUse/Wizard Male2 60X60.png',
        mage3: '/assets/WizardsInGameImages/Male/FinalPlayUse/Wizard Male3 64X64.png',
        knight: null, // TBD
        archer: null  // TBD
      },
      female: {
        mage1: '/assets/WizardsInGameImages/Female/FinalPlayUse/Wizard Female1 60X60.png',
        mage2: '/assets/WizardsInGameImages/Female/FinalPlayUse/Wizard Female2 60X60.png',
        archer: '/assets/ArchersInGameImages/Female/FinalPlayUse/Archer Female 64X64.png',
        knight: null  // TBD
      }
    };
  }

  /**
   * Initialize scene with data from previous scene
   * @param {Object} data - Data passed from previous scene
   */
  init(data) {
    this.selectedHero = data.hero || { id: 'mage1', name: 'Retro Mage I', gender: 'male' };
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
      
      // Get the appropriate hero image path
      const heroImageKey = 'playerCharacter';
      let heroImagePath = this.getHeroImagePath();
      
      // Pre-load the hero image
      this.load.image(heroImageKey, heroImagePath);
      
      // Once the image is loaded, set up the game elements
      this.load.once('complete', () => {
        this.createPlayer();
        this.setupGameElements();
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
   * Setup all game elements after player is created
   */
  setupGameElements() {
    this.setupEnemies();
    this.createUI();
    this.createHealthBars();
    this.setupInput();
  }

  /**
   * Get the correct hero image path based on selection
   * @returns {string} path to the hero image
   */
  getHeroImagePath() {
    // Get hero gender and id from selection
    const { gender, id } = this.selectedHero;
    
    // Get the image path from our mapping
    const imagePath = this.heroImageMapping[gender]?.[id];
    
    // Return the image path or a default if not found
    if (imagePath) {
      return imagePath;
    } else {
      console.warn(`No image found for hero: ${id} with gender: ${gender}. Using default.`);
      // Return first available image as fallback
      const fallbackGender = gender || 'male';
      const fallbackHeroMapping = this.heroImageMapping[fallbackGender];
      const firstAvailableHero = Object.keys(fallbackHeroMapping).find(key => 
        fallbackHeroMapping[key] !== null
      );
      
      return fallbackHeroMapping[firstAvailableHero] || '/assets/WizardsInGameImages/Male/FinalPlayUse/Wizard Male1 60X60.png';
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
      // Create the player using the Player class with appropriate configuration
      this.player = new Player(this, this.config.width / 2, this.config.height / 2, {
        spriteKey: 'playerCharacter',
        maxHealth: this.playerMaxHealth,
        currentHealth: this.playerCurrentHealth,
        speed: this.playerSpeed,
        hero: this.selectedHero
      });
      
      // Update scene properties to match player's properties for UI consistency
      this.playerCurrentHealth = this.player.currentHealth;
      this.playerMaxHealth = this.player.maxHealth;
    } catch (error) {
      console.error('Error creating player:', error);
      // Fallback to a rectangle if image loading fails
      this.createFallbackPlayer();
    }
  }
  
  /**
   * Get appropriate sprite size based on hero type
   * @returns {Object} width and height
   */
  getSpriteSize() {
    const { id } = this.selectedHero;
    
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
   * Setup enemy group and collision detection using EnemyManager
   */
  setupEnemies() {
    // Initialize the enemy manager with current scene
    this.enemyManager = new EnemyManager(this);
    
    // Store a reference to the enemies group
    this.enemies = this.enemyManager.enemies;
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
    // Start spawning enemies using the enemy manager
    this.enemyManager.startSpawning();
    
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
      if (!this.player) return;
      
      // Use Player class's update method
      this.player.update();
      
      // Use EnemyManager's update method
      if (this.enemyManager) {
        this.enemyManager.update();
      }
      
      this.updateHealthBars();
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
    
    const wasFlipped = !this.player.facingRight;
    
    // Horizontal movement (prioritize WASD then arrow keys)
    if (this.wasd.left.isDown || this.cursors.left.isDown) {
      this.player.body.setVelocityX(-this.playerSpeed);
      
      // Flip sprite horizontally when moving left
      if (this.player.facingRight) {
        this.player.facingRight = false;
        this.player.scaleX = -1; // Flip sprite by setting negative scale
        // Maintain the physics body's correct position
        this.player.body.offset.x = this.player.width;
      }
    } else if (this.wasd.right.isDown || this.cursors.right.isDown) {
      this.player.body.setVelocityX(this.playerSpeed);
      
      // Reset sprite to normal when moving right
      if (!this.player.facingRight) {
        this.player.facingRight = true;
        this.player.scaleX = 1; // Normal scale
        // Reset the physics body offset
        this.player.body.offset.x = 0;
      }
    }
    
    // Vertical movement (prioritize WASD then arrow keys)
    if (this.wasd.up.isDown || this.cursors.up.isDown) {
      this.player.body.setVelocityY(-this.playerSpeed);
    } else if (this.wasd.down.isDown || this.cursors.down.isDown) {
      this.player.body.setVelocityY(this.playerSpeed);
    }
  }

  /**
   * Damage the player
   * @param {number} amount - Damage amount
   */
  damagePlayer(amount) {
    try {
      // Use the Player class's takeDamage method
      if (!this.player) return;
      
      // If this is the fallback player (not using Player class)
      if (!this.player.takeDamage) {
        // Skip if player is invulnerable
        if (this.player.invulnerable) return;
        
        // Apply damage
        this.playerCurrentHealth = Math.max(0, this.playerCurrentHealth - amount);
        this.player.currentHealth = this.playerCurrentHealth;
        
        // Visual feedback - red flash
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
      } else {
        // Use the Player class's takeDamage method
        const died = this.player.takeDamage(amount);
        
        // Update the scene's health tracking for UI
        this.playerCurrentHealth = this.player.currentHealth;
        
        // Check for game over
        if (died) {
          this.gameOver();
        }
      }
      
      // Check for game over
      if (this.playerCurrentHealth <= 0) {
        this.gameOver();
      }
    } catch (error) {
      console.error('Error damaging player:', error);
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
      
      // Update enemy manager with new difficulty
      if (this.enemyManager) {
        this.enemyManager.updateDifficulty(this.level, this.wave);
        this.enemyManager.updateSpawnRate(this.enemySpawnRate);
      }
      
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
      if (!this.player || !this.player.sprite) return;
      
      const text = this.add.text(
        this.player.sprite.x,
        this.player.sprite.y - 50,
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
        
        // Update enemy manager spawn rate
        if (this.enemyManager) {
          this.enemyManager.updateSpawnRate(this.enemySpawnRate);
        }
      }
      
      // Increase enemy speed
      this.enemyBaseSpeed = Math.min(200, this.enemyBaseSpeed + 5);
      
      // Update enemy manager
      if (this.enemyManager) {
        this.enemyManager.updateDifficulty(this.level, this.wave);
      }
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
      
      // Stop enemy spawning
      if (this.enemyManager) {
        this.enemyManager.stopSpawning();
      }
      
      // Remove difficulty timer
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