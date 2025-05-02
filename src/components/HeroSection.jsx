// src/components/HeroSection.jsx
import { useNavigate } from 'react-router-dom';

export function HeroSection() {
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate('/select-gender');
  };

  return (
    <section className="text-center py-20">
      <h1 className="text-4xl mb-4">Welcome to Glitch Wars</h1>
      <button
        onClick={handleStartGame}
        className="px-6 py-3 font-pixel bg-pink-600 text-white rounded-md transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-[0_0_15px_rgba(255,105,180,0.8)] hover:animate-bounce"
      >
        START GAME
      </button>
    </section>
  );
}
