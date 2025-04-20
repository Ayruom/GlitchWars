// src/game/scenes/PlayScene.js

import { BaseScene } from './BaseScene';

export class PlayScene extends BaseScene {
  constructor(config) {
    super('PlayScene', { ...config, canGoBack: true });
    this.player = null;
    this.cursors = null;
    this.enemies = null;
    this.score = 0;
    this.scoreText = null;
    this.level = 1;
    this.playerSpeed = 200;
    
    // Add these new properties for projectiles
    this.projectiles = null;
    this.lastFired = 0;
    this.fireRate = 500; // ms between shots
    this.projectileSpeed = 300;
    this.spacebar = null; // For firing projectiles
    
    // Character specific properties
    this.knightSword = null;
    this.mageFireballs = [];
    this.swordRotationSpeed = 0.05;
    this.fireballRotationSpeed = 0.03;
    this.bowRange = 400;
  }

  init(data) {
    // Get the hero information passed from the HeroSelectionComponent
    this.selectedHero = data.hero || { id: 'knight', name: 'Pixel Knight' };
  }

  create() {
    super.create();
    
    // Initialize the player with the selected hero
    this.player = this.physics.add.sprite(
      this.screenCenter[0], 
      this.screenCenter[1], 
      this.selectedHero.id
    );
    this.player.setCollideWorldBounds(true);
    if (this.anims.exists(`${this.selectedHero.id}_idle`)) {
      this.player.play(`${this.selectedHero.id}_idle`);
    }
    
    // Setup keyboard inputs
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Create projectile group
    this.projectiles = this.physics.add.group();
    
    // Create enemy group
    this.enemies = this.physics.add.group();
    
    // Add collision detection between projectiles and enemies
    this.physics.add.collider(
      this.projectiles, 
      this.enemies, 
      this.handleProjectileEnemyCollision, 
      null, 
      this
    );
    
    // Add collision detection between player and enemies
    this.physics.add.collider(
      this.player, 
      this.enemies, 
      this.handlePlayerEnemyCollision, 
      null, 
      this
    );
    
    // Initialize UI elements
    this.scoreText = this.add.text(16, 16, 'Score: 0', { 
      fontSize: '18px', 
      fill: '#00ff00' 
    });
    
    // Add weapon info text
    this.weaponText = this.add.text(
      this.config.width - 16, 
      16, 
      `Character: ${this.selectedHero.name}`, 
      { fontSize: '14px', fill: '#00ff00' }
    ).setOrigin(1, 0);
    
    // Initialize character-specific weapons
    this.initializeCharacterWeapons();
    
    // Start spawning enemies
    this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
    
    // Enable mouse input for archer
    if (this.selectedHero.id === 'archer') {
      this.input.on('pointerdown', (pointer) => {
        this.fireArrow(pointer);
      });
    }
  }

  initializeCharacterWeapons() {
    switch(this.selectedHero.id) {
      case 'knight':
        // Create a sword that rotates around the knight
        this.knightSword = this.add.rectangle(
          this.player.x + 40, 
          this.player.y, 
          40, 8, 
          0xaaaaaa
        );
        this.physics.add.existing(this.knightSword);
        this.projectiles.add(this.knightSword);
        
        // Add a handle to make it look more like a sword
        const handle = this.add.rectangle(
          this.player.x + 20, 
          this.player.y, 
          10, 12, 
          0x8b4513
        );
        
        // Group them together
        this.swordGroup = this.add.container(0, 0, [this.knightSword, handle]);
        this.swordGroup.setSize(50, 50);
        
        // Set the sword's pivot point
        this.swordRotation = 0;
        break;
        
      case 'mage':
        // Create 3 fireballs that rotate around the mage
        for (let i = 0; i < 3; i++) {
          const angle = (i * Math.PI * 2) / 3; // Distribute evenly
          const fireball = this.add.circle(
            this.player.x + Math.cos(angle) * 50,
            this.player.y + Math.sin(angle) * 50,
            8,
            0xff4500
          );
          
          // Add a glow effect
          fireball.postFX.addGlow(0xff9900, 8, 0, false);
          
          this.physics.add.existing(fireball);
          this.projectiles.add(fireball);
          
          // Store the fireball and its initial angle
          this.mageFireballs.push({
            sprite: fireball,
            angle: angle
          });
        }
        break;
        
      case 'archer':
        // Archer will fire arrows on mouse click, no initial setup needed
        // Just add an indicator for aiming
        this.aimLine = this.add.line(0, 0, 0, 0, 0, 0, 0x00ff00);
        this.aimLine.setLineWidth(1);
        break;
    }
  }

  update(time) {
    // Player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    } else {
      this.player.setVelocityX(0);
    }
    
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-this.playerSpeed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(this.playerSpeed);
    } else {
      this.player.setVelocityY(0);
    }
    
    // Update character-specific weapons
    this.updateCharacterWeapons();
    
    // Update aim line for archer
    if (this.selectedHero.id === 'archer') {
      const pointer = this.input.activePointer;
      this.aimLine.setTo(
        this.player.x, this.player.y,
        this.player.x + (pointer.x - this.player.x) * 0.5,
        this.player.y + (pointer.y - this.player.y) * 0.5
      );
    }
    
    // Remove projectiles that are out of bounds (for archer)
    this.projectiles.getChildren().forEach(projectile => {
      // Skip sword and fireballs
      if (this.selectedHero.id === 'knight' && projectile === this.knightSword) return;
      if (this.selectedHero.id === 'mage' && this.mageFireballs.some(fb => fb.sprite === projectile)) return;
      
      if (
        projectile.x < -10 ||
        projectile.x > this.config.width + 10 ||
        projectile.y < -10 ||
        projectile.y > this.config.height + 10
      ) {
        projectile.destroy();
      }
    });
  }

  updateCharacterWeapons() {
    switch(this.selectedHero.id) {
      case 'knight':
        // Rotate the sword around the knight
        this.swordRotation += this.swordRotationSpeed;
        
        // Position the sword container at the player position
        this.swordGroup.x = this.player.x;
        this.swordGroup.y = this.player.y;
        this.swordGroup.rotation = this.swordRotation;
        
        // Update hitbox position
        this.knightSword.x = this.player.x + Math.cos(this.swordRotation) * 40;
        this.knightSword.y = this.player.y + Math.sin(this.swordRotation) * 40;
        this.knightSword.rotation = this.swordRotation;
        break;
        
      case 'mage':
        // Rotate the fireballs around the mage
        for (let i = 0; i < this.mageFireballs.length; i++) {
          const fireball = this.mageFireballs[i];
          fireball.angle += this.fireballRotationSpeed;
          
          // Calculate new position
          const newX = this.player.x + Math.cos(fireball.angle) * 50;
          const newY = this.player.y + Math.sin(fireball.angle) * 50;
          
          // Update sprite position
          fireball.sprite.x = newX;
          fireball.sprite.y = newY;
          
          // Update physics body
          fireball.sprite.body.reset(newX, newY);
        }
        break;
    }
  }

  fireArrow(pointer) {
    if (this.selectedHero.id !== 'archer') return;
    
    // Create arrow
    const arrow = this.add.rectangle(
      this.player.x,
      this.player.y,
      16, 4,
      0xffff00
    );
    
    // Add physics
    this.physics.add.existing(arrow);
    this.projectiles.add(arrow);
    
    // Calculate angle to pointer
    const angle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y,
      pointer.x, pointer.y
    );
    
    // Set arrow rotation to match direction
    arrow.rotation = angle;
    
    // Set velocity based on angle
    this.physics.velocityFromRotation(
      angle,
      this.bowRange, 
      arrow.body.velocity
    );
  }

  spawnEnemy() {
    // Randomly spawn enemies outside the visible area
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y;
    
    switch(side) {
      case 0: // top
        x = Math.random() * this.config.width;
        y = -20;
        break;
      case 1: // right
        x = this.config.width + 20;
        y = Math.random() * this.config.height;
        break;
      case 2: // bottom
        x = Math.random() * this.config.width;
        y = this.config.height + 20;
        break;
      case 3: // left
        x = -20;
        y = Math.random() * this.config.height;
        break;
    }
    
    // Create enemy as a rectangle for simplicity
    const enemy = this.add.rectangle(x, y, 20, 20, 0xff0000);
    
    // Add physics
    this.physics.add.existing(enemy);
    this.enemies.add(enemy);
    
    // Make the enemy move toward the player
    this.physics.moveToObject(
      enemy, 
      this.player, 
      100
    );
  }

  handleProjectileEnemyCollision(projectile, enemy) {
    // For knight's sword and mage's fireballs, don't destroy them
    if (
      (this.selectedHero.id === 'knight' && projectile === this.knightSword) ||
      (this.selectedHero.id === 'mage' && this.mageFireballs.some(fb => fb.sprite === projectile))
    ) {
      // Only destroy the enemy
      enemy.destroy();
    } else {
      // For archer's arrows, destroy both
      projectile.destroy();
      enemy.destroy();
    }
    
    // Update score
    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  handlePlayerEnemyCollision(player, enemy) {
    // Just destroy the enemy and update score
    enemy.destroy();
    
    // Update score
    this.score += 5;
    this.scoreText.setText(`Score: ${this.score}`);
  }
}