// src/components/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import { AppFooter } from './Footer';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-black font-pixel text-green-500">
      {/* 🔲 Scanline Overlay */}
      <div className="fixed inset-0 bg-[url('/scanline.png')] opacity-10 pointer-events-none" />

      {/* 🔮 Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <AppFooter />
    </div>
  );
}
