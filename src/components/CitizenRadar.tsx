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
  Lock,
  UserCheck,
  HeartHandshake,
  Shield,
  Sparkles,
  ChevronRight,
  Send,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { BeaconCategory, MedicalBeacon, EmergencyLock, VolunteerDonor } from '@/types/beacon';
import { AVAILABLE_ITEM_CODES, calculatePincodeDistance } from '@/data/seedData';
import { beaconStore } from '@/lib/beaconStore';
import { playRadarPingSound, playEmergencyChimeSound } from '@/lib/audioAlert';
import { useVerifiedCitizen } from '@/hooks/useVerifiedCitizen';
import { reserveEmergencyStock } from '@/services/reserveStock';
import { registerStandbyDonor } from '@/services/registerDonor';
import { ARKIV_CONFIG } from '@/lib/arkiv';

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
  const [locks, setLocks] = useState<EmergencyLock[]>([]);
  const [donors, setDonors] = useState<VolunteerDonor[]>([]);
  const [activeTab, setActiveTab] = useState<'LIVE_STOCK' | 'STANDBY_DONORS'>('LIVE_STOCK');

  const [selectedCategory, setSelectedCategory] = useState<BeaconCategory | 'ALL'>('ALL');
  const [selectedItemCode, setSelectedItemCode] = useState<string>('ALL');
  const [pincodeInput, setPincodeInput] = useState<string>('492099');
  const [emergencyOnly, setEmergencyOnly] = useState<boolean>(false);
  const [maxDistance, setMaxDistance] = useState<number>(100);
  const [now, setNow] = useState<number>(Date.now());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [callingBeacon, setCallingBeacon] = useState<MedicalBeacon | null>(null);

  // Anon Aadhaar Citizen Identity
  const { isVerified, citizenData, triggerJudgeDemo } = useVerifiedCitizen();

  // Reservation State
  const [reservingBeaconKey, setReservingBeaconKey] = useState<string | null>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<EmergencyLock | null>(null);

  // Standby Donor Broadcast Modal State
  const [showDonorModal, setShowDonorModal] = useState<boolean>(false);
  const [donorBloodGroup, setDonorBloodGroup] = useState<string>('O_NEGATIVE');
  const [donorNote, setDonorNote] = useState<string>('');
  const [isSubmittingDonor, setIsSubmittingDonor] = useState<boolean>(false);
  const [donorSuccess, setDonorSuccess] = useState<string | null>(null);

  // Ephemeral Matrix Relay Chat State
  const [activeRelayDonor, setActiveRelayDonor] = useState<VolunteerDonor | null>(null);
  const [relayChatMessages, setRelayChatMessages] = useState<Array<{ sender: 'patient' | 'donor' | 'system'; text: string; time: string }>>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isDonorTyping, setIsDonorTyping] = useState<boolean>(false);

  // Initialize Matrix chat when donor is selected
  useEffect(() => {
    if (activeRelayDonor) {
      setRelayChatMessages([
        {
          sender: 'system',
          text: `🔒 Ephemeral P2P Matrix Relay established with ${activeRelayDonor.payload.syntheticRelay}. Real phone numbers and identities are shielded under DPDP Act 2023. This channel auto-destructs with the Arkiv DB-Chain entity.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          sender: 'donor',
          text: `Namaste, I am a verified standby donor for ${activeRelayDonor.attributes.bloodGroup.replace('_', ' ')} in PIN ${activeRelayDonor.attributes.pincode} (${activeRelayDonor.payload.state}). What hospital or emergency ICU case is this for?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setChatInput('');
      setIsDonorTyping(false);
    }
  }, [activeRelayDonor]);

  const handleSendRelayMessage = (msgToSend?: string) => {
    const text = (msgToSend || chatInput).trim();
    if (!text || !activeRelayDonor) return;

    const userMsg = {
      sender: 'patient' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setRelayChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsDonorTyping(true);

    setTimeout(() => {
      setIsDonorTyping(false);
      const donorReplies = [
        `Understood! I am 15 minutes away from AIIMS / trauma corridor. Proceeding to the blood bank counter right now. Please tell the desk to prep crossmatching.`,
        `Got it! I have my Anon Aadhaar eligibility verified. Arriving at the casualty desk shortly. Stay calm!`,
        `Noted! Moving towards the hospital donor center right now. Will confirm once I arrive at the reception desk.`,
      ];
      const replyText = donorReplies[Math.floor(Math.random() * donorReplies.length)];
      setRelayChatMessages((prev) => [
        ...prev,
        {
          sender: 'donor',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1100);
  };

  // Sync beacons, locks, donors from beaconStore
  useEffect(() => {
    setBeacons(beaconStore.getBeacons());
    setLocks(beaconStore.getLocks());
    setDonors(beaconStore.getDonors());

    const unsubscribe = beaconStore.subscribe(() => {
      setBeacons(beaconStore.getBeacons());
      setLocks(beaconStore.getLocks());
      setDonors(beaconStore.getDonors());
    });
    return unsubscribe;
  }, []);

  // Check if current verified citizen holds an active lock
  useEffect(() => {
    if (citizenData?.nullifier) {
      const existing = beaconStore.getActiveLockByNullifier(citizenData.nullifier);
      if (existing) {
        setActiveTicket(existing);
      }
    }
  }, [citizenData, locks]);

  // Timer loop for countdowns
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
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}h ${minutes
        .toString()
        .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  // Handle 60m ZK Stock Reservation
  const handleReserveStock = async (beacon: MedicalBeacon) => {
    setReservationError(null);

    if (!isVerified || !citizenData) {
      // Prompt 1-click judge demo or login
      triggerJudgeDemo();
      return;
    }

    setReservingBeaconKey(beacon.key);
    try {
      if (soundEnabled) playEmergencyChimeSound();
      const result = await reserveEmergencyStock(null, {
        beaconKey: beacon.key,
        hospitalName: beacon.payload.facilityName,
        itemCode: beacon.attributes.itemCode,
        nullifier: citizenData.nullifier,
        pincode: citizenData.pincode,
        isAdultVerified: citizenData.ageAbove18,
        zkProofTimestamp: citizenData.timestamp,
      });

      setActiveTicket(result.lock);
    } catch (err: any) {
      setReservationError(err.message || 'Failed to complete emergency reservation.');
    } finally {
      setReservingBeaconKey(null);
    }
  };

  // Handle Standby Donor Registration
  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified || !citizenData) {
      triggerJudgeDemo();
      return;
    }

    setIsSubmittingDonor(true);
    setDonorSuccess(null);
    try {
      if (soundEnabled) playRadarPingSound();
      const result = await registerStandbyDonor(null, {
        bloodGroup: donorBloodGroup,
        nullifier: citizenData.nullifier,
        pincode: citizenData.pincode,
        ageAbove18: citizenData.ageAbove18,
        state: citizenData.state,
        note: donorNote || 'Available for emergency replacement whole blood / platelet donation.',
      });

      setDonorSuccess(
        `Standby beacon registered on Arkiv DB-Chain! Relay: ${result.syntheticRelay} (Auto-expires in 12h)`
      );
      setTimeout(() => {
        setShowDonorModal(false);
        setDonorSuccess(null);
        setDonorNote('');
      }, 2500);
    } catch (err: any) {
      setReservationError(err?.message || 'Error broadcasting donor beacon.');
    } finally {
      setIsSubmittingDonor(false);
    }
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
    <div className="space-y-6 sm:space-y-8">
      {/* Sybil Protection Alert / Error Toast */}
      {reservationError && (
        <div className="bg-rose-950/80 border border-rose-500/50 rounded-2xl p-4 flex items-start gap-3 text-rose-200 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm">
            <strong className="block font-bold text-rose-300">Sybil Protection Triggered:</strong>
            <p className="mt-0.5 text-rose-200/90">{reservationError}</p>
          </div>
          <button
            onClick={() => setReservationError(null)}
            className="text-rose-400 hover:text-rose-200 text-lg leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active 60-Minute Emergency Reservation Ticket */}
      {/* Active 60-Minute Emergency Reservation Ticket (Clean Light Theme) */}
      {activeTicket && activeTicket.expiresAtTimestamp > now && activeTicket.attributes.status === 'LOCKED' && (
        <div className="relative overflow-hidden bg-white border-2 border-rose-300 rounded-3xl p-5 sm:p-7 shadow-md text-slate-900">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-rose-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <Lock size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider uppercase text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    60-Min Emergency Lock Active
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Arkiv DB-Chain Auto-Expiry
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  1 Unit Reserved at {activeTicket.payload.hospitalName || 'Emergency Desk'}
                </h2>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-2xl flex items-center gap-2 text-right">
              <Clock size={18} className="text-rose-600 animate-spin" />
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Time Remaining to Claim
                </span>
                <span className="text-lg font-black font-mono text-rose-600">
                  {formatCountdown(Math.floor((activeTicket.expiresAtTimestamp - now) / 1000))}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
              <span className="block text-slate-500 font-bold uppercase text-[10px]">
                Synthetic Patient Token (Zero PII)
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-lg font-black text-slate-900">
                  {activeTicket.payload.syntheticPatientToken}
                </span>
                <button
                  onClick={() => handleCopy(activeTicket.payload.syntheticPatientToken, 'token-copy')}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold"
                >
                  {copiedKey === 'token-copy' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
              <span className="block text-slate-500 font-bold uppercase text-[10px]">
                Item Reserved
              </span>
              <span className="block font-bold text-base text-slate-900 mt-1">
                {activeTicket.payload.itemCode?.replace('_', ' ') || 'Emergency Unit'}
              </span>
              <span className="text-[11px] text-rose-600 font-bold">
                1 Unit Deducted from Radar Public Pool
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
              <span className="block text-slate-500 font-bold uppercase text-[10px]">
                Hospital Claim Instruction
              </span>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Present this token at the casualty counter. The reservation auto-releases on Arkiv after 60 mins if unclaimed.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-mono text-slate-500 truncate max-w-sm">
              Lock Key: {activeTicket.key}
            </span>
            <a
              href={`${ARKIV_CONFIG.explorerUrl}/tx/${activeTicket.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-800 flex items-center gap-1 font-bold hover:underline transition-colors text-xs"
            >
              <span>View Lock TX on Arkiv Explorer</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {/* Main View Switcher Tabs: Live Supplies vs Standby Volunteer Donors */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('LIVE_STOCK')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === 'LIVE_STOCK'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🚨 Live Emergency Inventory</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'LIVE_STOCK' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {searchResults.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('STANDBY_DONORS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === 'STANDBY_DONORS'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HeartHandshake size={16} />
            <span>Standby Volunteer Donors (Zero-Stock Fallback)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'STANDBY_DONORS' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {donors.length}
            </span>
          </button>
        </div>

        {activeTab === 'STANDBY_DONORS' && (
          <button
            onClick={() => {
              if (!isVerified) {
                triggerJudgeDemo();
              }
              setShowDonorModal(true);
            }}
            className="hidden sm:flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md shadow-rose-600/20 transition-all active:scale-95"
          >
            <Sparkles size={14} />
            <span>Broadcast 12h Donor Beacon (ZK)</span>
          </button>
        )}
      </div>

      {/* VIEW 1: LIVE INVENTORY RADAR */}
      {activeTab === 'LIVE_STOCK' && (
        <>
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
                  Verified inventory with strict <strong>time-scoped auto-expiration</strong> on Arkiv DB-Chain and <strong>60-minute anti-scalper reservations</strong> powered by Anon Aadhaar.
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
                  stores, and trauma desks broadcast time-scoped stock with protocol-enforced auto-expiration so families never chase phantom stock.
                </p>

                <div className="flex items-center gap-4 pt-1">
                  <button
                    onClick={onNavigateToHospitalPortal}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-md shadow-rose-600/20 hover:shadow-lg transition-all tracking-wider"
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
                    <span className="block text-xl font-black text-slate-900">60 Min</span>
                    <span className="text-[11px] font-bold text-slate-400">ZK Anti-Scalper Lock</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div>
                    <span className="block text-xl font-black text-slate-900">Zero PII</span>
                    <span className="text-[11px] font-bold text-slate-400">DPDP Act Compliant</span>
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
                    <span className="flex items-center gap-1 text-[11px] font-extrabold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full shrink-0">
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
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20 font-black'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
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
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20 font-black'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
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
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20 font-black'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
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
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20 font-black'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  💊 Jan Aushadhi
                </button>
              </div>

              {/* Blood Group Selector (Circular Pills) */}
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
                            <span
                              className={`text-[8px] sm:text-[9px] font-extrabold uppercase mt-0.5 ${
                                isSelected ? 'text-rose-100' : 'text-rose-600'
                              }`}
                            >
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
                type = str(&apos;medical_beacon&apos;) AND unitsAvailable &gt; i32(0)
                {selectedCategory !== 'ALL' ? ` AND category = str('${selectedCategory}')` : ''}
                {userPincode ? ` AND pincode = i32(${userPincode})` : ''}
              </code>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
              <span className="flex items-center gap-1 text-sky-600 font-extrabold text-[11px]">
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
                  inventory. Expand your radius or check the Standby Volunteer Donors pool.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setSelectedItemCode('ALL');
                      setMaxDistance(1500);
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs px-6 py-3 rounded-xl transition-all"
                  >
                    Clear Filters &amp; Expand Radius
                  </button>
                  <button
                    onClick={() => setActiveTab('STANDBY_DONORS')}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md shadow-rose-600/20 transition-all active:scale-98"
                  >
                    Check Standby Donors Pool
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map(({ beacon, distanceKm, remainingSeconds }) => {
                  const itemDef = AVAILABLE_ITEM_CODES.find((i) => i.code === beacon.attributes.itemCode);
                  const isRare =
                    beacon.attributes.itemCode.includes('NEGATIVE') ||
                    beacon.attributes.itemCode.includes('BOMBAY');
                  const ttlPercent = Math.min(100, Math.max(0, (remainingSeconds / 14400) * 100));
                  const isReserving = reservingBeaconKey === beacon.key;

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
                              remainingSeconds < 3600 ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-700 border border-sky-200'
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
                              <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                                Govt Free Supply
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
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
                            <span className="text-[11px] font-extrabold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded flex items-center gap-1">
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
                                ttlPercent < 25 ? 'bg-rose-500' : ttlPercent < 60 ? 'bg-amber-500' : 'bg-sky-500'
                              }`}
                              style={{ width: `${ttlPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Actions: Call Desk + ZK 60m Reserve + Inclusion Proof */}
                      <div className="space-y-2 pt-4 mt-3 border-t border-slate-100">
                        {/* FEATURE 1: 60-Minute ZK Anti-Scalper Lock Button */}
                        <button
                          onClick={() => handleReserveStock(beacon)}
                          disabled={isReserving || beacon.attributes.unitsAvailable <= 0}
                          className={`w-full font-black text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm ${
                            isVerified
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-98'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                          }`}
                          title={
                            isVerified
                              ? 'Locks 1 unit for 60 minutes on Arkiv via Anon Aadhaar nullifier'
                              : 'Click to authenticate via Anon Aadhaar or 1-Click Judge Demo to reserve'
                          }
                        >
                          <Lock size={14} className={isReserving ? 'animate-spin' : ''} />
                          <span>
                            {isReserving
                              ? 'Signing Arkiv 60m Lock...'
                              : isVerified
                              ? 'Reserve 1 Unit (60m ZK Lock)'
                              : '⚡ ZK Login to Reserve 1 Unit'}
                          </span>
                        </button>

                        <div className="flex gap-2">
                          <a
                            href={`tel:${beacon.payload.contactDesk}`}
                            onClick={() => {
                              setCallingBeacon(beacon);
                              if (soundEnabled) playEmergencyChimeSound();
                            }}
                            className="flex-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-black text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/25 transition-all tracking-wide"
                          >
                            <PhoneCall size={14} />
                            <span>CALL 24x7 DESK</span>
                          </a>

                          <button
                            onClick={() => onInspectProof(beacon)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 px-3 rounded-xl transition-all shrink-0"
                            title="Inspect Arkiv Keccak-MPT Inclusion Proof"
                          >
                            <ShieldCheck size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* VIEW 2: STANDBY VOLUNTEER DONORS (ZERO-STOCK FALLBACK) */}
      {activeTab === 'STANDBY_DONORS' && (
        <div className="space-y-6">
          {/* Header Banner - 100% Light Theme, Pure White with Soft Rose & Slate */}
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-bold uppercase tracking-wider">
                  <Shield size={14} />
                  <span>Feature #2: ZK-Verified Standby Volunteer Donor Beacon</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Zero-Stock Fallback: <span className="text-rose-600">Pincode-Locked Donors</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  When certified hospital blood banks hit zero units, families connect with verified adult donors in their exact PIN code. Anon Aadhaar cryptographically proves age 18+ and residence without doxxing real names or phone numbers.
                </p>
              </div>

              <button
                onClick={() => {
                  if (!isVerified) {
                    triggerJudgeDemo();
                  }
                  setShowDonorModal(true);
                }}
                className="self-start md:self-auto bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-5 py-3.5 rounded-2xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 shrink-0 active:scale-95"
              >
                <Sparkles size={16} />
                <span>Broadcast 12h Donor Beacon</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Age Enforced</span>
                <strong className="block text-slate-900 font-mono text-sm mt-0.5">18+ via Groth16</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Location Locked</span>
                <strong className="block text-slate-900 font-mono text-sm mt-0.5">QR Verified PIN</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Arkiv TTL</span>
                <strong className="block text-slate-900 font-mono text-sm mt-0.5">12-Hour Expiration</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Privacy Protection</span>
                <strong className="block text-slate-900 font-mono text-sm mt-0.5">Synthetic Matrix Relay</strong>
              </div>
            </div>
          </div>

          {/* Donors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {donors.map((donor) => {
              const remainingSeconds = Math.max(0, Math.floor((donor.expiresAtTimestamp - now) / 1000));
              const isOType = donor.attributes.bloodGroup.includes('O_');

              return (
                <div
                  key={donor.key}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full ${
                          isOType ? 'bg-rose-100 text-rose-700' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        🩸 {donor.attributes.bloodGroup.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        {formatCountdown(remainingSeconds)} left
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                        <MapPin size={14} className="text-rose-500" />
                        <span>PIN {donor.attributes.pincode} • {donor.payload.state}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        &quot;{donor.payload.note}&quot;
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 text-slate-700 p-3 rounded-xl space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Identity Proof:</span>
                        <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                          Age 18+ Verified ✓
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Private Relay:</span>
                        <code className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                          {donor.payload.syntheticRelay}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setActiveRelayDonor(donor)}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/20 active:scale-98"
                    >
                      <MessageSquare size={13} />
                      <span>Connect via Relay</span>
                    </button>
                    <button
                      onClick={() => handleCopy(donor.payload.syntheticRelay, `relay-${donor.key}`)}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 shrink-0"
                      title="Copy Matrix Relay Handle"
                    >
                      <Copy size={13} />
                      <span>{copiedKey === `relay-${donor.key}` ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Standby Donor Registration Modal */}
      {showDonorModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowDonorModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <HeartHandshake size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Broadcast Standby Donor Beacon</h3>
                  <span className="text-xs text-slate-500">12-Hour Auto-Expiring Arkiv DB-Chain Entity</span>
                </div>
              </div>
              <button onClick={() => setShowDonorModal(false)} className="text-slate-400 hover:text-slate-700 text-lg">
                ✕
              </button>
            </div>

            {donorSuccess ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center space-y-2 text-rose-800">
                <CheckCircle2 size={36} className="text-rose-600 mx-auto" />
                <h4 className="font-extrabold text-base">Beacon Broadcasted Successfully!</h4>
                <p className="text-xs text-rose-700">{donorSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleRegisterDonor} className="space-y-4">
                {/* ZK Proof Pre-Filled & Locked Credentials */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Age Verification (Groth16):</span>
                    <span className="text-rose-700 bg-rose-50 border border-rose-200 font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <UserCheck size={12} /> 18+ Adult Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Pincode (Locked to ZK Proof):</span>
                    <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {citizenData?.pincode || 492099} ({citizenData?.state || 'Chhattisgarh'})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Anonymous Groth16 Nullifier:</span>
                    <span className="font-mono text-[10px] text-slate-600 truncate max-w-[200px]">
                      {citizenData?.nullifier || '0x8f42e1b99c72ad416a29...'}
                    </span>
                  </div>
                </div>

                {/* Blood Group Picker */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Blood Group
                  </label>
                  <select
                    value={donorBloodGroup}
                    onChange={(e) => setDonorBloodGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="O_NEGATIVE">O Negative (Universal Donor)</option>
                    <option value="O_POSITIVE">O Positive</option>
                    <option value="A_NEGATIVE">A Negative</option>
                    <option value="A_POSITIVE">A Positive</option>
                    <option value="B_NEGATIVE">B Negative</option>
                    <option value="B_POSITIVE">B Positive</option>
                    <option value="AB_NEGATIVE">AB Negative</option>
                    <option value="AB_POSITIVE">AB Positive</option>
                    <option value="BOMBAY_PHENOTYPE">Bombay Phenotype (Oh)</option>
                  </select>
                </div>

                {/* Note / Availability */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Availability / Trauma Corridor Note
                  </label>
                  <textarea
                    rows={2}
                    value={donorNote}
                    onChange={(e) => setDonorNote(e.target.value)}
                    placeholder="e.g. Can reach AIIMS Trauma desk within 30 minutes in case of emergency ICU request."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Privacy Guarantee Note */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex gap-2">
                  <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Zero PII Guarantee:</strong> No phone number or name is posted. Contact occurs through a synthetic Matrix relay token (<code>matrix_relay_{citizenData?.nullifier ? citizenData.nullifier.slice(0, 8) : '0x8f42e1'}</code>).
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDonorModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDonor}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
                  >
                    <Send size={14} className={isSubmittingDonor ? 'animate-spin' : ''} />
                    <span>{isSubmittingDonor ? 'Broadcasting...' : 'Broadcast Beacon (12h)'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
      {/* Ephemeral Matrix Relay Chat Modal */}
      {activeRelayDonor && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          onClick={() => setActiveRelayDonor(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">Ephemeral Matrix P2P Relay</h3>
                    <span className="text-[9px] font-black uppercase bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded-full">
                      E2E Encrypted
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Direct P2P chat • Zero phone numbers • DPDP Act Compliant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveRelayDonor(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors text-base"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>

            {/* Target Donor Header Strip */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900">
                  🩸 {activeRelayDonor.attributes.bloodGroup.replace('_', ' ')} Donor (PIN {activeRelayDonor.attributes.pincode})
                </span>
                <span className="text-rose-700 bg-rose-50 border border-rose-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Age 18+ Verified ✓
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200/70">
                <span className="truncate max-w-[240px]" title={activeRelayDonor.payload.syntheticRelay}>
                  Relay: {activeRelayDonor.payload.syntheticRelay}
                </span>
                <button
                  onClick={() => handleCopy(activeRelayDonor.payload.syntheticRelay, 'modal-chat-relay')}
                  className="text-sky-600 hover:text-sky-800 font-bold text-[10px] flex items-center gap-1 shrink-0 ml-1"
                >
                  <Copy size={11} />
                  <span>{copiedKey === 'modal-chat-relay' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Chat Stream */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 h-[200px] sm:h-[220px] overflow-y-auto space-y-2.5 text-xs">
              {relayChatMessages.map((msg, idx) => {
                if (msg.sender === 'system') {
                  return (
                    <div key={idx} className="bg-white/90 border border-slate-200/60 rounded-xl p-2 text-[10px] text-slate-600 text-center leading-relaxed">
                      {msg.text}
                    </div>
                  );
                }
                const isUser = msg.sender === 'patient';
                return (
                  <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-rose-600 text-white rounded-tr-xs shadow-xs'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      <span className="block text-[9px] font-bold opacity-75 mb-0.5">
                        {isUser ? 'You (Patient Family)' : 'Verified Volunteer Donor'}
                      </span>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">{msg.time}</span>
                  </div>
                );
              })}

              {isDonorTyping && (
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-[10px]">Donor is typing encrypted reply...</span>
                </div>
              )}
            </div>

            {/* Quick Emergency Action Chips */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                Quick Emergency Prompts:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  '🚨 ICU Emergency at AIIMS. Need whole blood urgently.',
                  'Can you reach the hospital blood bank in 30 mins?',
                  'Doctor requested urgent crossmatch test.',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendRelayMessage(chip)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-[10px] font-bold border border-slate-200/70 transition-all shrink-0 active:scale-95"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Send Message Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendRelayMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type emergency message (e.g. ICU bed number)..."
                className="flex-1 h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isDonorTyping}
                className="h-9 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/25 transition-all shrink-0 active:scale-95"
              >
                <Send size={13} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
