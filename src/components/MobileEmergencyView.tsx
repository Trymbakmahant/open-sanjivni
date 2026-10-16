'use client';

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Clock,
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  Check,
  Droplet,
  Hospital,
  Copy,
} from 'lucide-react';
import { MedicalBeacon } from '@/types/beacon';
import { AVAILABLE_ITEM_CODES, calculatePincodeDistance } from '@/data/seedData';
import { playRadarPingSound, playEmergencyChimeSound } from '@/lib/audioAlert';

interface MobileEmergencyViewProps {
  beacons: MedicalBeacon[];
  soundEnabled: boolean;
  onInspectProof: (beacon: MedicalBeacon) => void;
  onNavigateToHospitalPortal: () => void;
}

export function MobileEmergencyView({
  beacons,
  soundEnabled,
  onInspectProof,
  onNavigateToHospitalPortal,
}: MobileEmergencyViewProps) {
  // Mobile Quick State
  const [selectedLetter, setSelectedLetter] = useState<'O' | 'A' | 'B' | 'AB'>('O');
  const [selectedSign, setSelectedSign] = useState<'-' | '+'>('-');
  const [selectedSpecialty, setSelectedSpecialty] = useState<'BLOOD' | 'ANTI_VENOM' | 'RABIES' | 'JAN_AUSHADHI'>('BLOOD');
  const [mobilePincode, setMobilePincode] = useState<string>('492099');
  const [isEditingLocation, setIsEditingLocation] = useState<boolean>(false);
  const [callingBeacon, setCallingBeacon] = useState<MedicalBeacon | null>(null);
  const [copiedDesk, setCopiedDesk] = useState<boolean>(false);

  // Derive target item code
  const currentItemCode = useMemo(() => {
    if (selectedSpecialty === 'ANTI_VENOM') return 'SNAKE_POLYVALENT';
    if (selectedSpecialty === 'RABIES') return 'RABIES_IMMUNOGLOBULIN';
    if (selectedSpecialty === 'JAN_AUSHADHI') return 'PARACETAMOL_650';

    if (selectedLetter === 'O' && selectedSign === '-') return 'O_NEGATIVE';
    if (selectedLetter === 'O' && selectedSign === '+') return 'O_POSITIVE';
    if (selectedLetter === 'B' && selectedSign === '-') return 'B_NEGATIVE';
    if (selectedLetter === 'B' && selectedSign === '+') return 'B_POSITIVE';
    if (selectedLetter === 'A' && selectedSign === '-') return 'A_NEGATIVE';
    if (selectedLetter === 'A' && selectedSign === '+') return 'A_POSITIVE';
    if (selectedLetter === 'AB' && selectedSign === '-') return 'AB_NEGATIVE';
    return 'AB_POSITIVE';
  }, [selectedLetter, selectedSign, selectedSpecialty]);

  const now = Date.now();
  const parsedPin = parseInt(mobilePincode.trim(), 10) || 492099;

  // Filter nearest beacons
  const mobileResults = useMemo(() => {
    return beacons
      .filter((b) => {
        if (b.expiresAtTimestamp <= now) return false;
        if (b.attributes.unitsAvailable <= 0 || b.attributes.status !== 'ACTIVE') return false;

        if (selectedSpecialty === 'BLOOD') {
          if (b.attributes.category !== 'BLOOD') return false;
          if (b.attributes.itemCode !== currentItemCode) {
            // Also show other rare negatives if searching O-
            if (currentItemCode === 'O_NEGATIVE' && (b.attributes.itemCode === 'B_NEGATIVE' || b.attributes.itemCode === 'BOMBAY_PHENOTYPE')) {
              return true;
            }
            return false;
          }
        } else if (selectedSpecialty === 'ANTI_VENOM') {
          if (b.attributes.category !== 'ANTI_VENOM') return false;
        } else if (selectedSpecialty === 'RABIES') {
          if (b.attributes.category !== 'RABIES_VACCINE') return false;
        } else if (selectedSpecialty === 'JAN_AUSHADHI') {
          if (b.attributes.category !== 'JAN_AUSHADHI') return false;
        }

        return true;
      })
      .map((b) => {
        const dist = calculatePincodeDistance(parsedPin, b.attributes.pincode);
        const etaMins = Math.max(3, Math.round(dist * 2.2));
        const remainingSeconds = Math.max(0, Math.floor((b.expiresAtTimestamp - now) / 1000));
        return {
          beacon: b,
          distanceKm: dist,
          etaMins,
          remainingSeconds,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [beacons, now, selectedSpecialty, currentItemCode, parsedPin]);

  const formatCountdown = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedDesk(true);
    setTimeout(() => setCopiedDesk(false), 2000);
  };

  return (
    <div className="w-full flex justify-center py-2 sm:py-6 px-0 sm:px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col relative min-h-[750px]">
        {/* Curved Crimson Emergency Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 text-white p-5 sm:p-6 sm:rounded-t-3xl shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <Droplet size={20} className="fill-white text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg leading-tight tracking-tight">Sanjeevani Pulse</h3>
                <span className="text-xs text-rose-100 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                  ICU Emergency Ward Corridor Radar
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-black/20 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Arkiv Tiramisu</span>
            </div>
          </div>

          {/* Location Bar with 1-tap PIN switcher */}
          <div className="bg-white text-slate-800 rounded-2xl p-3 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setIsEditingLocation((prev) => !prev)}>
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <MapPin size={16} />
              </div>
              <div>
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Emergency Ward Location
                </span>
                <span className="block text-xs font-extrabold text-slate-900 truncate">
                  {mobilePincode === '492099' && 'AIIMS Raipur Corridor (492099)'}
                  {mobilePincode === '495001' && 'Bilaspur CIMS Hub (495001)'}
                  {mobilePincode === '492001' && 'Raipur Central / Katora (492001)'}
                  {mobilePincode === '400012' && 'KEM Mumbai Parel (400012)'}
                  {mobilePincode === '110029' && 'Safdarjung Delhi (110029)'}
                  {!['492099', '495001', '492001', '400012', '110029'].includes(mobilePincode) &&
                    `PIN Code: ${mobilePincode}`}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsEditingLocation((prev) => !prev)}
              className="bg-slate-100 hover:bg-slate-200 text-rose-600 font-extrabold text-xs px-3 py-1.5 rounded-lg shrink-0"
            >
              {isEditingLocation ? 'Done' : 'Change'}
            </button>
          </div>

          {/* Location Editor Drawer */}
          {isEditingLocation && (
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 space-y-2.5 animate-fadeIn">
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={mobilePincode}
                  onChange={(e) => setMobilePincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit PIN"
                  className="flex-1 bg-white text-slate-900 font-extrabold text-sm px-3 py-2 rounded-xl focus:outline-none"
                />
                <button
                  onClick={() => setIsEditingLocation(false)}
                  className="bg-slate-900 text-white font-extrabold text-xs px-4 rounded-xl"
                >
                  Locate
                </button>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { code: '492099', label: 'AIIMS Raipur' },
                  { code: '495001', label: 'CIMS Bilaspur' },
                  { code: '492001', label: 'Raipur Central' },
                  { code: '400012', label: 'KEM Mumbai' },
                  { code: '110029', label: 'Safdarjung Delhi' },
                ].map((h) => (
                  <button
                    key={h.code}
                    onClick={() => {
                      setMobilePincode(h.code);
                      setIsEditingLocation(false);
                      if (soundEnabled) playRadarPingSound();
                    }}
                    className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap text-[11px] ${
                      mobilePincode === h.code ? 'bg-white text-rose-600' : 'bg-white/20 text-white'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Emergency Category Tabs */}
        <div className="flex gap-1.5 px-4 pt-3 overflow-x-auto">
          <button
            onClick={() => {
              setSelectedSpecialty('BLOOD');
              if (soundEnabled) playRadarPingSound();
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedSpecialty === 'BLOOD' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
            }`}
          >
            🩸 Blood Group
          </button>
          <button
            onClick={() => {
              setSelectedSpecialty('ANTI_VENOM');
              if (soundEnabled) playRadarPingSound();
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedSpecialty === 'ANTI_VENOM' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
            }`}
          >
            🐍 Anti-Venom
          </button>
          <button
            onClick={() => {
              setSelectedSpecialty('RABIES');
              if (soundEnabled) playRadarPingSound();
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedSpecialty === 'RABIES' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
            }`}
          >
            💉 Rabies Vac
          </button>
          <button
            onClick={() => {
              setSelectedSpecialty('JAN_AUSHADHI');
              if (soundEnabled) playRadarPingSound();
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedSpecialty === 'JAN_AUSHADHI' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
            }`}
          >
            💊 Jan Aushadhi
          </button>
        </div>

        {/* 1-Tap Blood Type Selector (BloodConnect+ UX) */}
        {selectedSpecialty === 'BLOOD' && (
          <div className="mx-4 my-3 bg-slate-50 border border-slate-100 rounded-3xl p-4 flex flex-col items-center space-y-3 shadow-inner">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Select Needed Blood Type
            </span>

            {/* Visual Blood Bag Display */}
            <div className="flex flex-col items-center py-1">
              <div className="w-2 h-3 bg-slate-300 rounded-t" />
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-b from-rose-500 to-rose-600 shadow-xl shadow-rose-600/30 flex items-center justify-center p-2.5">
                <div className="bg-white rounded-xl w-full h-full flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-rose-600 leading-none">
                    {selectedLetter}
                    {selectedSign}
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase mt-0.5">
                    Arkiv Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Letter Toggles */}
            <div className="grid grid-cols-4 gap-2 w-full">
              {(['A', 'B', 'AB', 'O'] as const).map((letter) => (
                <button
                  key={letter}
                  onClick={() => {
                    setSelectedLetter(letter);
                    if (soundEnabled) playRadarPingSound();
                  }}
                  className={`py-2 rounded-xl font-black text-sm transition-all ${
                    selectedLetter === letter
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>

            {/* Rh Toggles */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                onClick={() => {
                  setSelectedSign('+');
                  if (soundEnabled) playRadarPingSound();
                }}
                className={`py-2 rounded-xl font-bold text-xs transition-all ${
                  selectedSign === '+'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                    : 'bg-white text-slate-700 border border-slate-200/80'
                }`}
              >
                + (Rh Positive)
              </button>
              <button
                onClick={() => {
                  setSelectedSign('-');
                  if (soundEnabled) playRadarPingSound();
                }}
                className={`py-2 rounded-xl font-bold text-xs transition-all ${
                  selectedSign === '-'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                    : 'bg-white text-slate-700 border border-slate-200/80'
                }`}
              >
                - (Rh Negative / Rare)
              </button>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="px-4 pt-2 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-sm text-slate-900">Verified Stock Near You</h4>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              {mobileResults.length} Available
            </span>
          </div>
          <span className="text-[10px] font-bold text-sky-600 flex items-center gap-1">
            <Clock size={10} /> Auto-purges in 4h
          </span>
        </div>

        {/* Results List */}
        <div className="px-4 pb-20 space-y-3 flex-1 overflow-y-auto">
          {mobileResults.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-6 text-center space-y-2 border border-slate-100 mt-2">
              <AlertTriangle size={32} className="text-amber-500 mx-auto" />
              <h5 className="font-bold text-sm text-slate-800">No Stock in Immediate Radius</h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Listings have <strong>auto-expired on Arkiv DB-Chain</strong> to protect families from
                misleading stock. Try another hospital corridor.
              </p>
              <button
                onClick={() => {
                  setSelectedSpecialty('BLOOD');
                  setSelectedLetter('O');
                  setSelectedSign('-');
                  setMobilePincode('492099');
                }}
                className="bg-slate-900 text-white font-extrabold text-xs px-4 py-2 rounded-lg mt-2"
              >
                Reset to AIIMS Raipur Hub
              </button>
            </div>
          ) : (
            mobileResults.map(({ beacon, distanceKm, etaMins, remainingSeconds }) => {
              const itemDef = AVAILABLE_ITEM_CODES.find((i) => i.code === beacon.attributes.itemCode);
              const isUrgent = beacon.attributes.unitsAvailable <= 3 || beacon.attributes.itemCode.includes('NEGATIVE');

              return (
                <div
                  key={beacon.key}
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  {/* Top Bar: Hospital & Distance */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Hospital size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="block font-bold text-xs text-slate-900 truncate">
                        {beacon.payload.facilityName}
                      </strong>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                        <span className="text-slate-600 font-bold">📍 {distanceKm} kms</span>
                        <span>•</span>
                        <span>⏱️ ~{etaMins}m drive</span>
                        {beacon.attributes.isEmergency24x7 === 'YES' && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 font-bold">24x7 ICU</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isUrgent && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-600 shrink-0">
                        Urgent
                      </span>
                    )}
                  </div>

                  {/* Stock Count and Supply */}
                  <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="block font-extrabold text-xs text-slate-800">
                        {itemDef ? itemDef.label : beacon.attributes.itemCode}
                      </span>
                      <span className="block text-[10px] text-slate-400 truncate max-w-[200px]">
                        {beacon.payload.address}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-xl font-black font-mono text-rose-600 leading-none">
                        {beacon.attributes.unitsAvailable}
                      </span>
                      <span className="block text-[10px] font-bold text-slate-400">
                        {itemDef?.unitName || 'Units'}
                      </span>
                    </div>
                  </div>

                  {/* TTL & Price Line */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-sky-600 font-bold flex items-center gap-1">
                      <Clock size={11} /> Purges in {formatCountdown(remainingSeconds)}
                    </span>
                    {beacon.attributes.priceInr === '0.00' ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        Govt Free Supply
                      </span>
                    ) : (
                      <span className="text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded">
                        Jan Aushadhi ₹{beacon.attributes.priceInr}
                      </span>
                    )}
                  </div>

                  {/* Big Call Button & Proof Icon */}
                  <div className="flex gap-2 pt-1">
                    <a
                      href={`tel:${beacon.payload.contactDesk}`}
                      onClick={() => {
                        setCallingBeacon(beacon);
                        if (soundEnabled) playEmergencyChimeSound();
                      }}
                      className="flex-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-rose-600/25 tracking-wide"
                    >
                      <PhoneCall size={15} />
                      <span>CALL 24x7 DESK NOW</span>
                    </a>

                    <button
                      onClick={() => onInspectProof(beacon)}
                      className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"
                      title="Inspect Arkiv Proof"
                    >
                      <ShieldCheck size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Hotline Drawer Modal */}
        {callingBeacon && (
          <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end" onClick={() => setCallingBeacon(null)}>
            <div className="bg-white rounded-t-3xl w-full p-6 space-y-4 shadow-2xl animate-slideUp" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <div>
                <h4 className="font-black text-base text-slate-900">Hospital Casualty Desk</h4>
                <p className="text-xs text-slate-500 mt-0.5">{callingBeacon.payload.facilityName}</p>
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-rose-600 tracking-wider">
                  24x7 Direct Hotline
                </span>
                <a href={`tel:${callingBeacon.payload.contactDesk}`} className="block text-2xl font-black font-mono text-slate-900">
                  {callingBeacon.payload.contactDesk}
                </a>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => handleCopy(callingBeacon.payload.contactDesk)}
                  className="flex-1 bg-slate-100 font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center gap-1.5"
                >
                  {copiedDesk ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedDesk ? 'Copied' : 'Copy Number'}</span>
                </button>
                <a
                  href={`tel:${callingBeacon.payload.contactDesk}`}
                  onClick={() => setCallingBeacon(null)}
                  className="flex-1 bg-rose-600 text-white font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30"
                >
                  <PhoneCall size={14} />
                  <span>Call Hospital</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Bottom App Navigation Bar */}
        <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex py-2.5 px-4 shadow-lg z-20">
          <button className="flex-1 flex flex-col items-center gap-1 text-rose-600 text-[10px] font-extrabold">
            <Droplet size={18} className="fill-rose-600" />
            <span>Emergency</span>
          </button>
          <button onClick={onNavigateToHospitalPortal} className="flex-1 flex flex-col items-center gap-1 text-slate-400 hover:text-slate-800 text-[10px] font-bold">
            <Hospital size={18} />
            <span>Hospital</span>
          </button>
          <button
            onClick={() => {
              if (mobileResults.length > 0) onInspectProof(mobileResults[0].beacon);
            }}
            className="flex-1 flex flex-col items-center gap-1 text-slate-400 hover:text-slate-800 text-[10px] font-bold"
          >
            <ShieldCheck size={18} />
            <span>Proofs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
