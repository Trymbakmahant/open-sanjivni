'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  MapPin,
  Clock,
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  Check,
  Flame,
  Zap,
  Droplet,
  Copy,
  ChevronDown,
} from 'lucide-react';
import { BeaconCategory, MedicalBeacon } from '@/types/beacon';
import { AVAILABLE_ITEM_CODES, calculatePincodeDistance } from '@/data/seedData';
import { beaconStore } from '@/lib/beaconStore';
import { playRadarPingSound, playEmergencyChimeSound } from '@/lib/audioAlert';

interface CitizenRadarProps {
  soundEnabled: boolean;
  onInspectProof: (beacon: MedicalBeacon) => void;
  onNavigateToHospitalPortal: () => void;
}

export function CitizenRadar({
  soundEnabled,
  onInspectProof,
  onNavigateToHospitalPortal,
}: CitizenRadarProps) {
  const [beacons, setBeacons] = useState<MedicalBeacon[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BeaconCategory | 'ALL'>('ALL');
  const [selectedItemCode, setSelectedItemCode] = useState<string>('ALL');
  const [pincodeInput, setPincodeInput] = useState<string>('492099');
  const [emergencyOnly, setEmergencyOnly] = useState<boolean>(false);
  const [maxDistance, setMaxDistance] = useState<number>(100);
  const [now, setNow] = useState<number>(Date.now());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [callingBeacon, setCallingBeacon] = useState<MedicalBeacon | null>(null);

  // Sync beacons
  useEffect(() => {
    setBeacons(beaconStore.getBeacons());
    const unsubscribe = beaconStore.subscribe(() => {
      setBeacons(beaconStore.getBeacons());
    });
    return unsubscribe;
  }, []);

  // Timer loop for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const userPincode = useMemo(() => {
    const parsed = parseInt(pincodeInput.trim(), 10);
    return isNaN(parsed) || pincodeInput.trim().length !== 6 ? null : parsed;
  }, [pincodeInput]);

  // Filter search results
  const searchResults = useMemo(() => {
    return beacons
      .filter((b) => {
        if (b.expiresAtTimestamp <= now) return false;
        if (b.attributes.unitsAvailable <= 0 || b.attributes.status !== 'ACTIVE') return false;
        if (selectedCategory !== 'ALL' && b.attributes.category !== selectedCategory) return false;
        if (selectedItemCode !== 'ALL' && b.attributes.itemCode !== selectedItemCode) return false;
        if (emergencyOnly && b.attributes.isEmergency24x7 !== 'YES') return false;

        if (userPincode) {
          const dist = calculatePincodeDistance(userPincode, b.attributes.pincode);
          if (dist > maxDistance) return false;
        }

        return true;
      })
      .map((b) => {
        const dist = userPincode
          ? calculatePincodeDistance(userPincode, b.attributes.pincode)
          : undefined;
        const remainingSeconds = Math.max(0, Math.floor((b.expiresAtTimestamp - now) / 1000));
        return {
          beacon: b,
          distanceKm: dist,
          remainingSeconds,
        };
      })
      .sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
        }
        return a.remainingSeconds - b.remainingSeconds;
      });
  }, [beacons, now, selectedCategory, selectedItemCode, emergencyOnly, userPincode, maxDistance]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleBloodGroupClick = (code: string, category: BeaconCategory = 'BLOOD') => {
    setSelectedCategory(category);
    setSelectedItemCode(code);
    if (soundEnabled) playRadarPingSound();
  };

  const formatCountdown = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}h ${minutes
      .toString()
      .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const bloodGroupCircles = [
    { label: 'A+', code: 'A_POSITIVE' },
    { label: 'AB+', code: 'AB_POSITIVE' },
    { label: 'O-', code: 'O_NEGATIVE' },
    { label: 'B+', code: 'B_POSITIVE' },
    { label: 'O+', code: 'O_POSITIVE' },
    { label: 'AB-', code: 'AB_NEGATIVE' },
    { label: 'B-', code: 'B_NEGATIVE' },
    { label: 'Oh', code: 'BOMBAY_PHENOTYPE' },
  ];

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* 1. Unified Hero & Emergency Search Section */}
      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-12 border border-slate-100 shadow-sm">
        {/* Mobile Header: Compact, Life-Saving, Zero-Scroll */}
        <div className="lg:hidden space-y-3 pb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[11px] font-extrabold uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>ICU Emergency Stock Radar • Arkiv DB</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Emergency <span className="text-rose-600">Medical Supplies</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Verified inventory with strict <strong>4-hour auto-expiration</strong> on Arkiv DB-Chain to protect families from phantom stock.
            </p>
          </div>
        </div>

        {/* Desktop Hero: BloodConnect Layout with Compressed WebP Illustration */}
        <div className="hidden lg:grid grid-cols-12 gap-10 items-center pb-8 border-b border-slate-100">
          <div className="col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-xs font-extrabold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              Live Emergency Medical Inventory Radar
            </div>

            <h1 className="text-4xl xl:text-5xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Donate <br />
              <span className="text-rose-600">your Blood</span> <br />
              for saving life
            </h1>

            <p className="text-sm xl:text-base text-slate-500 leading-relaxed max-w-lg">
              Open Sanjivni runs on the <strong>Arkiv DB-Chain</strong>. Certified Indian blood banks, Jan Aushadhi
              stores, and trauma desks broadcast time-scoped stock with strict{' '}
              <strong>4-hour auto-expiration</strong> so families never chase phantom stock in an ICU emergency.
            </p>

            <div className="flex items-center gap-4 pt-1">
              <button
                onClick={onNavigateToHospitalPortal}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all tracking-wider"
              >
                DONATE NOW
              </button>

              <button
                onClick={() => {
                  setSelectedCategory('BLOOD');
                  setSelectedItemCode('O_NEGATIVE');
                  if (soundEnabled) playRadarPingSound();
                }}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold text-xs px-5 py-3.5 rounded-xl transition-all"
              >
                Find O-Negative
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
              <div>
                <span className="block text-xl font-black text-slate-900">4 Hours</span>
                <span className="text-[11px] font-bold text-slate-400">Protocol Auto-Expiry</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="block text-xl font-black text-slate-900">100%</span>
                <span className="text-[11px] font-bold text-slate-400">Censorship Resistant</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="block text-xl font-black text-slate-900">0%</span>
                <span className="text-[11px] font-bold text-slate-400">Phantom Inventory</span>
              </div>
            </div>
          </div>

          <div className="col-span-6 flex justify-center">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl">
              <Image
                src="/images/blood_donation_hero.webp"
                alt="Emergency blood donation and clinic care illustration"
                width={800}
                height={600}
                priority
                className="w-full h-auto object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>

        {/* 2. Responsive Search & Filter Controls */}
        <div className="space-y-4 pt-3 sm:pt-6">
          {/* Location PIN Input & Quick Hub Chips */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 px-1 flex-1">
              <MapPin size={20} className="text-rose-500 shrink-0" />
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-Digit PIN (e.g. 492099 for AIIMS Raipur)"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-transparent font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm sm:text-base"
              />
              {userPincode && (
                <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                  <Check size={12} /> Active
                </span>
              )}
            </div>

            {/* Quick Hub Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs shrink-0 flex-nowrap">
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
                    setPincodeInput(h.code);
                    if (soundEnabled) playRadarPingSound();
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap text-[11px] transition-all ${
                    pincodeInput === h.code
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Specialty Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 flex-nowrap text-xs">
            <button
              onClick={() => {
                setSelectedCategory('BLOOD');
                if (soundEnabled) playRadarPingSound();
              }}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'BLOOD' || selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              🩸 Blood Group
            </button>
            <button
              onClick={() => {
                setSelectedCategory('ANTI_VENOM');
                setSelectedItemCode('SNAKE_POLYVALENT');
                if (soundEnabled) playRadarPingSound();
              }}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'ANTI_VENOM'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              🐍 Snake Anti-Venom
            </button>
            <button
              onClick={() => {
                setSelectedCategory('RABIES_VACCINE');
                setSelectedItemCode('RABIES_IMMUNOGLOBULIN');
                if (soundEnabled) playRadarPingSound();
              }}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'RABIES_VACCINE'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              💉 Rabies Vaccine
            </button>
            <button
              onClick={() => {
                setSelectedCategory('JAN_AUSHADHI');
                setSelectedItemCode('ALL');
                if (soundEnabled) playRadarPingSound();
              }}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'JAN_AUSHADHI'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              💊 Jan Aushadhi
            </button>
          </div>

          {/* Blood Group Selector (Circular Pills) - Prominently Displayed on Both Mobile and Desktop */}
          {(selectedCategory === 'BLOOD' || selectedCategory === 'ALL') && (
            <div className="pt-2">
              <div className="flex items-center justify-between pb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Select Blood Group ({selectedItemCode === 'ALL' ? 'Showing All' : selectedItemCode.replace('_', ' ')})
                </span>
                {selectedItemCode !== 'ALL' && (
                  <button
                    onClick={() => setSelectedItemCode('ALL')}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* 8 Clean Circular Pills in Responsive Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
                {bloodGroupCircles.map((bg) => {
                  const isSelected = selectedItemCode === bg.code;
                  const isRare = bg.code.includes('NEGATIVE') || bg.code.includes('BOMBAY');
                  return (
                    <button
                      key={bg.label}
                      onClick={() => handleBloodGroupClick(bg.code)}
                      className={`h-14 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-black transition-all ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-102 ring-2 ring-rose-600 ring-offset-2'
                          : 'bg-white text-slate-800 border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'
                      }`}
                    >
                      <span className="text-base sm:text-lg leading-tight">{bg.label}</span>
                      {isRare && (
                        <span className={`text-[8px] sm:text-[9px] font-extrabold uppercase mt-0.5 ${
                          isSelected ? 'text-rose-100' : 'text-rose-600'
                        }`}>
                          Rare
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Live Arkiv DB-Chain Query Status Strip */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
          <span className="bg-sky-50 text-sky-600 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase shrink-0">
            ARKIV_QUERY RPC
          </span>
          <code className="font-mono text-slate-500 font-medium text-[11px] truncate">
            type = str('medical_beacon') AND unitsAvailable &gt; i32(0)
            {selectedCategory !== 'ALL' ? ` AND category = str('${selectedCategory}')` : ''}
            {userPincode ? ` AND pincode = i32(${userPincode})` : ''}
          </code>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          <span className="flex items-center gap-1 text-emerald-600 font-extrabold text-[11px]">
            <Zap size={13} /> 74ms Direct RPC
          </span>
          <span className="bg-rose-50 text-rose-600 font-extrabold px-2.5 py-0.5 rounded-full text-xs">
            {searchResults.length} Verified Available
          </span>
        </div>
      </div>

      {/* 4. Results Cards Grid */}
      <section>
        {searchResults.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-lg mx-auto space-y-4">
            <AlertTriangle size={42} className="text-amber-500 mx-auto" />
            <h3 className="text-xl font-bold text-slate-900">No Live Stock Matches Active Filters</h3>
            <p className="text-sm text-slate-500">
              Listings have <strong>auto-expired at protocol level</strong> to protect families from phantom
              inventory. Expand your radius or try another district hub.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedItemCode('ALL');
                setMaxDistance(1500);
              }}
              className="bg-slate-900 text-white font-extrabold text-xs px-6 py-3 rounded-lg"
            >
              Clear Filters &amp; Expand Radius
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map(({ beacon, distanceKm, remainingSeconds }) => {
              const itemDef = AVAILABLE_ITEM_CODES.find((i) => i.code === beacon.attributes.itemCode);
              const isRare =
                beacon.attributes.itemCode.includes('NEGATIVE') ||
                beacon.attributes.itemCode.includes('BOMBAY');
              const ttlPercent = Math.min(100, Math.max(0, (remainingSeconds / 14400) * 100));

              return (
                <article
                  key={beacon.key}
                  className={`bg-white rounded-2xl border ${
                    isRare ? 'border-rose-200 shadow-md' : 'border-slate-100 shadow-sm'
                  } p-6 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                        {beacon.attributes.category.replace('_', ' ')}
                      </span>

                      <span
                        className={`text-[11px] font-bold font-mono px-2.5 py-1 rounded-full flex items-center gap-1 ${
                          remainingSeconds < 3600 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        <Clock size={12} />
                        Purges in {formatCountdown(remainingSeconds)}
                      </span>
                    </div>

                    {/* Supply Name */}
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900 leading-snug">
                        {itemDef ? itemDef.label : beacon.attributes.itemCode}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        {beacon.attributes.priceInr === '0.00' ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            Govt Free Supply
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                            Jan Aushadhi MRP: ₹{beacon.attributes.priceInr}
                          </span>
                        )}
                        {distanceKm !== undefined && (
                          <span className="text-xs font-bold text-amber-600">
                            📍 {distanceKm} km away
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Count Box */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-black font-mono text-slate-900">
                          {beacon.attributes.unitsAvailable}
                        </span>
                        <span className="text-xs font-bold text-slate-500 ml-1.5">
                          {itemDef?.unitName || 'Units'} Available
                        </span>
                      </div>

                      {isRare ? (
                        <span className="text-[11px] font-extrabold text-rose-600 bg-rose-100/60 px-2.5 py-1 rounded flex items-center gap-1">
                          <Flame size={12} /> CRITICAL RARE
                        </span>
                      ) : (
                        <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-100/60 px-2.5 py-1 rounded flex items-center gap-1">
                          <Check size={12} /> IN STOCK
                        </span>
                      )}
                    </div>

                    {/* Facility Address */}
                    <div className="text-xs space-y-1">
                      <strong className="block text-slate-800 font-bold">{beacon.payload.facilityName}</strong>
                      <p className="text-slate-500 text-[11px] leading-relaxed">{beacon.payload.address}</p>
                      <div className="flex gap-1.5 pt-1 text-[10px] text-slate-400 font-semibold">
                        <span>PIN: {beacon.attributes.pincode}</span>
                        <span>•</span>
                        <span>Hours: {beacon.payload.operatingHours || '24x7'}</span>
                      </div>
                    </div>

                    {/* Lease TTL Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>Arkiv Lease Validity</span>
                        <span>{Math.round(ttlPercent)}% remaining</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            ttlPercent < 25 ? 'bg-rose-500' : ttlPercent < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${ttlPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex gap-2 pt-4 mt-3 border-t border-slate-100">
                    <a
                      href={`tel:${beacon.payload.contactDesk}`}
                      onClick={() => {
                        setCallingBeacon(beacon);
                        if (soundEnabled) playEmergencyChimeSound();
                      }}
                      className="flex-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-black text-xs py-3.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-rose-600/25 transition-all tracking-wide"
                    >
                      <PhoneCall size={15} />
                      <span>CALL 24x7 DESK NOW</span>
                    </a>

                    <button
                      onClick={() => onInspectProof(beacon)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3.5 px-3.5 rounded-xl transition-all shrink-0"
                      title="Inspect Arkiv Keccak-MPT Inclusion Proof"
                    >
                      <ShieldCheck size={18} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Emergency Contact Modal */}
      {callingBeacon && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCallingBeacon(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <PhoneCall size={18} />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Direct Hospital Hotline</h3>
              </div>
              <button onClick={() => setCallingBeacon(null)} className="text-slate-400 hover:text-slate-700 text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <strong className="block text-slate-900 font-extrabold text-lg">{callingBeacon.payload.facilityName}</strong>
                <p className="text-xs text-slate-500 mt-0.5">{callingBeacon.payload.address}</p>
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center space-y-1">
                <span className="text-[11px] font-extrabold text-rose-600 uppercase tracking-wider">
                  24x7 Casualty &amp; Blood Bank Line
                </span>
                <a href={`tel:${callingBeacon.payload.contactDesk}`} className="block text-2xl font-black font-mono text-slate-900 hover:text-rose-600">
                  {callingBeacon.payload.contactDesk}
                </a>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 text-xs flex justify-between">
                <span className="text-slate-500 font-semibold">Immediate Dispatch Unit:</span>
                <strong className="text-slate-900">
                  {callingBeacon.attributes.unitsAvailable} Units of {callingBeacon.attributes.itemCode}
                </strong>
              </div>

              <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 flex gap-2">
                <AlertTriangle size={16} className="shrink-0 text-amber-500 mt-0.5" />
                <p>
                  Zero personal health information is stored. This phone connects to the hospital institutional desk.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleCopy(callingBeacon.payload.contactDesk, 'modal-desk')}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center gap-1.5"
              >
                {copiedKey === 'modal-desk' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedKey === 'modal-desk' ? 'Copied' : 'Copy Number'}</span>
              </button>

              <a
                href={`tel:${callingBeacon.payload.contactDesk}`}
                onClick={() => setCallingBeacon(null)}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25"
              >
                <PhoneCall size={14} />
                <span>Dial Now</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
