// filepath: /Users/mouryagandalla/Documents/Projects/Hackathon1/retro-pixel-app/retro-pixel-app/src/game/utils/EffectsHelper.js
import Phaser from 'phaser';

/**
 * EffectsHelper class to handle visual effects and animations
 */
export class EffectsHelper {
  /**
   * Create a new effects helper
   * @param {Phaser.Scene} scene - The scene to add effects to
   */
  constructor(scene) {
    this.scene = scene;
  }
  
  /**
   * Create visual effect at collision point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} options - Effect customization options
   */
  createCollisionEffect(x, y, options = {}) {
    try {
      // Default options
      const radius = options.radius || 15;
      const color = options.color || 0xff0000;
      const alpha = options.alpha || 0.7;
      const duration = options.duration || 300;
      const scale = options.scale || 1.5;
      
      // Create a simple circle effect
      const effect = this.scene.add.circle(x, y, radius, color, alpha);
      this.scene.tweens.add({
        targets: effect,
        alpha: 0,
        scale: scale,
        duration: duration,
        onComplete: () => {
          if (effect && effect.destroy) {
            effect.destroy();
          }
        }
      });
      
      return effect;
    } catch (error) {
      console.error('Error creating collision effect:', error);
      return null;
    }
  }
  
  /**
   * Create a text popup effect
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string} text - Text to display
   * @param {Object} options - Effect customization options
   */
  createTextEffect(x, y, text, options = {}) {
    try {
      // Default options
      const color = options.color || '#ffffff';
      const fontSize = options.fontSize || '24px';
      const fontFamily = options.fontFamily || 'Arial';
      const stroke = options.stroke || '#000000';
      const strokeThickness = options.strokeThickness || 4;
      const duration = options.duration || 1500;
      const distance = options.distance || 30;
      
      // Create text object
      const textObject = this.scene.add.text(
        x,
        y,
        text,
        {
          fontSize: fontSize,
          fontFamily: fontFamily,
          fill: color,
          stroke: stroke,
          strokeThickness: strokeThickness
        }
      ).setOrigin(0.5);
      
      // Add animation
      this.scene.tweens.add({
        targets: textObject,
        y: y - distance,
        alpha: 0,
        duration: duration,
        ease: 'Power2',
        onComplete: () => {
          if (textObject && textObject.destroy) {
            textObject.destroy();
          }
        }
      });
      
      return textObject;
    } catch (error) {
      console.error('Error creating text effect:', error);
      return null;
    }
  }
  
  /**
   * Create level up effect with text and particles
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} level - New level number
   */
  createLevelUpEffect(x, y, level) {
    try {
      // Create level up text
      const text = this.createTextEffect(
        x, y, 'LEVEL UP!', 
        {
          color: '#00ff00',
          fontSize: '24px',
          duration: 1500,
          distance: 40
        }
      );
      
      // Create particle effect if supported
      if (this.scene.add.particles) {
        const particles = this.scene.add.particles(x, y, 'flare', {
          speed: 100,
          lifespan: 800,
          quantity: 10,
          scale: { start: 0.2, end: 0 },
          blendMode: 'ADD',
          emitting: false
        });
        
        // One-time burst
        particles.explode(20);
        
        // Clean up particles after animation
        this.scene.time.delayedCall(1000, () => {
          if (particles && particles.destroy) {
            particles.destroy();
          }
        });
      }
      
      // Green screen flash removed
      
      return text;
    } catch (error) {
      console.error('Error creating level up effect:', error);
      return null;
    }
  }
  
  /**
   * Create damage number popup
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} amount - Damage amount
   * @param {boolean} isCritical - Whether this is a critical hit
   */
  createDamageNumber(x, y, amount, isCritical = false) {
    try {
      // Customize based on critical status
      const options = isCritical ? 
        {
          color: '#ff0000',
          fontSize: '28px',
          strokeThickness: 6,
          distance: 50,
          duration: 2000
        } : 
        {
          color: '#ff8800',
          fontSize: '20px',
          strokeThickness: 4,
          distance: 30,
          duration: 1500
        };
      
      // Format the damage number
      const text = isCritical ? `CRIT! ${amount}` : `${amount}`;
      
      // Create the effect
      return this.createTextEffect(x, y, text, options);
    } catch (error) {
      console.error('Error creating damage number:', error);
      return null;
    }
  }
  
  /**
   * Create healing number popup
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} amount - Healing amount
   */
  createHealNumber(x, y, amount) {
    try {
      return this.createTextEffect(
        x, y, `+${amount}`, 
        {
          color: '#00ff00',
          fontSize: '20px',
          stroke: '#005500',
          distance: 40
        }
      );
    } catch (error) {
      console.error('Error creating heal number:', error);
      return null;
    }
  }
  
  /**
   * Flash the screen with a color
   * @param {number} duration - Flash duration in ms
   * @param {number} red - Red component (0-255)
   * @param {number} green - Green component (0-255)
   * @param {number} blue - Blue component (0-255)
   * @param {number} alpha - Alpha value (0-1)
   */
  flashScreen(duration = 100, red = 255, green = 255, blue = 255, alpha = 0.3) {
    // Screen flash effect removed
    return;
  }
  
  /**
   * Shake the screen 
   * @param {number} duration - Shake duration in ms
   * @param {number} intensity - Shake intensity
   */
  shakeScreen(duration = 100, intensity = 0.01) {
    try {
      this.scene.cameras.main.shake(duration, intensity);
    } catch (error) {
      console.warn('Camera shake effect failed:', error);
    }
  }
  
  /**
   * Create a simple explosion effect
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} options - Effect customization options
   */
  createExplosion(x, y, options = {}) {
    try {
      // Default options
      const radius = options.radius || 30;
      const color = options.color || 0xff8800;
      const particleCount = options.particleCount || 20;
      
      // Create center flash
      const flash = this.scene.add.circle(x, y, radius, color, 1);
      
      // Animate the flash
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 2,
        duration: 300,
        onComplete: () => {
          if (flash && flash.destroy) {
            flash.destroy();
          }
        }
      });
      
      // Create particle effect if supported
      if (this.scene.add.particles) {
        const particles = this.scene.add.particles(x, y, 'flare', {
          speed: 150,
          lifespan: 500,
          quantity: 5,
          scale: { start: 0.5, end: 0 },
          blendMode: 'ADD',
          emitting: false
        });
        
        // One-time burst
        particles.explode(particleCount);
        
        // Clean up particles after animation
        this.scene.time.delayedCall(800, () => {
          if (particles && particles.destroy) {
            particles.destroy();
          }
        });
      }
      
      return flash;
    } catch (error) {
      console.error('Error creating explosion effect:', error);
      return null;
    }
  }
}