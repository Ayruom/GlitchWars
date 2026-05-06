import { BaseScene } from './BaseScene';
import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EnemyManager } from '../managers/EnemyManager';
import { InputManager } from '../managers/InputManager';
import { LevelManager } from '../managers/LevelManager';
import { CollisionManager } from '../managers/CollisionManager';
import { EffectsHelper } from '../utils/EffectsHelper';
import { ScreenUtils } from '../utils/ScreenUtils';
import { HealthBar } from '../ui/HealthBar';
import { ScoreDisplay } from '../ui/ScoreDisplay';
import { GameOverScreen } from '../ui/GameOverScreen';
import { WeaponManager } from '../managers/WeaponManager';
import { getHeroConfig } from '../config/heroes';

export class PlayScene extends BaseScene {
  constructor(config) {
    super('PlayScene', { ...config, canGoBack: true });
    
    // Player properties
    this.player = null;
    this.selectedHero = null;
    
    // Game objects and managers
    this.enemyManager = null;
    this.inputManager = null;
    this.levelManager = null;
    this.collisionManager = null;
    this.effectsHelper = null;
    this.screenUtils = null;
    this.weaponManager = null;

    // UI elements
    this.healthBar = null;
    this.scoreDisplay = null;
    this.gameOverScreen = null;
  }

  /**
   * Initialize scene with data from previous scene
   * @param {Object} data - Data passed from previous scene
   */
  init(data) {
    this.selectedHero = data.hero || { id: 'mage1', name: 'Retro Mage I', gender: 'male' };
  }

  /**
   * Preload assets needed for the game
   */
  preload() {
    try {
      // Load the enemy sprite images with proper paths
      // Using unique keys with timestamps to avoid conflicts
      this.enemyLeftKey = 'enemyLeft_' + Date.now();
      this.enemyRightKey = 'enemyRight_' + Date.now();
      this.heroImageKey = 'playerCharacter_' + Date.now();
      
      // Get the appropriate hero image path
      let heroImagePath = this.getHeroImagePath();
      
      this.load.image(this.heroImageKey, heroImagePath);
      this.load.image(this.enemyLeftKey, 'assets/EnemiesInGameImages/FinalPlayUse/Enemy1 40X40LeftFacing.png');
      this.load.image(this.enemyRightKey, 'assets/EnemiesInGameImages/FinalPlayUse/Enemy1 40X40rightFacing.png');
      
      this.load.on('loaderror', (fileObj) => {
        // Create fallback texture if enemy images fail to load
        if (fileObj.key === this.enemyLeftKey || fileObj.key === this.enemyRightKey) {
          this.createFallbackEnemyTextures(fileObj.key);
        }
      });
    } catch (error) {
    }
  }

  /**
   * Create game objects, setup physics, and initialize the scene
   */
  create() {
    try {
      // Initialize utility classes
      this.screenUtils = new ScreenUtils(this);
      this.effectsHelper = new EffectsHelper(this);
      
      // Create a black background
      this.screenUtils.createBackground();
      
      // Initialize input manager first
      this.inputManager = new InputManager(this);
      
      // Initialize level manager next
      this.levelManager = new LevelManager(this, {
        baseScoreToLevel: 200,
        levelScoreMultiplier: 1.5,
        playerMaxHealth: 100,
        maxHealthCap: 200,
        healthIncreaseAmount: 10,
        enemySpawnRate: 2000,
        enemyBaseSpeed: 100,
        difficultyIncreaseInterval: 10000,
        autoStartDifficultyTimer: false // We'll start it after setup
      });
      
      // Create the player before initializing other managers that depend on it
      this.createPlayer();
      
      // Create UI that depends on player being initialized
      this.createUI();
      
      // Initialize enemy manager after player creation
      this.enemyManager = new EnemyManager(this);
      
      // Pass the texture keys to the enemy manager
      this.enemyManager.enemyLeftKey = this.enemyLeftKey;
      this.enemyManager.enemyRightKey = this.enemyRightKey;
      
      // Initialize collision manager after player and enemy manager
      this.collisionManager = new CollisionManager(this, {
        playerDamageRate: 500,
        enemyContactDamage: 5
      });

      // Setup collisions and enemy spawning
      if (this.player && this.player.sprite && this.enemyManager) {
        this.collisionManager.setup(this.player, this.enemyManager.enemies);

        this.weaponManager = new WeaponManager(
          this,
          this.player,
          this.enemyManager,
          this.collisionManager
        );

        // Start enemy spawning after collisions are set up
        this.enemyManager.startSpawning();
      }
      
      // Start difficulty timer at the end
      this.levelManager.startDifficultyTimer();
      
      // Register level up and score update callbacks
      this.registerCallbacks();
      
      // Register screen resize event
      this.scale.on('resize', this.onScreenResize, this);
      
    } catch (error) {
      console.error('Error in PlayScene.create:', error);
      // Create minimal fallback UI to show something
      this.createFallbackUI();
    }
  }

  /**
   * Create fallback textures for enemies when image loading fails
   */
  createFallbackEnemyTextures(key) {
    try {
      // Create a graphics object
      const graphics = this.add.graphics();
      
      // Draw a red rectangle
      graphics.fillStyle(0xff0000);
      graphics.fillRect(0, 0, 40, 40);
      
      // Add an arrow to indicate direction
      graphics.fillStyle(0xffffff);
      
      if (key === this.enemyLeftKey) {
        // Left-pointing arrow
        graphics.fillTriangle(30, 20, 10, 10, 10, 30);
      } else {
        // Right-pointing arrow
        graphics.fillTriangle(10, 20, 30, 10, 30, 30);
      }
      
      // Generate texture from graphics
      graphics.generateTexture(key, 40, 40);
      
      // Clear graphics
      graphics.clear();
      
    } catch (error) {
      console.error(`Error creating fallback texture for ${key}:`, error);
    }
  }

  /**
   * Register callbacks for game events
   * @private
   */
  registerCallbacks() {
    // Level manager callbacks
    this.levelManager.onLevelUp((level) => {
      this.scoreDisplay.updateLevel(level);
      this.createLevelUpEffect();
    });
    
    this.levelManager.onWaveChange((wave) => {
      this.scoreDisplay.updateWave(wave);
      
      // Create wave change effect in the center of the screen
      this.createWaveChangeEffect();
      
      // Update player health on wave change
      if (this.player) {
        this.player.increaseMaxHealth(this.levelManager.healthIncreaseAmount, this.levelManager.maxHealthCap);
        
        // Small heal on wave completion
        const healAmount = this.player.maxHealth * 0.2;
        this.player.heal(healAmount);
        
        // Update health bar
        this.healthBar.updateHealth(this.player.currentHealth, this.player.maxHealth);
      }
    });
    
    this.levelManager.onScoreUpdate((score) => {
      this.scoreDisplay.updateScore(score);
    });
    
    // Input manager callbacks
    this.inputManager.onRestartKey(() => {
      if (this.gameOverScreen && this.gameOverScreen.isVisible) {
        this.scene.restart();
      }
    });
  }

  /**
   * Get the correct hero image path based on selection
   * @returns {string} path to the hero image
   */
  getHeroImagePath() {
    const { id, gender } = this.selectedHero || {};
    const heroConfig = getHeroConfig(id, gender);
    if (heroConfig) return heroConfig.image;
    console.warn(`PlayScene: no hero config for id="${id}" gender="${gender}" — using fallback`);
    return '/assets/WizardsInGameImages/Male/FinalPlayUse/Wizard Male1 60X60.png';
  }

  /**
   * Create a fallback UI in case the main create method fails
   */
  createFallbackUI() {
    // Create a simple black background
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
      .setOrigin(0);
      
    // Add error message
    const errorText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
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
      this.player = new Player(this, this.scale.width / 2, this.scale.height / 2, {
        spriteKey: this.heroImageKey,
        maxHealth: this.levelManager.playerMaxHealth,
        currentHealth: this.levelManager.playerMaxHealth,
        speed: 200,
        hero: this.selectedHero
      });
    } catch (error) {
      console.error('Error creating player:', error);
      // Fallback will be handled in the Player class
    }
  }

  /**
   * Create UI elements like score, health bar, etc.
   */
  createUI() {
    // Create score display
    this.scoreDisplay = new ScoreDisplay(this, {
      score: this.levelManager.score,
      level: this.levelManager.level,
      wave: this.levelManager.wave,
      characterName: this.selectedHero.name
    });
    
    // Create health bar using the HealthBar class
    const healthConfig = this.screenUtils.getHealthBarConfig();
    this.healthBar = new HealthBar(this, {
      x: 10,
      y: healthConfig.y,
      width: healthConfig.width,
      height: healthConfig.height,
      maxHealth: this.player.maxHealth,
      currentHealth: this.player.currentHealth,
      fontSize: healthConfig.fontSize
    });
    
    // Create game over screen (hidden by default)
    this.gameOverScreen = new GameOverScreen(this, {
      width: this.scale.width,
      height: this.scale.height
    });
  }

  /**
   * Create level up visual effect
   */
  createLevelUpEffect() {
    try {
      if (!this.player || !this.player.sprite) {  
        console.warn('Player or player sprite is missing. Level-up effect cannot be created.');  
        return;  
      }  
      
      // Use effects helper to create level up effect
      this.effectsHelper.createLevelUpEffect(
        this.player.sprite.x,
        this.player.sprite.y,
        this.levelManager.level
      );
    } catch (error) {
      console.error('Error creating level up effect:', error);
    }
  }

  /**
   * Create wave change visual effect in the center of the screen
   */
  createWaveChangeEffect() {
    try {
      // Calculate the center of the screen
      const screenCenterX = this.cameras.main.width / 2;
      const screenCenterY = this.cameras.main.height / 2;
      
      // Use effects helper to create wave change effect
      this.effectsHelper.createWaveChangeEffect(
        screenCenterX,
        screenCenterY,
        this.levelManager.wave
      );
    } catch (error) {
      console.error('Error creating wave change effect:', error);
    }
  }

  /**
   * Handle player taking damage
   * @param {number} amount - Damage amount
   */
  damagePlayer(amount) {
    try {
      if (!this.player) return;
      
      // Apply damage to player using the Player class method
      const died = this.player.takeDamage(amount);
      
      // Update health bar
      if (this.healthBar) {
        this.healthBar.updateHealth(this.player.currentHealth, this.player.maxHealth);
      }
      
      // Create screen flash effect without damage numbers
      if (this.effectsHelper) {
        this.effectsHelper.flashScreen(100, 255, 0, 0, 0.3); // red flash
      }
      
      // If player died, trigger game over
      if (died) {
        this.gameOver();
      }
    } catch (error) {
      console.error('Error applying damage to player:', error);
    }
  }

  /**
   * Handle screen resize event
   * @param {Object} gameSize - New game size
   */
  onScreenResize(gameSize) {
    try {
      const width = gameSize.width;
      const height = gameSize.height;
      
      // Update UI elements for new screen size
      if (this.scoreDisplay) {
        this.scoreDisplay.updateResponsive(width, height);
      }
      
      if (this.healthBar) {
        this.healthBar.updateResponsive(width, height);
      }
      
      if (this.gameOverScreen) {
        this.gameOverScreen.updateSize(width, height);
      }
    } catch (error) {
      console.error('Error handling screen resize:', error);
    }
  }

  /**
   * Update game state on each frame
   * @param {number} time - Current time
   * @param {number} delta - Time since last update
   */
  update(time, delta) {
    try {
      // Update player if available
      if (this.player) {
        this.player.update(time, delta);
      }
      
      // Update enemy manager
      if (this.enemyManager) {
        this.enemyManager.update(time, delta);
      }
      
      // Update collision manager
      if (this.collisionManager) {
        this.collisionManager.update(time, delta);
      }

      if (this.weaponManager) {
        this.weaponManager.update(time, delta);
      }
    } catch (error) {
      console.error('Error in update loop:', error);
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
      
      // Stop difficulty timer
      if (this.levelManager) {
        this.levelManager.stopDifficultyTimer();
      }
      
      // Show game over screen with final score
      if (this.gameOverScreen) {
        this.gameOverScreen.show(this.levelManager.score);
      }
    } catch (error) {
      console.error('Error showing game over screen:', error);
      // Force restart after a delay if game over screen fails
      this.time.delayedCall(3000, () => {
        this.scene.restart();
      });
    }
  }
  
  /**
   * Clean up resources when scene is shut down
   */
  shutdown() {
    try {
      // Clean up managers and helpers
      if (this.inputManager) this.inputManager.destroy();
      if (this.levelManager) this.levelManager.destroy();
      if (this.enemyManager) this.enemyManager.destroy();
      if (this.weaponManager) this.weaponManager.destroy();
      if (this.collisionManager) this.collisionManager.destroy();
      if (this.screenUtils) this.screenUtils.destroy();
      
      // Clean up UI elements
      if (this.healthBar) this.healthBar.destroy();
      if (this.scoreDisplay) this.scoreDisplay.destroy();
      if (this.gameOverScreen) this.gameOverScreen.destroy();
      
      // Clean up player
      if (this.player) this.player.destroy();
      
      // Remove event listeners
      this.scale.off('resize', this.onScreenResize, this);
    } catch (error) {
      console.error('Error during scene shutdown:', error);
    }
    
    // Call parent class shutdown
    super.shutdown();
  }
}