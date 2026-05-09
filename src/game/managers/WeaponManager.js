import { WeaponFactory } from '../weapons/WeaponFactory';
import { getHeroConfig } from '../config/heroes';

export class WeaponManager {
  constructor(scene, player, enemyManager, collisionManager) {
    this.scene = scene;
    this.player = player;
    this.enemyManager = enemyManager;
    this.collisionManager = collisionManager;
    this._weapons = new Map();
    this._initFromHeroConfig();
  }

  _initFromHeroConfig() {
    try {
      const { id, gender } = this.scene.selectedHero || {};
      if (!id || !gender) {
        console.warn('WeaponManager: selectedHero missing id or gender');
        return;
      }
      const heroConfig = getHeroConfig(id, gender);
      if (!heroConfig) {
        console.warn(`WeaponManager: no hero config for id="${id}" gender="${gender}"`);
        return;
      }
      for (const weaponDef of heroConfig.weapons) {
        try {
          const weapon = WeaponFactory.create(weaponDef.type, this.scene, this.player, weaponDef.params);
          this.addWeapon(weaponDef.weaponId, weapon);
        } catch (err) {
          console.error(`WeaponManager: failed to create weapon "${weaponDef.weaponId}":`, err);
        }
      }
    } catch (err) {
      console.error('WeaponManager: error initializing from hero config:', err);
    }
  }

  addWeapon(id, weapon) {
    if (this._weapons.has(id)) {
      console.warn(`WeaponManager.addWeapon: id "${id}" already exists`);
      return;
    }
    weapon.registerCollisions(this.collisionManager, this.enemyManager.enemies);
    this._weapons.set(id, weapon);
  }

  removeWeapon(id) {
    const weapon = this._weapons.get(id);
    if (!weapon) return;
    weapon.unregisterCollisions();
    weapon.destroy();
    this._weapons.delete(id);
  }

  replaceWeapon(id, newWeapon) {
    this.removeWeapon(id);
    this.addWeapon(id, newWeapon);
  }

  getWeapon(id) {
    return this._weapons.get(id);
  }

  hasWeapon(id) {
    return this._weapons.has(id);
  }

  applyAttackSpeedUpgrade(multiplier, weaponId = null) {
    if (weaponId !== null) {
      const weapon = this._weapons.get(weaponId);
      if (weapon) weapon.applyAttackSpeedUpgrade(multiplier);
      return;
    }
    for (const weapon of this._weapons.values()) {
      weapon.applyAttackSpeedUpgrade(multiplier);
    }
  }

  update(time, delta) {
    try {
      for (const weapon of this._weapons.values()) {
        weapon.update(time, delta);
      }
    } catch (err) {
      console.error('WeaponManager update error:', err);
    }
  }

  destroy() {
    for (const id of [...this._weapons.keys()]) {
      this.removeWeapon(id);
    }
    this._weapons.clear();
  }
}
