'use client';

import React, { useEffect, useState } from 'react';

interface NavbarProps {
  currentScreen: 'hero' | 'gallery' | 'stage';
  onNavigate: (screen: 'hero' | 'gallery' | 'stage') => void;
  onOpenInspector: () => void;
}

export function Navbar({ currentScreen, onNavigate, onOpenInspector }: NavbarProps) {
  const [health, setHealth] = useState<{
    connected: boolean;
    geminiConfigured: boolean;
    model: string;
    mode: string;
  }>({
    connected: false,
    geminiConfigured: false,
    model: 'gemini-2.5-flash',
    mode: 'connecting...',
  });

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setHealth({
            connected: true,
            geminiConfigured: data.gemini?.configured ?? false,
            model: data.gemini?.model ?? 'gemini-2.5-flash',
            mode: data.gemini?.mode ?? 'live',
          });
        }
      } catch (err) {
        setHealth({
          connected: false,
          geminiConfigured: false,
          model: 'gemini-2.5-flash',
          mode: 'offline',
        });
      }
    }
    checkHealth();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-black/40 border-b border-white/10 transition-all">
      <div 
        onClick={() => onNavigate('hero')}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center font-serif text-black font-bold text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
          A
        </div>
        <div>
          <span className="font-serif tracking-widest text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400">
            ARTSCAPE
          </span>
          <span className="hidden sm:inline-block ml-2 text-xs uppercase tracking-wider text-amber-300/60 font-sans border-l border-white/20 pl-2">
            The Motif Travels
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Backend Indicator Badge */}
        <div 
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-sans tracking-wide bg-white/5 border border-white/10 text-white/80"
          title={`Backend status: ${health.connected ? 'Online' : 'Offline'} (${health.mode})`}
        >
          <span className={`w-2 h-2 rounded-full ${health.connected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80' : 'bg-amber-400'}`} />
          <span className="hidden sm:inline">
            {health.connected 
              ? (health.geminiConfigured ? 'Gemini 2.5 Live' : 'Backend Connected') 
              : 'Local Corpus Ready'}
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => onNavigate('hero')}
            className={`px-3 py-1 text-xs rounded-md font-sans tracking-wide transition-colors ${
              currentScreen === 'hero' ? 'bg-amber-500 text-black font-semibold' : 'text-white/70 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('gallery')}
            className={`px-3 py-1 text-xs rounded-md font-sans tracking-wide transition-colors ${
              currentScreen === 'gallery' ? 'bg-amber-500 text-black font-semibold' : 'text-white/70 hover:text-white'
            }`}
          >
            Gallery
          </button>
        </div>

        {/* Gemini Inspector Button */}
        <button
          onClick={onOpenInspector}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-sans font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
        >
          <span>✨</span>
          <span>Inspect Gemini</span>
        </button>
      </div>
    </nav>
  );
}
