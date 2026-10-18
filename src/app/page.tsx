'use client';

import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from '@/components/Header';
import { CitizenRadar } from '@/components/CitizenRadar';
import { HospitalPortal } from '@/components/HospitalPortal';
import { StateProofsModal } from '@/components/StateProofsModal';
import { MedicalBeacon } from '@/types/beacon';
import { INITIAL_BEACONS } from '@/data/seedData';
import { beaconStore } from '@/lib/beaconStore';
import { getNetworkStatus, ARKIV_CONFIG } from '@/lib/arkiv';
import { Shield, Globe, Zap } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('CITIZEN_RADAR');
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
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
          <div className="space-y-6 sm:space-y-8">
            {/* Hero Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Shield size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      Cryptographic Anti-Hoarding Proof Explorer
                    </h2>
                    <span className="text-[10px] font-extrabold uppercase bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full hidden sm:inline">
                      100% Public Primitive
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Public cryptographic verifiability for citizens, health-rights NGOs, and journalists. Every inventory beacon is hashed into the Keccak-MPT state trie on{' '}
                    <strong className="text-slate-800">{ARKIV_CONFIG.chainName}</strong> and anchored onto Ethereum L1 consensus roots.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 shrink-0 text-right space-y-0.5 w-full md:w-auto">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                  Consensus Root Anchor
                </span>
                <span className="text-xs font-mono font-bold text-sky-600 block">
                  Block #{networkBlock.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Anti-Hoarding Notice Banner */}
            <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-5 sm:p-6 text-xs text-sky-950 space-y-2">
              <div className="flex items-center gap-2 text-sky-900 font-extrabold text-sm">
                <Shield size={18} className="text-sky-600 shrink-0" />
                <span>Why State Proofs Remain 100% Public (CROPS Mandate)</span>
              </div>
              <p className="text-sky-800 leading-relaxed">
                Under the Ethereum Foundation&apos;s <strong>CROPS (Censorship Resistant, Open source, Private, Secure)</strong> framework, cryptographic proofs must never be locked behind private logins. Open Sanjivni empowers ordinary families and independent NGOs to verify hospital stock directly on the Arkiv DB-Chain without middlemen. If an emergency facility claims zero units of O-Negative blood or Anti-Venom while an active beacon exists on-chain, citizens have mathematical proof of illicit black-market hoarding.
              </p>
            </div>

            {/* Grid of Dynamic Active Beacons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(beacons.length > 0 ? beacons : INITIAL_BEACONS).map((beacon) => (
                <div
                  key={beacon.key}
                  className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[10px] uppercase bg-sky-50 text-sky-600 px-2 py-0.5 rounded">
                        {beacon.attributes.category}
                      </span>
                      <span className="font-mono text-slate-400 font-bold">Block #{beacon.blockNumber}</span>
                    </div>

                    <h4 className="font-extrabold text-base text-slate-900">{beacon.payload.facilityName}</h4>

                    <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Available Stock:</span>
                        <span className="font-black text-rose-600 font-mono">
                          {beacon.attributes.unitsAvailable} Units
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Supply Code:</span>
                        <span className="font-bold text-slate-700 font-mono">
                          {beacon.attributes.itemCode}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">TTL Lease:</span>
                        <span className="font-bold text-sky-700 font-mono text-[11px]">
                          Expires #{beacon.expiresAtBlock}
                        </span>
                      </div>
                    </div>

                    <code className="block font-mono text-[10px] text-slate-400 truncate bg-slate-50 p-2 rounded-lg border border-slate-100">
                      Key: {beacon.key}
                    </code>
                  </div>

                  <button
                    onClick={() => setInspectingBeacon(beacon)}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 active:scale-[0.99]"
                  >
                    <Shield size={14} />
                    <span>Verify Anti-Hoarding Proof</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
              <strong className="font-black text-slate-900 text-base">Open Sanjivni</strong>
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
