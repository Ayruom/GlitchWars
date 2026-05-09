// filepath: /Users/mouryagandalla/Documents/Projects/Hackathon1/retro-pixel-app/retro-pixel-app/src/game/managers/LevelManager.js
import Phaser from 'phaser';

/**
 * LevelManager class to handle level progression, scoring, and difficulty
 */
export class LevelManager {
  /**
   * Create a new level manager
   * @param {Phaser.Scene} scene - The scene to bind the level manager to
   * @param {Object} config - Configuration for the level manager
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    
    // Game state
    this.score = config.score || 0;
    this.level = config.level || 1;
    this.wave = config.wave || 1;
    
    // Scoring settings
    this.baseScoreToLevel = config.baseScoreToLevel || 200;
    this.levelScoreMultiplier = config.levelScoreMultiplier || 1.5;
    
    // Health settings
    this.playerMaxHealth = config.playerMaxHealth || 100;
    this.playerCurrentHealth = config.playerCurrentHealth || 100;
    this.maxHealthCap = config.maxHealthCap || 200;
    this.healthIncreaseAmount = config.healthIncreaseAmount || 10;
    
    // Difficulty settings
    this.enemySpawnRate = config.enemySpawnRate || 2000;
    this.enemyBaseSpeed = config.enemyBaseSpeed || 100;

    this.difficultyIncreaseInterval = config.difficultyIncreaseInterval || 10000;
    
    // Register callbacks
    this.onLevelUpCallbacks = [];
    this.onWaveChangeCallbacks = [];
    this.onScoreUpdateCallbacks = [];
    
    // Auto-start difficulty scaling timer
    if (config.autoStartDifficultyTimer !== false) {
      this.startDifficultyTimer();
    }
  }
  
  /**
   * Start the difficulty scaling timer
   */
  startDifficultyTimer() {
    this.difficultyTimer = this.scene.time.addEvent({
      delay: this.difficultyIncreaseInterval,
      callback: this.increaseDifficulty,
      callbackScope: this,
      loop: true
    });
    
    return this;
  }
  
  /**
   * Stop the difficulty scaling timer
   */
  stopDifficultyTimer() {
    if (this.difficultyTimer) {
      this.difficultyTimer.remove();
      this.difficultyTimer = null;
    }
    
    return this;
  }
  
  /**
   * Add score points and check for level up
   * @param {number} points - Points to add
   */
  addScore(points) {
    // Increase points based on level and wave for more challenge
    const scaledPoints = Math.floor(points * (1 + (this.level * 0.1) + (this.wave * 0.2)));
    this.score += scaledPoints;
    
    // Notify callbacks
    this.notifyScoreUpdateCallbacks();
    
    // Check for level up condition using exponential scaling
    const scoreToLevel = this.baseScoreToLevel * Math.pow(this.levelScoreMultiplier, this.level - 1);
    if (this.score >= scoreToLevel) {
      this.levelUp();
    }
    
    return this;
  }
  
  /**
   * Increase player level and apply related effects
   */
  levelUp() {
    this.level++;
    
    // Notify callbacks
    this.notifyLevelUpCallbacks();
    
    // Increase wave after certain levels
    if (this.level % 5 === 0) {
      this.wave++;

      // Immediately sync EnemyManager so spawn health reflects the new wave without waiting for the 10s difficulty timer
      this.scene.enemyManager?.updateDifficulty(this.level, this.wave);

      // Notify wave change callbacks
      this.notifyWaveChangeCallbacks();
      
      // Limited health increase with cap
      const prevMaxHealth = this.playerMaxHealth;
      this.playerMaxHealth = Math.min(this.maxHealthCap, this.playerMaxHealth + this.healthIncreaseAmount);
      
      // Small heal on wave completion
      const healAmount = this.playerMaxHealth * 0.2;
      this.playerCurrentHealth = Math.min(
        this.playerMaxHealth,
        this.playerCurrentHealth + healAmount
      );
    }
    
    // Slower player speed increase
    this.playerSpeed = Math.min(300, (this.playerSpeed || 200) + 5);
    
    // Increase enemy spawn rate and damage with each level
    this.enemySpawnRate = Math.max(500, this.enemySpawnRate - 50);
    this.enemyContactDamage = Math.min(20, (this.enemyContactDamage || 5) + 1);
    
    return this;
  }
  
  /**
   * Increase game difficulty periodically
   */
  increaseDifficulty() {
    // Increase enemy spawn rate
    const newDelay = Math.max(500, this.enemySpawnRate - 100);
    if (newDelay !== this.enemySpawnRate) {
      this.enemySpawnRate = newDelay;
    }
    
    // Increase enemy speed
    this.enemyBaseSpeed = Math.min(200, this.enemyBaseSpeed + 5);
    
    // Notify enemy manager of difficulty change if needed
    if (this.scene.enemyManager) {
      this.scene.enemyManager.updateDifficulty(this.level, this.wave);
      this.scene.enemyManager.updateSpawnRate(this.enemySpawnRate);
    }
    
    return this;
  }
  
  /**
   * Register callback for level up events
   * @param {Function} callback - Callback function
   */
  onLevelUp(callback) {
    this.onLevelUpCallbacks.push(callback);
    return this;
  }
  
  /**
   * Register callback for wave change events
   * @param {Function} callback - Callback function
   */
  onWaveChange(callback) {
    this.onWaveChangeCallbacks.push(callback);
    return this;
  }
  
  /**
   * Register callback for score update events
   * @param {Function} callback - Callback function
   */
  onScoreUpdate(callback) {
    this.onScoreUpdateCallbacks.push(callback);
    return this;
  }
  
  /**
   * Notify all level up callbacks
   * @private
   */
  notifyLevelUpCallbacks() {
    for (const callback of this.onLevelUpCallbacks) {
      callback(this.level);
    }
  }
  
  /**
   * Notify all wave change callbacks
   * @private
   */
  notifyWaveChangeCallbacks() {
    for (const callback of this.onWaveChangeCallbacks) {
      callback(this.wave);
    }
  }
  
  /**
   * Notify all score update callbacks
   * @private
   */
  notifyScoreUpdateCallbacks() {
    for (const callback of this.onScoreUpdateCallbacks) {
      callback(this.score);
    }
  }
  
  /**
   * Get the current difficulty settings
   * @returns {Object} Current difficulty settings
   */
  getDifficultySettings() {
    return {
      level: this.level,
      wave: this.wave,
      enemySpawnRate: this.enemySpawnRate,
      enemyBaseSpeed: this.enemyBaseSpeed,

      enemyContactDamage: this.enemyContactDamage
    };
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.stopDifficultyTimer();
    this.onLevelUpCallbacks = [];
    this.onWaveChangeCallbacks = [];
    this.onScoreUpdateCallbacks = [];
  }
}