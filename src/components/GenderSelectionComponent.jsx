import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function GenderSelectionComponent() {
  const navigate = useNavigate();
  const [selectedGender, setSelectedGender] = useState(null);

  const genders = [
    {
      id: 'male',
      label: 'Male',
      image: '/assets/GenderSelectionScreenImages/Male wizard 384X384.png'
    },
    {
      id: 'female',
      label: 'Female',
      image: '/assets/GenderSelectionScreenImages/Wizard Female 384X384.png'
    }
  ];

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
  };

  const handleContinue = () => {
    if (selectedGender) {
      navigate('/select-hero', { state: { selectedGender } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-black">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center py-10">
        {/* Back Button - Now centered */}
        <div className="mb-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 font-pixel text-green-400 border-2 border-green-500 hover:bg-green-900/30 hover:text-green-300 transition-all duration-300"
          >
            ← BACK
          </button>
        </div>

        {/* Title */}
        <h2 className="text-4xl font-pixel text-cyan-400 mb-16">Choose Your Gender</h2>
        
        {/* Gender Selection Cards */}
        <div className="grid grid-cols-2 w-full max-w-5xl px-12 gap-16 mb-16">
          {genders.map((gender) => (
            <div
              key={gender.id}
              className="flex flex-col items-center justify-center cursor-pointer transition-all duration-300 p-6 relative"
              onClick={() => handleGenderSelect(gender)}
            >
              {/* Character Image Container */}
              <div className="h-80 flex items-center justify-center mb-6">
                <img 
                  src={gender.image} 
                  alt={gender.label} 
                  className={`h-full object-contain transition-all duration-300 ${
                    selectedGender?.id === gender.id 
                      ? gender.id === 'male'
                        ? 'drop-shadow-[0_0_20px_rgba(0,157,255,0.8)] scale-110' 
                        : 'drop-shadow-[0_0_20px_rgba(255,0,255,0.8)] scale-110'
                      : gender.id === 'male'
                        ? 'hover:drop-shadow-[0_0_15px_rgba(0,157,255,0.6)] hover:scale-105' 
                        : 'hover:drop-shadow-[0_0_15px_rgba(255,0,255,0.6)] hover:scale-105'
                  }`}
                />
              </div>
              
              {/* Character Label */}
              <p className={`text-2xl font-pixel transition-all duration-300 ${
                selectedGender?.id === gender.id 
                  ? gender.id === 'male' 
                    ? 'text-blue-400' 
                    : 'text-pink-400'
                  : gender.id === 'male' 
                    ? 'text-blue-500 hover:text-blue-400' 
                    : 'text-pink-500 hover:text-pink-400'
              }`}>
                {gender.label}
              </p>
            </div>
          ))}
        </div>

        {/* Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedGender}
          className={`font-pixel px-8 py-3 text-lg border-2 transition-all duration-300 ${
            !selectedGender 
              ? 'border-gray-700 text-gray-500 cursor-not-allowed' 
              : selectedGender.id === 'male'
                ? 'border-blue-600 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 hover:border-blue-400'
                : 'border-pink-600 text-pink-400 hover:bg-pink-900/30 hover:text-pink-300 hover:border-pink-400'
          }`}
        >
          {selectedGender ? `CONTINUE AS ${selectedGender.label.toUpperCase()}` : 'SELECT GENDER TO CONTINUE'}
        </button>
      </div>

      {/* Footer - same style as main app */}
      <footer className="h-12 bg-black py-3 text-center text-xs text-gray-300 border-t border-gray-800">
        &copy; 2025 GL!TCH W@R$. All rights reserved.
      </footer>
    </div>
  );
}