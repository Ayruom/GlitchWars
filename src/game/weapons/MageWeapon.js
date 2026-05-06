import Phaser from 'phaser';
import { Projectile } from '../entities/Projectile';

export class MageWeapon {
  constructor(scene, player, params = {}) {
    this.scene = scene;
    this.player = player;
    this.damage = params.damage ?? 25;
    this.projectileSpeed = params.speed ?? 300;
    this.attacksPerSecond = params.attacksPerSecond ?? 1;
    this.cooldownMs = 1000 / this.attacksPerSecond;
    this._elapsed = 0;
    this.range = params.range ?? 600;
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
    const target = this._findNearestEnemy();
    if (!target) return;
    const projectile = this.projectileGroup.get(playerSprite.x, playerSprite.y);
    if (!projectile) return;
    projectile.reset(playerSprite.x, playerSprite.y, this.damage, 'fireball');
    projectile.fireHoming(target, this.projectileSpeed);
  }

  _findNearestEnemy() {
    if (!this.scene.enemyManager || !this.scene.enemyManager.enemies) return null;
    const playerSprite = this.player.sprite;
    const rangeSq = this.range > 0 ? this.range * this.range : Infinity;
    const children = this.scene.enemyManager.enemies.getChildren();
    let nearest = null;
    let nearestDistSq = Infinity;
    for (let i = 0; i < children.length; i++) {
      const enemy = children[i];
      if (!enemy.active) continue;
      const distSq = Phaser.Math.Distance.Squared(
        playerSprite.x, playerSprite.y, enemy.x, enemy.y
      );
      if (distSq < rangeSq && distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = enemy;
      }
    }
    return nearest;
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
