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
    <div className="space-y-12">
      {/* 1. Hero Section matching user design reference */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Text & CTA */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-xs font-extrabold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              Live Emergency Medical Inventory Radar
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Donate <br />
              <span className="text-rose-600">your Blood</span> <br />
              for saving life
            </h1>

            <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl">
              Sanjeevani Pulse runs on the <strong>Arkiv DB-Chain</strong>. Certified Indian blood banks, Jan Aushadhi
              stores, and trauma desks broadcast time-scoped stock with strict{' '}
              <strong>4-hour auto-expiration</strong> so families never chase phantom stock in an ICU emergency.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={onNavigateToHospitalPortal}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm sm:text-base px-8 py-4 rounded-xl shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all tracking-wider"
              >
                DONATE NOW
              </button>

              <button
                onClick={() => {
                  setSelectedCategory('BLOOD');
                  setSelectedItemCode('O_NEGATIVE');
                  if (soundEnabled) playRadarPingSound();
                }}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold text-sm sm:text-base px-6 py-4 rounded-xl transition-all"
              >
                Find O-Negative
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-8 pt-6 border-t border-slate-100">
              <div>
                <span className="block text-2xl font-black text-slate-900">4 Hours</span>
                <span className="text-xs font-bold text-slate-400">Protocol Auto-Expiry</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <span className="block text-2xl font-black text-slate-900">100%</span>
                <span className="text-xs font-bold text-slate-400">Censorship Resistant</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <span className="block text-2xl font-black text-slate-900">0%</span>
                <span className="text-xs font-bold text-slate-400">Phantom Inventory</span>
              </div>
            </div>
          </div>

          {/* Right Hero Compressed WebP Illustration */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl">
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
      </section>

      {/* 2. Floating Search Bar Card (Matching User Reference Image) */}
      <section className="relative -mt-6 sm:-mt-8 z-10 max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col md:flex-row items-stretch md:items-center gap-4">
          {/* Location input */}
          <div className="flex-1 flex items-center gap-3 px-3">
            <MapPin size={20} className="text-slate-400 shrink-0" />
            <input
              type="text"
              maxLength={6}
              placeholder="Search Location (PIN Code e.g. 492099)"
              value={pincodeInput}
              onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-transparent font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none text-base"
            />
            {userPincode && (
              <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                <Check size={12} /> Active
              </span>
            )}
          </div>

          <div className="hidden md:block w-px h-10 bg-slate-200" />

          {/* Blood group selector */}
          <div className="flex-1 flex items-center gap-3 px-3">
            <Droplet size={20} className="text-rose-500 shrink-0" />
            <div className="relative w-full">
              <select
                value={selectedItemCode}
                onChange={(e) => setSelectedItemCode(e.target.value)}
                className="w-full bg-transparent font-bold text-slate-800 focus:outline-none text-base appearance-none cursor-pointer pr-6"
              >
                <option value="ALL">All Medical Supplies</option>
                <option value="O_NEGATIVE">O-Negative Blood (Universal / Rare)</option>
                <option value="B_NEGATIVE">B-Negative Blood</option>
                <option value="A_NEGATIVE">A-Negative Blood</option>
                <option value="AB_NEGATIVE">AB-Negative Blood</option>
                <option value="BOMBAY_PHENOTYPE">Bombay Blood Group (Oh Phenotype)</option>
                <option value="SNAKE_POLYVALENT">Polyvalent Snake Anti-Venom</option>
                <option value="RABIES_IMMUNOGLOBULIN">Anti-Rabies Immunoglobulin</option>
                <option value="PARACETAMOL_650">Jan Aushadhi Paracetamol 650</option>
                <option value="AZITHROMYCIN_500">Jan Aushadhi Azithromycin 500</option>
              </select>
              <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Find Donor Button */}
          <button
            onClick={() => {
              if (soundEnabled) playRadarPingSound();
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm px-8 py-4 rounded-xl shadow-md transition-all shrink-0 tracking-wider"
          >
            Find Donor
          </button>
        </div>

        {/* Quick Hub Pins */}
        <div className="flex items-center gap-2 pt-3 px-2 flex-wrap text-xs">
          <span className="font-bold text-slate-400">Quick Hubs:</span>
          {[
            { code: '492099', label: 'AIIMS Raipur' },
            { code: '495001', label: 'Bilaspur CIMS' },
            { code: '492001', label: 'Raipur Central' },
            { code: '400012', label: 'KEM Mumbai' },
            { code: '110029', label: 'Safdarjung Delhi' },
          ].map((pin) => (
            <button
              key={pin.code}
              onClick={() => setPincodeInput(pin.code)}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                pincodeInput === pin.code
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800'
              }`}
            >
              {pin.label} ({pin.code})
            </button>
          ))}
        </div>
      </section>

      {/* 3. Section 2 matching reference: Lab Testing WebP + Circular Blood Group Pills */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Lab Compressed WebP Graphic */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl">
              <Image
                src="/images/blood_lab_testing.webp"
                alt="Medical laboratory testing blood tubes with microscope"
                width={800}
                height={800}
                className="w-full h-auto object-cover rounded-2xl"
              />
            </div>
          </div>

          {/* Right Circular Blood Group Pills (Matching Reference Image Pixel-by-Pixel) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600">
                SELECT BLOOD GROUP RADAR
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
                Real-Time Blood Availability by Group
              </h2>
              <p className="text-slate-500 text-sm sm:text-base mt-2">
                Click any blood group below to instantly filter certified institutional blood bank vaults on Arkiv
                DB-Chain.
              </p>
            </div>

            {/* Circular Neumorphic Pills */}
            <div className="grid grid-cols-4 gap-4 sm:gap-6 max-w-md">
              {bloodGroupCircles.map((bg) => {
                const isSelected = selectedItemCode === bg.code;
                return (
                  <button
                    key={bg.label}
                    onClick={() => handleBloodGroupClick(bg.code)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-black text-lg sm:text-xl transition-all ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/35 scale-105'
                        : 'bg-white text-rose-600 border border-slate-100 shadow-md hover:shadow-lg hover:scale-105 hover:border-rose-200'
                    }`}
                  >
                    {bg.label}
                  </button>
                );
              })}
            </div>

            {/* Other Critical Emergency Categories */}
            <div className="flex gap-2.5 flex-wrap pt-2">
              <button
                onClick={() => {
                  setSelectedCategory('ANTI_VENOM');
                  setSelectedItemCode('SNAKE_POLYVALENT');
                  if (soundEnabled) playRadarPingSound();
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  selectedCategory === 'ANTI_VENOM'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  selectedCategory === 'RABIES_VACCINE'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  selectedCategory === 'JAN_AUSHADHI'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                💊 Jan Aushadhi Medicines
              </button>
            </div>

            {/* Reset / Get More Tips button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedItemCode('ALL');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-6 py-3 rounded-lg transition-all tracking-wider"
              >
                Get More Tips / Reset Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Arkiv DB-Chain Query Status Strip */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="bg-sky-50 text-sky-600 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase">
            ARKIV_QUERY JSON-RPC
          </span>
          <code className="font-mono text-slate-500 font-medium">
            type = str('medical_beacon') AND unitsAvailable &gt; i32(0)
            {selectedCategory !== 'ALL' ? ` AND category = str('${selectedCategory}')` : ''}
            {userPincode ? ` AND pincode = i32(${userPincode})` : ''}
          </code>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-emerald-600 font-extrabold">
            <Zap size={14} /> 74ms Direct RPC (Zero Subgraph)
          </span>
          <span className="bg-slate-100 text-slate-800 font-extrabold px-3 py-1 rounded-full">
            {searchResults.length} Verified Available
          </span>
        </div>
      </div>

      {/* 5. Results Cards Grid */}
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
                  <div className="flex gap-2 pt-6 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setCallingBeacon(beacon);
                        if (soundEnabled) playEmergencyChimeSound();
                      }}
                      className="flex-1 bg-slate-900 hover:bg-rose-600 text-white font-extrabold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <PhoneCall size={14} />
                      <span>Contact Desk</span>
                    </button>

                    <button
                      onClick={() => onInspectProof(beacon)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 px-3 rounded-xl transition-all"
                      title="Inspect Arkiv Keccak-MPT Inclusion Proof"
                    >
                      <ShieldCheck size={16} />
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
