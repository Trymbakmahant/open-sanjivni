'use client';

import React from 'react';
import { ShieldCheck, Activity, FileText, Volume2, VolumeX, RotateCcw, Hospital, Droplet } from 'lucide-react';
import { beaconStore } from '@/lib/beaconStore';

export type ActiveTab = 'CITIZEN_RADAR' | 'HOSPITAL_PORTAL' | 'STATE_PROOFS' | 'ARCHITECTURE';

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
    <header className="clean-header-root">
      <div className="clean-header-container">
        {/* Brand with circular red/orange badge */}
        <div className="clean-header-brand" onClick={() => setActiveTab('CITIZEN_RADAR')} role="button" tabIndex={0}>
          <div className="clean-brand-circle">
            <Droplet className="clean-droplet-icon" size={20} />
          </div>
          <div className="clean-brand-text">
            <div className="clean-brand-title">
              SANJEEVANI <span className="clean-pulse-tag">PULSE</span>
            </div>
            <span className="clean-brand-sub">Arkiv DB-Chain Radar</span>
          </div>
        </div>

        {/* Navigation Tabs matching screenshot style */}
        <nav className="clean-nav-links">
          <button
            onClick={() => setActiveTab('CITIZEN_RADAR')}
            className={`clean-nav-link ${activeTab === 'CITIZEN_RADAR' ? 'active' : ''}`}
          >
            Home &amp; Radar
          </button>

          <button
            onClick={() => setActiveTab('HOSPITAL_PORTAL')}
            className={`clean-nav-link ${activeTab === 'HOSPITAL_PORTAL' ? 'active' : ''}`}
          >
            Hospital Portal
          </button>

          <button
            onClick={() => setActiveTab('STATE_PROOFS')}
            className={`clean-nav-link ${activeTab === 'STATE_PROOFS' ? 'active' : ''}`}
          >
            State Proofs
          </button>

          <button
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`clean-nav-link ${activeTab === 'ARCHITECTURE' ? 'active' : ''}`}
          >
            Arkiv Report
          </button>
        </nav>

        {/* Status and Action Buttons */}
        <div className="clean-header-actions">
          {/* Network Pill */}
          <div className="clean-network-badge" title="Arkiv DB-Chain Tiramisu Testnet">
            <span className={`clean-dot ${isOnline ? 'online' : 'offline'}`} />
            <span className="clean-net-label">Tiramisu</span>
            <span className="clean-net-block">#{networkBlock.toLocaleString()}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`clean-icon-btn ${soundEnabled ? 'active-audio' : ''}`}
            title={soundEnabled ? 'Mute radar audio ping' : 'Enable radar audio ping'}
            aria-label="Toggle radar sound"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Reset Demo */}
          <button
            onClick={handleReset}
            className="clean-icon-btn"
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
