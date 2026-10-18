'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Shield,
  Copy,
  Check,
  X,
  Zap,
  Lock,
  LogOut,
  Sparkles,
  QrCode,
  UserCheck,
} from 'lucide-react';
import { useVerifiedCitizen } from '@/hooks/useVerifiedCitizen';

export function AnonAadhaarBadge() {
  const {
    isVerified,
    citizenData,
    useTestAadhaar,
    setUseTestAadhaar,
    triggerJudgeDemo,
    logout,
    nullifierSeed,
    fieldsToReveal,
  } = useVerifiedCitizen();

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [LoginComp, setLoginComp] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lazy-load the official Anon Aadhaar login button
  useEffect(() => {
    import('@anon-aadhaar/react')
      .then((mod) => {
        setLoginComp(() => mod.LogInWithAnonAadhaar);
      })
      .catch((e) => console.warn('[AnonAadhaar] Login button deferred:', e));
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedNullifier = citizenData?.nullifier
    ? `${citizenData.nullifier.slice(0, 6)}...${citizenData.nullifier.slice(-4)}`
    : '';

  return (
    <>
      {/* 1. Navbar Small Button Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className={`group relative flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-xs cursor-pointer select-none ${
          isVerified
            ? 'bg-sky-50 hover:bg-sky-100/80 border border-sky-300 text-sky-950'
            : 'bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700'
        }`}
        title={
          isVerified
            ? `Anon Aadhaar Verified: ${truncatedNullifier} (Click to view details)`
            : 'Anon Aadhaar Zero-Knowledge Identity (Click to verify)'
        }
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {/* ZK Badge Icon */}
        <div
          className={`relative flex items-center justify-center w-5 h-5 rounded-full font-black text-[9px] shrink-0 transition-transform group-hover:scale-105 ${
            isVerified
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 border border-slate-200 text-slate-700'
          }`}
        >
          <span>ZK</span>
          {isVerified && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping" />
          )}
        </div>

        {/* State Label */}
        {isVerified ? (
          <span className="font-mono text-xs font-bold text-sky-800 tracking-tight">
            {truncatedNullifier || 'Verified'}
          </span>
        ) : (
          <span className="font-bold text-xs text-slate-800">
            Verify ID
          </span>
        )}
      </button>

      {/* 2. Popup Detail Card / Modal (Mounted into body to ensure absolute centering & matching light theme) */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 font-black text-sm shrink-0">
                    <span>ZK</span>
                    {isVerified && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-500 rounded-full animate-ping" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                        Anon Aadhaar Identity
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-sky-50 text-sky-700 border-sky-200">
                        Groth16 Zero-PII
                      </span>
                      {isVerified ? (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold border bg-sky-100 text-sky-800 border-sky-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                          Verified Citizen
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-amber-50 text-amber-700 border-amber-200">
                          Unverified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sybil-resistant 60m ICU locks &amp; 18+ standby donor beacons
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Mode Switcher */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    Verification Mode:
                  </span>
                  <div className="flex items-center bg-slate-200/60 p-0.5 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setUseTestAadhaar(true)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all text-xs ${
                        useTestAadhaar
                          ? 'bg-white text-rose-700 border border-slate-200/80 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Judge Test Mode
                    </button>
                    <button
                      onClick={() => setUseTestAadhaar(false)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all text-xs ${
                        !useTestAadhaar
                          ? 'bg-white text-sky-800 border border-slate-200/80 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Live UIDAI QR
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {useTestAadhaar
                    ? '⚡ Permits simulated 1-click testnet validation & demo QR codes without needing a physical Indian Aadhaar card.'
                    : '🇮🇳 Requires scanning official UIDAI mAadhaar QR code with cryptographic RSA signature verification.'}
                </p>
              </div>

              {/* Verification State Section */}
              {isVerified ? (
                <div className="space-y-4">
                  {/* Active Sovereign Identity Card */}
                  <div className="relative overflow-hidden bg-sky-50/40 border border-sky-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-sky-600" />
                        <span className="text-xs font-black uppercase tracking-wider text-sky-950">
                          Verified Citizen Credentials
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-sky-800 bg-white px-2.5 py-0.5 rounded-full border border-sky-200 font-bold">
                        DPDP Compliant
                      </span>
                    </div>

                    {/* Groth16 Nullifier Box */}
                    <div className="bg-white border border-sky-200/80 rounded-xl p-3 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-semibold">
                          Groth16 Nullifier (Zero-PII ID):
                        </span>
                        <button
                          onClick={() => handleCopy(citizenData?.nullifier || '')}
                          className="text-sky-700 hover:text-sky-800 flex items-center gap-1 font-bold text-xs transition-colors"
                        >
                          {copied ? (
                            <>
                              <Check size={12} className="text-sky-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <code className="block font-mono text-xs text-slate-800 break-all bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 select-all font-semibold">
                        {citizenData?.nullifier}
                      </code>
                    </div>

                    {/* Demographics Pill Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="bg-white border border-slate-200/70 p-2.5 rounded-xl shadow-2xs">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">
                          Age Verified
                        </span>
                        <span className="font-extrabold text-sky-700 flex items-center gap-1 mt-0.5">
                          <UserCheck size={13} className="text-sky-600" />
                          18+ Adult
                        </span>
                      </div>

                      <div className="bg-white border border-slate-200/70 p-2.5 rounded-xl shadow-2xs">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">
                          PIN Corridor
                        </span>
                        <span className="font-mono font-bold text-sky-700 mt-0.5 block">
                          {citizenData?.pincode || 492099}
                        </span>
                      </div>

                      <div className="bg-white border border-slate-200/70 p-2.5 rounded-xl shadow-2xs col-span-2 sm:col-span-1">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">
                          Jurisdiction
                        </span>
                        <span className="font-bold text-slate-800 truncate mt-0.5 block">
                          {citizenData?.state || 'Chhattisgarh'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Privacy & Anti-Scalper Guarantee */}
                  <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <Lock size={14} className="text-sky-600" />
                      <span>Active ZK Protections:</span>
                    </div>
                    <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-600">
                      <li>
                        <strong>60-Minute Emergency ICU Bed Lock:</strong> Reserved capacity tied to your anonymous nullifier.
                      </li>
                      <li>
                        <strong>Standby Emergency Donor Beacon:</strong> Broadcast rare blood group availability without exposing your name or phone.
                      </li>
                      <li>
                        <strong>Anti-Scalper Guarantee:</strong> Strictly prevents hoarder bots from cornering emergency medical supplies.
                      </li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                      onClick={() => {
                        logout();
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all"
                    >
                      <LogOut size={14} />
                      <span>Disconnect Identity</span>
                    </button>

                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-6 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Unverified View */
                <div className="space-y-4">
                  {/* Value proposition note */}
                  <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-xs text-sky-950 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-sky-900">
                      <Shield size={16} className="text-sky-600" />
                      <span>Zero-Knowledge Proof of Indian Citizenship</span>
                    </div>
                    <p className="text-[11px] text-sky-800 leading-relaxed">
                      Verify your identity via client-side Groth16 zk-SNARKs. No Aadhaar number, name, or phone number is ever transmitted to any server or recorded on Arkiv DB-Chain.
                    </p>
                  </div>

                  {/* Verification Actions */}
                  <div className="space-y-3">
                    {/* 1-Click Judge Demo Button */}
                    <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap size={16} className="text-amber-600" />
                          <span className="font-extrabold text-xs text-amber-900 uppercase tracking-wider">
                            Hackathon Evaluator Fast-Track
                          </span>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      </div>

                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        If judging outside India, click below to immediately simulate a verified citizen session with an authentic testnet nullifier without needing a physical card.
                      </p>

                      <button
                        onClick={() => {
                          triggerJudgeDemo();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition-all shadow-md shadow-amber-500/25 active:scale-98 cursor-pointer"
                      >
                        <span>⚡</span>
                        <span>1-Click Judge Demo (Instant Verification)</span>
                      </button>
                    </div>

                    {/* Official Anon Aadhaar Login Component */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
                        <QrCode size={15} className="text-sky-600" />
                        <span>Official UIDAI QR Scanner</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Scan your mAadhaar QR code with the official PSE prover
                      </p>

                      <div className="pt-2 flex justify-center">
                        {LoginComp ? (
                          <LoginComp
                            nullifierSeed={nullifierSeed}
                            fieldsToReveal={fieldsToReveal as any}
                          />
                        ) : (
                          <div className="text-xs text-slate-400 py-2">
                            Loading Anon Aadhaar prover module...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer note */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>PSE Anon Aadhaar • Groth16 Prover</span>
                    <span>Seed: {nullifierSeed}</span>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
