import { HeroSection } from './components/HeroSection';
import { HeroSelectionComponent } from './components/HeroSelectionComponent';
import { GameFeaturesSection } from './components/GameFeaturesSection';
import { PixelLootSection } from './components/PixelLootSection';
import { AppFooter } from './components/Footer';

export default function App() {
  return (
    <div className="relative min-h-screen bg-black font-pixel text-green-500 overflow-x-hidden">
      {/* 🔲 Scanline Overlay */}
      <div className="absolute inset-0 bg-[url('/scanline.png')] opacity-10 z-10 pointer-events-none" />

      {/* 🔮 Main Content */}
      <div className="relative z-20 space-y-20">
        <HeroSection />
        <HeroSelectionComponent />
        <GameFeaturesSection />
        <PixelLootSection />
        <AppFooter />
      </div>
    </div>
  );
}
