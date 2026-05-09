import { ArcherWeapon } from './ArcherWeapon';
import { MageWeapon } from './MageWeapon';
import { MeleeWeapon } from './MeleeWeapon';

export const WeaponFactory = {
  create(type, scene, player, params = {}) {
    switch (type) {
      case 'archer-arrow': return new ArcherWeapon(scene, player, params);
      case 'mage-fireball': return new MageWeapon(scene, player, params);
      case 'melee-strike': return new MeleeWeapon(scene, player, params);
      default: throw new Error(`WeaponFactory: unknown weapon type "${type}"`);
    }
  }
};
