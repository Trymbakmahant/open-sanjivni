'use client';

import React from 'react';
import { Droplet, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { beaconStore } from '@/lib/beaconStore';

export type ActiveTab = 'CITIZEN_RADAR' | 'HOSPITAL_PORTAL' | 'STATE_PROOFS';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  networkBlock: number;
  isOnline: boolean;
}

export function Header({
  activeTab,
  setActiveTab,
  soundEnabled,
  setSoundEnabled,
  networkBlock,
  isOnline,
}: HeaderProps) {
  const handleReset = () => {
    if (confirm('Reset demo beacons and audit log back to initial testnet state?')) {
      beaconStore.resetToDefaults();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand with circular coral logo matching reference */}
        <div
          onClick={() => setActiveTab('CITIZEN_RADAR')}
          className="flex items-center gap-3.5 cursor-pointer group"
          role="button"
          tabIndex={0}
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 via-rose-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-rose-500/25 group-hover:scale-105 transition-transform">
            <Droplet className="fill-white" size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                SANJEEVANI
              </span>
              <span className="bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                PULSE
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              Emergency Stock Radar on <span className="text-sky-600 font-bold">Arkiv DB-Chain</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1.5 rounded-full border border-slate-200/80">
          <button
            onClick={() => setActiveTab('CITIZEN_RADAR')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === 'CITIZEN_RADAR'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Home &amp; Radar
          </button>

          <button
            onClick={() => setActiveTab('HOSPITAL_PORTAL')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === 'HOSPITAL_PORTAL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Hospital Portal
          </button>

          <button
            onClick={() => setActiveTab('STATE_PROOFS')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === 'STATE_PROOFS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            State Proofs
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Tiramisu Testnet Live Pill */}
          <div
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs"
            title="Arkiv DB-Chain Tiramisu Testnet (Chain ID: 7738577)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-bold text-slate-800">Tiramisu</span>
            <span className="font-mono text-sky-600 font-semibold">
              #{networkBlock.toLocaleString()}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
              soundEnabled
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
            }`}
            title={soundEnabled ? 'Mute radar ping' : 'Enable radar ping'}
            aria-label="Toggle radar audio"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={handleReset}
            className="w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center transition-all"
            title="Reset testnet demo data"
            aria-label="Reset demo data"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
