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
      // Create pixel-style container for the effect
      const container = this.scene.add.container(x, y);
      
      // Create main text with pixel font
      const mainText = this.scene.add.text(
        0, 0,
        'LEVEL UP!!',
        {
          fontFamily: 'monospace',
          fontSize: '28px',
          fill: '#00ff00',
          stroke: '#003300',
          strokeThickness: 4
        }
      ).setOrigin(0.5);
      container.add(mainText);
      
      // Create glitch effect elements - using RGB color split
      const glitchText1 = this.scene.add.text(
        2, 2,
        'LEVEL UP!!',
        {
          fontFamily: 'monospace',
          fontSize: '28px',
          fill: '#00ffff',
          alpha: 0.7
        }
      ).setOrigin(0.5);
      
      const glitchText2 = this.scene.add.text(
        -2, -1,
        'LEVEL UP!!',
        {
          fontFamily: 'monospace',
          fontSize: '28px',
          fill: '#ff00ff',
          alpha: 0.7
        }
      ).setOrigin(0.5);
      
      container.add([glitchText1, glitchText2]);
      
      // Pixel noise rectangles - these will flash to create digital noise effect
      const pixelNoise = [];
      for (let i = 0; i < 10; i++) {
        const rect = this.scene.add.rectangle(
          Phaser.Math.Between(-50, 50),
          Phaser.Math.Between(-30, 30),
          Phaser.Math.Between(5, 15),
          Phaser.Math.Between(2, 6),
          0xffffff,
          Phaser.Math.FloatBetween(0.3, 0.7)
        );
        pixelNoise.push(rect);
        container.add(rect);
      }
      
      // Level number display
      if (level) {
        const levelText = this.scene.add.text(
          0, 30,
          `LEVEL ${level}`,
          {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#ffffff',
            stroke: '#003300',
            strokeThickness: 3
          }
        ).setOrigin(0.5);
        container.add(levelText);
      }
      
      // Initial scale animation
      this.scene.tweens.add({
        targets: container,
        scale: { from: 0.5, to: 1 },
        duration: 200,
        ease: 'Back.Out'
      });
      
      // Set up glitch animation using discrete tweens and timers instead of timeline
      let glitchCount = 0;
      const maxGlitches = 8;
      
      const performGlitch = () => {
        // Skip if container was already destroyed
        if (!container || !container.active) return;
        
        // Random glitch movement for colored text layers
        this.scene.tweens.add({
          targets: glitchText1,
          x: Phaser.Math.Between(-6, 6),
          y: Phaser.Math.Between(-4, 4),
          alpha: Phaser.Math.FloatBetween(0.5, 0.8),
          duration: 50,
          onComplete: () => {
            if (++glitchCount < maxGlitches) {
              // Schedule next glitch
              this.scene.time.delayedCall(100, performGlitch);
            } else {
              // After glitches complete, start floating up and fading
              this.scene.tweens.add({
                targets: container,
                y: y - 40,
                duration: 1000,
                ease: 'Sine.InOut',
                onComplete: () => {
                  // Final fade out
                  this.scene.tweens.add({
                    targets: container,
                    alpha: 0,
                    scale: 1.2,
                    duration: 400,
                    onComplete: () => {
                      if (container && container.destroy) {
                        container.destroy();
                      }
                    }
                  });
                }
              });
            }
          }
        });
        
        // Animate second glitch text separately
        this.scene.tweens.add({
          targets: glitchText2,
          x: Phaser.Math.Between(-6, 6),
          y: Phaser.Math.Between(-4, 4),
          alpha: Phaser.Math.FloatBetween(0.5, 0.8),
          duration: 50
        });
      };
      
      // Start the first glitch after a short delay
      this.scene.time.delayedCall(200, performGlitch);
      
      // Animate pixel noise rectangles separately
      pixelNoise.forEach(rect => {
        // Random movement and flickering
        this.scene.tweens.add({
          targets: rect,
          alpha: { from: rect.alpha, to: 0 },
          x: `+=${Phaser.Math.Between(-20, 20)}`,
          y: `+=${Phaser.Math.Between(-10, 10)}`,
          duration: Phaser.Math.Between(200, 600),
          repeat: 3,
          yoyo: true
        });
      });
      
      // Optional: Camera effects
      this.shakeScreen(150, 0.005);
      
      // Create additional particle effects
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
        particles.explode(25);
        
        // Clean up particles after animation
        this.scene.time.delayedCall(1000, () => {
          if (particles && particles.destroy) {
            particles.destroy();
          }
        });
      }
      
      return container;
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
  
  /**
   * Create wave change effect with text and glitch animation
   * @param {number} x - X coordinate (center of screen)
   * @param {number} y - Y coordinate (center of screen)
   * @param {number} waveNumber - New wave number
   */
  createWaveChangeEffect(x, y, waveNumber) {
    try {
      // Create pixel-style container for the effect
      const container = this.scene.add.container(x, y);
      
      // Create main text with pixel font
      const mainText = this.scene.add.text(
        0, 0,
        `WAVE ${waveNumber}`,
        {
          fontFamily: 'monospace',
          fontSize: '32px',
          fill: '#ff9900',
          stroke: '#662200',
          strokeThickness: 4
        }
      ).setOrigin(0.5);
      container.add(mainText);
      
      // Create glitch effect elements - using RGB color split
      const glitchText1 = this.scene.add.text(
        2, 2,
        `WAVE ${waveNumber}`,
        {
          fontFamily: 'monospace',
          fontSize: '32px',
          fill: '#00ffff',
          alpha: 0.7
        }
      ).setOrigin(0.5);
      
      const glitchText2 = this.scene.add.text(
        -2, -1,
        `WAVE ${waveNumber}`,
        {
          fontFamily: 'monospace',
          fontSize: '32px',
          fill: '#ff00ff',
          alpha: 0.7
        }
      ).setOrigin(0.5);
      
      container.add([glitchText1, glitchText2]);
      
      // Pixel noise rectangles - these will flash to create digital noise effect
      const pixelNoise = [];
      for (let i = 0; i < 12; i++) {
        const rect = this.scene.add.rectangle(
          Phaser.Math.Between(-60, 60),
          Phaser.Math.Between(-35, 35),
          Phaser.Math.Between(5, 20),
          Phaser.Math.Between(2, 8),
          0xffffff,
          Phaser.Math.FloatBetween(0.3, 0.7)
        );
        pixelNoise.push(rect);
        container.add(rect);
      }
      
      // Initial scale animation - starts large and pulses down
      this.scene.tweens.add({
        targets: container,
        scale: { from: 1.5, to: 1 },
        duration: 300,
        ease: 'Back.Out'
      });
      
      // Set up glitch animation
      let glitchCount = 0;
      const maxGlitches = 10;
      
      const performGlitch = () => {
        // Skip if container was already destroyed
        if (!container || !container.active) return;
        
        // Random glitch movement for colored text layers
        this.scene.tweens.add({
          targets: glitchText1,
          x: Phaser.Math.Between(-8, 8),
          y: Phaser.Math.Between(-5, 5),
          alpha: Phaser.Math.FloatBetween(0.5, 0.8),
          duration: 50,
          onComplete: () => {
            if (++glitchCount < maxGlitches) {
              // Schedule next glitch
              this.scene.time.delayedCall(100, performGlitch);
            } else {
              // After glitches complete, start pulsing and fading
              this.scene.tweens.add({
                targets: container,
                scale: 1.1,
                duration: 800,
                yoyo: true,
                repeat: 1,
                ease: 'Sine.InOut',
                onComplete: () => {
                  // Final fade out
                  this.scene.tweens.add({
                    targets: container,
                    alpha: 0,
                    scale: 1.4,
                    duration: 400,
                    onComplete: () => {
                      if (container && container.destroy) {
                        container.destroy();
                      }
                    }
                  });
                }
              });
            }
          }
        });
        
        // Animate second glitch text separately
        this.scene.tweens.add({
          targets: glitchText2,
          x: Phaser.Math.Between(-8, 8),
          y: Phaser.Math.Between(-5, 5),
          alpha: Phaser.Math.FloatBetween(0.5, 0.8),
          duration: 50
        });
      };
      
      // Start the first glitch after a short delay
      this.scene.time.delayedCall(200, performGlitch);
      
      // Animate pixel noise rectangles separately
      pixelNoise.forEach(rect => {
        // Random movement and flickering
        this.scene.tweens.add({
          targets: rect,
          alpha: { from: rect.alpha, to: 0 },
          x: `+=${Phaser.Math.Between(-25, 25)}`,
          y: `+=${Phaser.Math.Between(-15, 15)}`,
          duration: Phaser.Math.Between(200, 600),
          repeat: 3,
          yoyo: true
        });
      });
      
      // Camera effects - stronger than level up 
      this.shakeScreen(200, 0.008);
      
      // Create additional particle effects
      if (this.scene.add.particles) {
        const particles = this.scene.add.particles(x, y, 'flare', {
          speed: 120,
          lifespan: 1000,
          quantity: 15,
          scale: { start: 0.3, end: 0 },
          blendMode: 'ADD',
          emitting: false
        });
        
        // One-time burst
        particles.explode(30);
        
        // Clean up particles after animation
        this.scene.time.delayedCall(1200, () => {
          if (particles && particles.destroy) {
            particles.destroy();
          }
        });
      }
      
      return container;
    } catch (error) {
      console.error('Error creating wave change effect:', error);
      return null;
    }
  }
}