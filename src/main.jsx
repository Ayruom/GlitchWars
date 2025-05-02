// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import { MainLayout } from './components/MainLayout';
import { HeroSection } from './components/HeroSection';
import { GenderSelectionComponent } from './components/GenderSelectionComponent';
import { HeroSelectionComponent } from './components/HeroSelectionComponent';
import { GameFeaturesSection } from './components/GameFeaturesSection';
import { PixelLootSection } from './components/PixelLootSection';
import { Game } from './components/Game';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: (
          <>
            <HeroSection />
            <GameFeaturesSection />
            <PixelLootSection />
          </>
        ),
      },
      {
        path: 'select-gender',
        element: <GenderSelectionComponent />,
      },
      {
        path: 'select-hero',
        element: <HeroSelectionComponent />,
      },
      {
        path: 'game',
        element: <Game />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);