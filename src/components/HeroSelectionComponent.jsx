// src/components/HeroSelectionComponent.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

export function HeroSelectionComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedHero, setSelectedHero] = useState(null);
  const selectedGender = location.state?.selectedGender;

  // Redirect if no gender is selected
  if (!selectedGender) {
    navigate('/select-gender');
    return null;
  }

  const heroes = [
    {
      id: 'knight',
      name: 'Pixel Knight',
      image: '/assets/swordsman.png',
      type: 'Warrior'
    },
    {
      id: 'mage',
      name: 'Retro Mage',
      image: selectedGender.image, // Use the gender-specific wizard image
      type: 'Wizard'
    },
    {
      id: 'archer',
      name: 'Archer',
      image: '/assets/archer.png',
      type: 'Ranger'
    },
  ];

  const selectHero = (hero) => {
    setSelectedHero(hero);
  };

  const startGame = () => {
    if (selectedHero) {
      navigate('/game', { 
        state: { 
          hero: {
            ...selectedHero,
            gender: selectedGender.id
          }
        } 
      });
    }
  };

  return (
    <section className="text-center py-10">
      {/* Back Button */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/select-gender')}
          className="px-4 py-2 font-pixel bg-green-700 text-white border-2 border-green-500 rounded-md shadow-md transition-all duration-300 ease-in-out hover:bg-green-600 hover:scale-105"
        >
          ← BACK
        </button>
      </div>

      <h2 className="text-3xl mb-6 text-pink-500">Select Your Hero</h2>
      <div className="flex justify-center flex-wrap gap-8 mb-10">
        {heroes.map((hero) => (
          <div 
            key={hero.id} 
            className={`w-48 cursor-pointer transition-all duration-300 p-4 rounded-lg ${
              selectedHero?.id === hero.id 
                ? 'bg-pink-900/50 scale-110 shadow-[0_0_15px_rgba(255,0,255,0.5)]' 
                : 'hover:bg-zinc-900/50'
            }`}
            onClick={() => selectHero(hero)}
          >
            <img 
              src={hero.image} 
              alt={hero.name} 
              className="mb-2 w-32 h-32 object-contain mx-auto"
            />
            <p className="text-green-400 font-bold">{hero.name}</p>
            <p className="text-cyan-300 text-xs">{hero.type}</p>
          </div>
        ))}
      </div>

      <button
        onClick={startGame}
        disabled={!selectedHero}
        className={`px-8 py-4 font-pixel text-lg bg-pink-600 text-white rounded-md transition-all duration-300 ${
          selectedHero 
            ? 'hover:bg-pink-500 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,0,255,0.8)]' 
            : 'opacity-50 cursor-not-allowed'
        }`}
      >
        {selectedHero ? `PLAY AS ${selectedHero.name.toUpperCase()}` : 'SELECT A HERO TO CONTINUE'}
      </button>
    </section>
  );
}