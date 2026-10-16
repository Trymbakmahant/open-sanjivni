'use client';

import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from '@/components/Header';
import { CitizenRadar } from '@/components/CitizenRadar';
import { HospitalPortal } from '@/components/HospitalPortal';
import { StateProofsModal } from '@/components/StateProofsModal';
import { ArchitectureView } from '@/components/ArchitectureView';
import { MedicalBeacon } from '@/types/beacon';
import { INITIAL_BEACONS } from '@/data/seedData';
import { getNetworkStatus, ARKIV_CONFIG } from '@/lib/arkiv';
import { Shield, Heart, Zap, Globe, Github } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('CITIZEN_RADAR');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [inspectingBeacon, setInspectingBeacon] = useState<MedicalBeacon | null>(null);
  const [networkBlock, setNetworkBlock] = useState<number>(700680);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Poll live block number from Arkiv Tiramisu RPC
  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      const status = await getNetworkStatus();
      if (isMounted) {
        setIsOnline(status.online);
        setNetworkBlock(status.blockNumber);
      }
    }
    checkStatus();
    const interval = setInterval(checkStatus, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="app-shell">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        networkBlock={networkBlock}
        isOnline={isOnline}
      />

      {/* Main Container */}
      <main className="main-content-wrap">
        {activeTab === 'CITIZEN_RADAR' && (
          <CitizenRadar
            soundEnabled={soundEnabled}
            onInspectProof={(beacon) => setInspectingBeacon(beacon)}
            onNavigateToHospitalPortal={() => setActiveTab('HOSPITAL_PORTAL')}
          />
        )}

        {activeTab === 'HOSPITAL_PORTAL' && (
          <HospitalPortal
            soundEnabled={soundEnabled}
            onInspectProof={(beacon) => setInspectingBeacon(beacon)}
          />
        )}

        {activeTab === 'STATE_PROOFS' && (
          <div className="tab-standalone-proofs">
            <div className="proofs-intro-card">
              <Shield size={28} className="intro-icon" />
              <div>
                <h2>Cryptographic Proof Verification Explorer</h2>
                <p>
                  Explore how every medical beacon is hashed into the Keccak-MPT state trie on{' '}
                  <strong>{ARKIV_CONFIG.chainName} (Chain ID: {ARKIV_CONFIG.chainId})</strong> and
                  anchored onto Ethereum Layer 1 roots.
                </p>
              </div>
            </div>

            <div className="proofs-catalog-grid">
              {INITIAL_BEACONS.map((beacon) => (
                <div key={beacon.key} className="proof-catalog-card">
                  <div className="proof-card-top">
                    <span className="badge-cat">{beacon.attributes.category}</span>
                    <span className="badge-block">Block #{beacon.blockNumber}</span>
                  </div>
                  <h4>{beacon.payload.facilityName}</h4>
                  <p className="card-supply-tag">
                    Stocked: {beacon.attributes.unitsAvailable} Units of {beacon.attributes.itemCode}
                  </p>
                  <code className="card-key-snippet">
                    Key: {beacon.key.slice(0, 22)}...
                  </code>
                  <button
                    onClick={() => setInspectingBeacon(beacon)}
                    className="btn-inspect-proof"
                  >
                    Inspect Full State Root &amp; MPT Proof
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ARCHITECTURE' && <ArchitectureView />}
      </main>

      {/* Proof Modal */}
      <StateProofsModal
        beacon={inspectingBeacon}
        onClose={() => setInspectingBeacon(null)}
      />

      {/* Modern Footer */}
      <footer className="footer-root">
        <div className="footer-container">
          <div className="footer-left">
            <div className="footer-brand">
              <span className="brand-dot" />
              <strong>Sanjeevani Pulse</strong>
              <span className="footer-badge">Road to Devcon 8 Mumbai</span>
            </div>
            <p className="footer-desc">
              Decentralized Emergency Medical Inventory Radar on Arkiv DB-Chain. Built for Indian Public
              Goods & Censorship-Resistant Healthcare Access.
            </p>
          </div>

          <div className="footer-right">
            <div className="footer-links">
              <span className="footer-tag-item">
                <Globe size={14} /> Chain ID: {ARKIV_CONFIG.chainId}
              </span>
              <a
                href={ARKIV_CONFIG.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link-item"
              >
                <Zap size={14} /> Tiramisu Explorer
              </a>
              <button
                onClick={() => setActiveTab('ARCHITECTURE')}
                className="footer-link-btn"
              >
                Friction Report
              </button>
            </div>
            <p className="footer-privacy-tag">
              Strict DPDP Privacy Compliance • Zero Personal Health Information (PHI) Stored
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
