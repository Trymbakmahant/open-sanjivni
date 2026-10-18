'use client';

import React from 'react';
import { Droplet, Volume2, VolumeX, RotateCcw, Hospital, ShieldCheck } from 'lucide-react';
import { beaconStore } from '@/lib/beaconStore';
import { AnonAadhaarBadge } from '@/components/AnonAadhaarBadge';

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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand with circular coral logo */}
        <div
          onClick={() => setActiveTab('CITIZEN_RADAR')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          role="button"
          tabIndex={0}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 via-rose-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-rose-500/25 group-hover:scale-105 transition-transform shrink-0">
            <Droplet className="fill-white" size={17} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                OPEN
              </span>
              <span className="bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                SANJIVNI
              </span>
            </div>
            <p className="hidden lg:block text-[11px] font-medium text-slate-400">
              Emergency Stock Radar • <span className="text-sky-600 font-bold">Arkiv DB-Chain</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs for Tablet & Desktop */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1 rounded-full border border-slate-200/60">
          <button
            onClick={() => setActiveTab('CITIZEN_RADAR')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'CITIZEN_RADAR'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Home &amp; Radar
          </button>

          <button
            onClick={() => setActiveTab('HOSPITAL_PORTAL')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'HOSPITAL_PORTAL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Hospital Portal
          </button>

          <button
            onClick={() => setActiveTab('STATE_PROOFS')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'STATE_PROOFS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            State Proofs
          </button>
        </nav>

        {/* Right Actions: Compact Identity, Network & Utility Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Anon Aadhaar Identity Compact Pill */}
          <AnonAadhaarBadge />

          {/* Tiramisu Network Live Pill */}
          <div
            className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-full text-xs font-semibold text-slate-700"
            title={`Arkiv DB-Chain Tiramisu Testnet (Chain ID: 7738577, Block #${networkBlock.toLocaleString()})`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-bold text-slate-800">Tiramisu</span>
            <span className="hidden xl:inline font-mono text-[10px] text-slate-400">
              #{networkBlock.toLocaleString()}
            </span>
          </div>

          {/* Grouped Utility Actions (Sound + Reset) */}
          <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-full p-0.5">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                soundEnabled
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title={soundEnabled ? 'Mute radar audio' : 'Enable radar audio'}
              aria-label="Toggle radar audio"
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>

            <button
              onClick={handleReset}
              className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white flex items-center justify-center transition-all"
              title="Reset testnet demo data"
              aria-label="Reset demo data"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation Sub-bar */}
      <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md px-3 py-1.5 flex items-center justify-around gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('CITIZEN_RADAR')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all ${
            activeTab === 'CITIZEN_RADAR'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Droplet size={14} className={activeTab === 'CITIZEN_RADAR' ? 'fill-white' : ''} />
          <span>Radar</span>
        </button>

        <button
          onClick={() => setActiveTab('HOSPITAL_PORTAL')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all ${
            activeTab === 'HOSPITAL_PORTAL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Hospital size={14} />
          <span>Hospital Desk</span>
        </button>

        <button
          onClick={() => setActiveTab('STATE_PROOFS')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all ${
            activeTab === 'STATE_PROOFS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Proofs</span>
        </button>
      </div>
    </header>
  );
}
