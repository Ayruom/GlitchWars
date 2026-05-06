import Phaser from 'phaser';
import { Projectile } from '../entities/Projectile';

export class ArcherWeapon {
  constructor(scene, player, params = {}) {
    this.scene = scene;
    this.player = player;
    this.damage = params.damage || 20;
    this.projectileSpeed = params.speed || 400;
    this.attacksPerSecond = params.attacksPerSecond || 1;
    this.cooldownMs = 1000 / this.attacksPerSecond;
    this._elapsed = 0;
    this._overlapHandle = null;

    this.projectileGroup = scene.physics.add.group({
      classType: Projectile,
      runChildUpdate: true,
      maxSize: 30
    });
  }

  update(time, delta) {
    this._elapsed += delta;
    if (this._elapsed < this.cooldownMs) return;
    this._elapsed = 0;
    this._fire();
  }

  _fire() {
    const playerSprite = this.player.sprite;
    if (!playerSprite || !playerSprite.active) return;

    const ptr = this.scene.input.activePointer;
    let angle;
    if (ptr.worldX === 0 && ptr.worldY === 0) {
      angle = 0;
    } else {
      angle = Phaser.Math.RadToDeg(
        Phaser.Math.Angle.Between(playerSprite.x, playerSprite.y, ptr.worldX, ptr.worldY)
      );
    }

    const projectile = this.projectileGroup.get(playerSprite.x, playerSprite.y);
    if (!projectile) return;
    projectile.reset(playerSprite.x, playerSprite.y, this.damage, 'arrow');
    projectile.fireDirectional(angle, this.projectileSpeed);
  }

  registerCollisions(collisionManager, enemyGroup) {
    this._overlapHandle = collisionManager.registerOverlap(
      this.projectileGroup, enemyGroup, this._onHit, this
    );
  }

  unregisterCollisions() {
    if (this._overlapHandle && this.scene.collisionManager) {
      this.scene.collisionManager.unregisterOverlap(this._overlapHandle);
    }
    this._overlapHandle = null;
  }

  applyAttackSpeedUpgrade(multiplier) {
    this.attacksPerSecond = Math.min(64, this.attacksPerSecond * multiplier);
    this.cooldownMs = 1000 / this.attacksPerSecond;
  }

  destroy() {
    this.unregisterCollisions();
    if (this.projectileGroup) {
      this.projectileGroup.destroy(true);
    }
  }

  _onHit(projectileSprite, enemySprite) {
    if (!enemySprite || !enemySprite.active) return;
    if (!projectileSprite || !projectileSprite.active) return;
    const damage = projectileSprite.damage || this.damage;
    projectileSprite._deactivate();
    if (this.scene.enemyManager) {
      this.scene.enemyManager.damageEnemy(enemySprite, damage);
    }
  }
}
