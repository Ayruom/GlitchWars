export const HEROES = [
  {
    id: 'mage1',
    gender: 'male',
    image: '/assets/WizardsInGameImages/Male/FinalPlayUse/Wizard Male1 60X60.png',
    weapons: [{ weaponId: 'mage1-primary', type: 'mage-fireball', params: {} }]
  },
  {
    id: 'mage2',
    gender: 'male',
    image: '/assets/WizardsInGameImages/Male/FinalPlayUse/Wizard Male2 60X60.png',
    weapons: [{ weaponId: 'mage2-primary', type: 'mage-fireball', params: {} }]
  },
  {
    id: 'mage3',
    gender: 'male',
    image: '/assets/WizardsInGameImages/Male/FinalPlayUse/Wizard Male3 64X64.png',
    weapons: [{ weaponId: 'mage3-primary', type: 'mage-fireball', params: {} }]
  },
  {
    id: 'mage1',
    gender: 'female',
    image: '/assets/WizardsInGameImages/Female/FinalPlayUse/Wizard Female1 60X60.png',
    weapons: [{ weaponId: 'mage1-female-primary', type: 'mage-fireball', params: {} }]
  },
  {
    id: 'mage2',
    gender: 'female',
    image: '/assets/WizardsInGameImages/Female/FinalPlayUse/Wizard Female2 60X60.png',
    weapons: [{ weaponId: 'mage2-female-primary', type: 'mage-fireball', params: {} }]
  },
  {
    id: 'archer',
    gender: 'female',
    image: '/assets/ArchersInGameImages/Female/FinalPlayUse/Archer Female 64X64.png',
    weapons: [{ weaponId: 'archer-primary', type: 'archer-arrow', params: {} }]
  }
];

export function getHeroConfig(id, gender) {
  return HEROES.find(h => h.id === id && h.gender === gender);
}
