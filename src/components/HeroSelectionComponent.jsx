// src/components/HeroSelectionComponent.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function HeroSelectionComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedHero, setSelectedHero] = useState(null);
  const selectedGender = location.state?.selectedGender;

  // Enable scrolling when component mounts
  useEffect(() => {
    // Enable scrolling for the page
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    return () => {
      // Reset scrolling settings when component unmounts
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Redirect if no gender is selected
  if (!selectedGender) {
    navigate('/select-gender');
    return null;
  }

  // Define hero images based on gender selection
  const heroImages = {
    male: {
      knight: 'TBD', // To be decided
      mage1: '/assets/SelectHeroScreenImages/Men/Wizard/Male wizard 1 128X128.png',
      mage2: '/assets/SelectHeroScreenImages/Men/Wizard/Male wizard 2 128X128.png',
      mage3: '/assets/SelectHeroScreenImages/Men/Wizard/Male wizard 3 128X128.png',
      archer: 'TBD', // To be decided
    },
    female: {
      knight: 'TBD', // To be decided
      mage1: '/assets/SelectHeroScreenImages/Female/Wizard/Wizard Female 1 128X128.png',
      mage2: '/assets/SelectHeroScreenImages/Female/Wizard/Wizard Female 2 128X128.png',
      archer: '/assets/SelectHeroScreenImages/Female/Archer/Archer Female 128X128.png',
    }
  };

  // Gender-specific hero options
  const heroes = [
    {
      id: 'knight',
      name: 'Pixel Knight',
      image: selectedGender.id === 'male' ? heroImages.male.knight : heroImages.female.knight,
      type: 'Warrior',
      available: false // Set to false until images are available
    },
    {
      id: 'mage1',
      name: 'Retro Mage I',
      image: selectedGender.id === 'male' ? heroImages.male.mage1 : heroImages.female.mage1,
      type: 'Wizard',
      available: true
    },
    {
      id: 'mage2',
      name: 'Retro Mage II',
      image: selectedGender.id === 'male' ? heroImages.male.mage2 : heroImages.female.mage2,
      type: 'Wizard',
      available: true
    },
    {
      id: 'mage3',
      name: 'Retro Mage III',
      image: selectedGender.id === 'male' ? heroImages.male.mage3 : null,
      type: 'Wizard',
      available: selectedGender.id === 'male' // Only available for male
    },
    {
      id: 'archer',
      name: 'Archer',
      image: selectedGender.id === 'male' ? heroImages.male.archer : heroImages.female.archer,
      type: 'Ranger',
      available: selectedGender.id === 'female' // Only available for female until male image is decided
    },
  ];

  // Filter out unavailable heroes
  const availableHeroes = heroes.filter(hero => hero.available && hero.image);

  // Group heroes by type
  const heroTypes = {};
  availableHeroes.forEach(hero => {
    if (!heroTypes[hero.type]) {
      heroTypes[hero.type] = [];
    }
    heroTypes[hero.type].push(hero);
  });

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
    <div className="min-h-screen bg-black overflow-y-auto">
      {/* Header section */}
      <div className="flex flex-col items-center bg-black pt-4 pb-2">
        {/* Back Button */}
        <div className="my-4">
          <button
            onClick={() => navigate('/select-gender')}
            className="px-6 py-2 font-pixel text-cyan-400 border border-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-300 transition-all duration-300"
          >
            ← BACK
          </button>
        </div>

        <h2 className="text-4xl font-pixel text-cyan-400 mb-4">
          Choose Your {selectedGender.id === 'male' ? 'Hero' : 'Heroine'}
        </h2>
      </div>

      {/* Hero columns - displayed side by side */}
      <div className="flex justify-center w-full px-4">
        {Object.entries(heroTypes).map(([type, heroList]) => (
          <div key={type} className="flex flex-col items-center mx-4">
            {/* Type heading */}
            <h3 className="text-3xl font-pixel text-cyan-400 my-6 bg-black py-2">{type}</h3>
            
            {/* Characters of this type - displayed in a vertical list with more spacing */}
            <div className="flex flex-col items-center gap-20 mb-8">
              {heroList.map((hero) => (
                <div 
                  key={hero.id} 
                  className={`flex flex-col items-center cursor-pointer transition-transform duration-300 ${selectedHero?.id === hero.id ? 'scale-110' : 'hover:scale-105'}`}
                  onClick={() => selectHero(hero)}
                >
                  <div className={`mb-4 relative ${
                    selectedHero?.id === hero.id 
                      ? selectedGender.id === 'female'
                        ? 'drop-shadow-[0_0_15px_rgba(255,0,255,0.7)]' // Neon pink for selected female
                        : 'drop-shadow-[0_0_15px_rgba(0,100,255,0.7)]' // Neon blue for selected male
                      : selectedGender.id === 'female'
                        ? 'hover:drop-shadow-[0_0_12px_rgba(255,0,255,0.5)]' // Neon pink for hovered female
                        : 'hover:drop-shadow-[0_0_12px_rgba(0,100,255,0.5)]' // Neon blue for hovered male
                  } transition-all duration-300`}>
                    <img 
                      src={hero.image} 
                      alt={hero.name} 
                      className="h-32 w-32 object-contain"
                    />
                  </div>
                  <p className={`text-xl font-pixel ${
                    selectedHero?.id === hero.id 
                      ? selectedGender.id === 'female' ? 'text-pink-300' : 'text-blue-300'
                      : selectedGender.id === 'female' ? 'text-pink-400' : 'text-blue-400'
                  } transition-colors duration-300`}>
                    {hero.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Play button - removed the footer from here */}
      <div className="w-full bg-black pt-4 pb-12 flex flex-col items-center mt-8">
        {selectedHero && (
          <button
            onClick={startGame}
            className="font-pixel px-8 py-3 text-lg border-2 border-green-600 text-green-400 hover:bg-green-900/30 hover:text-green-300 hover:border-green-400 transition-all duration-300 mb-6"
          >
            PLAY AS {selectedHero.name.toUpperCase()}
          </button>
        )}
      </div>
    </div>
  );
}