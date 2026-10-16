'use client';

import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from '@/components/Header';
import { CitizenRadar } from '@/components/CitizenRadar';
import { HospitalPortal } from '@/components/HospitalPortal';
import { StateProofsModal } from '@/components/StateProofsModal';
import { ArchitectureView } from '@/components/ArchitectureView';
import { MobileEmergencyView } from '@/components/MobileEmergencyView';
import { MedicalBeacon } from '@/types/beacon';
import { INITIAL_BEACONS } from '@/data/seedData';
import { beaconStore } from '@/lib/beaconStore';
import { getNetworkStatus, ARKIV_CONFIG } from '@/lib/arkiv';
import { Shield, Smartphone, LayoutDashboard, Globe, Zap } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('CITIZEN_RADAR');
  const [viewMode, setViewMode] = useState<'MOBILE_EMERGENCY' | 'RADAR_DASHBOARD'>('RADAR_DASHBOARD');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [inspectingBeacon, setInspectingBeacon] = useState<MedicalBeacon | null>(null);
  const [networkBlock, setNetworkBlock] = useState<number>(700680);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [beacons, setBeacons] = useState<MedicalBeacon[]>([]);

  // Sync beacons
  useEffect(() => {
    setBeacons(beaconStore.getBeacons());
    const unsubscribe = beaconStore.subscribe(() => {
      setBeacons(beaconStore.getBeacons());
    });
    return unsubscribe;
  }, []);

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
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-slate-900 selection:bg-rose-500 selection:text-white">
      {/* Top Clean Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        networkBlock={networkBlock}
        isOnline={isOnline}
      />

      {/* View Switcher: Desktop Radar vs Mobile ICU Ward Mode */}
      {activeTab === 'CITIZEN_RADAR' && (
        <div className="bg-white border-b border-slate-100 py-3 px-4 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span>
                <strong>Smart View Selector:</strong> Switch between full desktop medical search &amp; 1-tap mobile emergency ward layout
              </span>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-full gap-1">
              <button
                onClick={() => setViewMode('RADAR_DASHBOARD')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold transition-all ${
                  viewMode === 'RADAR_DASHBOARD'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard size={14} />
                <span>🖥️ Full Desktop Portal</span>
              </button>

              <button
                onClick={() => setViewMode('MOBILE_EMERGENCY')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold transition-all ${
                  viewMode === 'MOBILE_EMERGENCY'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone size={14} />
                <span>📱 1-Tap Mobile Ward Mode</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === 'CITIZEN_RADAR' && viewMode === 'MOBILE_EMERGENCY' && (
          <MobileEmergencyView
            beacons={beacons}
            soundEnabled={soundEnabled}
            onInspectProof={(beacon) => setInspectingBeacon(beacon)}
            onNavigateToHospitalPortal={() => setActiveTab('HOSPITAL_PORTAL')}
          />
        )}

        {activeTab === 'CITIZEN_RADAR' && viewMode === 'RADAR_DASHBOARD' && (
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
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Shield size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Cryptographic Proof Verification Explorer</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Explore how every medical beacon is hashed into the Keccak-MPT state trie on{' '}
                  <strong className="text-slate-800">{ARKIV_CONFIG.chainName} (Chain ID: {ARKIV_CONFIG.chainId})</strong> and
                  anchored onto Ethereum Layer 1 consensus roots.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {INITIAL_BEACONS.map((beacon) => (
                <div key={beacon.key} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-[10px] uppercase bg-sky-50 text-sky-600 px-2 py-0.5 rounded">
                      {beacon.attributes.category}
                    </span>
                    <span className="font-mono text-slate-400 font-bold">Block #{beacon.blockNumber}</span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900">{beacon.payload.facilityName}</h4>
                  <p className="text-xs font-bold text-emerald-600">
                    Stocked: {beacon.attributes.unitsAvailable} Units of {beacon.attributes.itemCode}
                  </p>
                  <code className="block font-mono text-[11px] text-slate-400 truncate bg-slate-50 p-2 rounded-lg">
                    Key: {beacon.key}
                  </code>
                  <button
                    onClick={() => setInspectingBeacon(beacon)}
                    className="w-full bg-slate-900 hover:bg-rose-600 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all"
                  >
                    Inspect Merkle Proof
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

      {/* Modern Clean Footer */}
      <footer className="bg-white border-t border-slate-100 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <strong className="font-black text-slate-900 text-base">Sanjeevani Pulse</strong>
              <span className="text-[10px] font-extrabold uppercase bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                Road to Devcon 8 Mumbai
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Decentralized Emergency Medical Inventory Radar on Arkiv DB-Chain. Built for Indian Public Goods &amp; Censorship-Resistant Healthcare Access.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 text-xs">
            <div className="flex items-center gap-4 text-slate-600 font-semibold">
              <span className="flex items-center gap-1">
                <Globe size={14} /> Chain ID: {ARKIV_CONFIG.chainId}
              </span>
              <a
                href={ARKIV_CONFIG.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <Zap size={14} /> Tiramisu Explorer
              </a>
              <button
                onClick={() => setActiveTab('ARCHITECTURE')}
                className="hover:text-rose-600 transition-colors"
              >
                Friction Report
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Strict DPDP Privacy Compliance • Zero Personal Health Information (PHI) Stored
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
