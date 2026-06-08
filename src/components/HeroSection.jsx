// src/components/HeroSection.jsx
import { useNavigate } from 'react-router-dom';
import { GlitchLabel } from './GlitchLabel';

export function HeroSection() {
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate('/select-gender');
  };

  return (
    <section className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-10 px-4 text-center">
      <h1 className="text-2xl sm:text-4xl tracking-wider animate-flicker">
        Welcome to Glitch Wars
      </h1>
      <button onClick={handleStartGame} className="ui-btn">
        <GlitchLabel text="Start Game" />
      </button>
    </section>
  );
}
