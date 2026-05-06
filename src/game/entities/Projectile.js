import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'arrow');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.damage = 0;
    this._homingTarget = null;
    this._isHoming = false;
    this._lifespanMs = 0;
    this._homingSpeed = 300;
    this._turnRate = 180;
  }

  reset(x, y, damage, textureKey) {
    this.setPosition(x, y);
    this.setTexture(textureKey);
    this.setActive(true);
    this.setVisible(true);
    this.enableBody(false, x, y, true, true);
    this.damage = damage;
    this._homingTarget = null;
    this._isHoming = false;
    this._lifespanMs = 2000;
    this.setVelocity(0, 0);
  }

  fireDirectional(angleDeg, speed) {
    const rad = Phaser.Math.DegToRad(angleDeg);
    this.setVelocity(Math.cos(rad) * speed, Math.sin(rad) * speed);
    this.setRotation(rad);
    this._isHoming = false;
  }

  fireHoming(target, speed) {
    this._homingTarget = target;
    this._isHoming = true;
    this._homingSpeed = speed;
    this.scene.physics.moveToObject(this, target, speed);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;

    this._lifespanMs -= delta;
    if (this._lifespanMs <= 0) {
      this._deactivate();
      return;
    }

    const bounds = this.scene.physics.world.bounds;
    const margin = 80;
    if (
      this.x < bounds.x - margin ||
      this.x > bounds.right + margin ||
      this.y < bounds.y - margin ||
      this.y > bounds.bottom + margin
    ) {
      this._deactivate();
      return;
    }

    if (this._isHoming && this._homingTarget && this._homingTarget.active) {
      const targetAngle = Phaser.Math.Angle.Between(
        this.x, this.y,
        this._homingTarget.x, this._homingTarget.y
      );
      const currentAngle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
      const maxTurn = Phaser.Math.DegToRad(this._turnRate) * (delta / 1000);
      const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, targetAngle, maxTurn);
      this.setVelocity(
        Math.cos(newAngle) * this._homingSpeed,
        Math.sin(newAngle) * this._homingSpeed
      );
      this.setRotation(newAngle);
    }
  }

  _deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.disableBody(true, true);
    this._homingTarget = null;
  }
}
