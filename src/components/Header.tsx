'use client';

import React from 'react';
import { Radio, ShieldCheck, Activity, FileText, Volume2, VolumeX, RotateCcw, Hospital } from 'lucide-react';
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
    <header className="header-root">
      <div className="header-container">
        {/* Brand */}
        <div className="header-brand" onClick={() => setActiveTab('CITIZEN_RADAR')} role="button" tabIndex={0}>
          <div className="brand-pulse-badge">
            <Radio className="pulse-icon" size={20} />
            <span className="pulse-ring" />
          </div>
          <div>
            <div className="brand-title-wrap">
              <span className="brand-title">SANJEEVANI</span>
              <span className="brand-badge-pulse">PULSE</span>
            </div>
            <p className="brand-tagline">
              Emergency Stock Radar on <span className="arkiv-highlight">Arkiv DB-Chain</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="header-nav">
          <button
            onClick={() => setActiveTab('CITIZEN_RADAR')}
            className={`nav-tab-btn ${activeTab === 'CITIZEN_RADAR' ? 'active' : ''}`}
          >
            <Activity size={16} />
            <span>Citizen Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('HOSPITAL_PORTAL')}
            className={`nav-tab-btn ${activeTab === 'HOSPITAL_PORTAL' ? 'active' : ''}`}
          >
            <Hospital size={16} />
            <span>Hospital Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('STATE_PROOFS')}
            className={`nav-tab-btn ${activeTab === 'STATE_PROOFS' ? 'active' : ''}`}
          >
            <ShieldCheck size={16} />
            <span>State Proofs</span>
          </button>

          <button
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`nav-tab-btn ${activeTab === 'ARCHITECTURE' ? 'active' : ''}`}
          >
            <FileText size={16} />
            <span>Arkiv Friction Report</span>
          </button>
        </nav>

        {/* Status and Controls */}
        <div className="header-actions">
          {/* Network Pill */}
          <div className="network-pill" title="Arkiv DB-Chain Tiramisu Testnet">
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
            <span className="network-name">Tiramisu</span>
            <span className="network-block">#{networkBlock.toLocaleString()}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`icon-action-btn ${soundEnabled ? 'active-audio' : ''}`}
            title={soundEnabled ? 'Mute radar audio ping' : 'Enable radar audio ping'}
            aria-label="Toggle radar sound"
          >
            {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>

          {/* Reset Demo */}
          <button
            onClick={handleReset}
            className="icon-action-btn"
            title="Reset testnet demo data"
            aria-label="Reset demo data"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
