import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Phaser from 'phaser';
import { BootScene } from '../game/scenes/BootScene';
import { MenuScene } from '../game/scenes/MenuScene';
import { PlayScene } from '../game/scenes/PlayScene';
import { OptionsScene } from '../game/scenes/OptionsScene';
import { CreditsScene } from '../game/scenes/CreditsScene';

export function Game() {
  const gameContainerRef = useRef(null);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const selectedHero = location.state?.hero;
  
  useEffect(() => {
    let game = null;
    
    if (gameContainerRef.current) {
      setIsLoading(true);
      
      // Enhanced responsive dimensions calculation
      const updateGameSize = () => {
        const containerWidth = gameContainerRef.current.clientWidth;
        const containerHeight = gameContainerRef.current.clientHeight;
        const aspectRatio = 16 / 9; // Maintain 16:9 aspect ratio
        
        let width, height;
        
        // Calculate dimensions while maintaining aspect ratio
        if (containerWidth / containerHeight > aspectRatio) {
          height = containerHeight;
          width = height * aspectRatio;
        } else {
          width = containerWidth;
          height = width / aspectRatio;
        }
        
        // Ensure minimum dimensions
        width = Math.max(width, 320);
        height = Math.max(height, 240);
        
        if (game) {
          game.scale.resize(width, height);
          // Trigger UI position update in the active scene
          const activeScene = game.scene.getScenes(true)[0];
          if (activeScene && activeScene.updateUIPositions) {
            activeScene.updateUIPositions();
          }
        }
        
        return { width, height };
      };
      
      const { width, height } = updateGameSize();
      
      const config = {
        type: Phaser.AUTO,
        width,
        height,
        parent: gameContainerRef.current,
        backgroundColor: '#000000',
        pixelArt: true,
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: width,
          height: height,
          min: {
            width: 320,
            height: 240
          },
          max: {
            width: 1920,
            height: 1080
          }
        },
        scene: [
          new BootScene({ width, height }),
          new MenuScene({ width, height }),
          new PlayScene({ width, height }),
          new OptionsScene({ width, height }),
          new CreditsScene({ width, height })
        ]
      };
      
      game = new Phaser.Game(config);
      
      game.events.once('ready', () => {
        setIsLoading(false);
        setGameLoaded(true);
        if (selectedHero) {
          game.scene.start('PlayScene', { hero: selectedHero });
        }
      });
      
      // Debounced resize handler
      let resizeTimeout;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          updateGameSize();
        }, 250);
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimeout);
        if (game) {
          game.destroy(true);
        }
      };
    }
  }, [selectedHero]);
  
  return (
    <div className="w-full h-[calc(100vh-3rem)] flex flex-col items-center justify-center">
      <div className="relative w-[95%] max-w-[1600px] h-[85%] border-4 border-pink-500 shadow-[0_0_15px_rgba(255,0,255,0.5)]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black bg-opacity-70">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-4 text-green-500 font-pixel text-sm sm:text-base">Loading Game...</span>
          </div>
        )}
        
        <div 
          ref={gameContainerRef} 
          className="w-full h-full bg-black"
        />
      </div>
      
      <div className="text-green-400 text-[10px] sm:text-xs md:text-sm mt-2 px-4 max-w-full text-center font-pixel">
        <p className="break-words">Use ARROW KEYS or WASD to move • Defeat enemies to earn points • Survive as long as possible</p>
      </div>
    </div>
  );
}