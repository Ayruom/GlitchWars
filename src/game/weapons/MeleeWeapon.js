import Phaser from 'phaser';

export class MeleeWeapon {
  constructor(scene, player, params = {}) {
    this.scene = scene;
    this.player = player;
    this.damage = params.damage || 40;
    this.attacksPerSecond = params.attacksPerSecond || 1;
    this.cooldownMs = 1000 / this.attacksPerSecond;
    this._elapsed = 0;
    this.meleeRadius = params.meleeRadius || 80;
  }

  update(time, delta) {
    this._elapsed += delta;
    if (this._elapsed < this.cooldownMs) return;
    this._elapsed = 0;
    this._strike();
  }

  _strike() {
    const playerSprite = this.player.sprite;
    if (!playerSprite || !playerSprite.active) return;
    const target = this._findNearestInRange();
    if (!target || !target.active) return;
    if (this.scene.enemyManager) {
      this.scene.enemyManager.damageEnemy(target, this.damage);
    }
    if (this.scene.effectsHelper) {
      this.scene.effectsHelper.createCollisionEffect(playerSprite.x, playerSprite.y);
    }
  }

  _findNearestInRange() {
    if (!this.scene.enemyManager || !this.scene.enemyManager.enemies) return null;
    const playerSprite = this.player.sprite;
    const radiusSq = this.meleeRadius * this.meleeRadius;
    const children = this.scene.enemyManager.enemies.getChildren();
    let nearest = null;
    let nearestDistSq = Infinity;
    for (let i = 0; i < children.length; i++) {
      const enemy = children[i];
      if (!enemy.active) continue;
      const distSq = Phaser.Math.Distance.Squared(
        playerSprite.x, playerSprite.y, enemy.x, enemy.y
      );
      if (distSq <= radiusSq && distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = enemy;
      }
    }
    return nearest;
  }

  registerCollisions(_collisionManager, _enemyGroup) {}
  unregisterCollisions() {}

  applyAttackSpeedUpgrade(multiplier) {
    this.attacksPerSecond = Math.min(64, this.attacksPerSecond * multiplier);
    this.cooldownMs = 1000 / this.attacksPerSecond;
  }

  destroy() {}
}
