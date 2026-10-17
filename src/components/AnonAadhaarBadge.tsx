'use client';

import React, { useState, useEffect } from 'react';
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

  const [copied, setCopied] = useState(false);
  const [LoginComp, setLoginComp] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import('@anon-aadhaar/react')
      .then((mod) => {
        setLoginComp(() => mod.LogInWithAnonAadhaar);
      })
      .catch((e) => console.warn('[AnonAadhaar] Login button deferred:', e));
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedNullifier = citizenData?.nullifier
    ? `${citizenData.nullifier.slice(0, 6)}...${citizenData.nullifier.slice(-4)}`
    : '';

  return (
    <div className="w-full bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-3.5 backdrop-blur-xl shadow-lg shadow-black/20 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mode Switcher & Protocol Branding */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
            <span>ZK</span>
            {isVerified && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-200">
                Anon Aadhaar Identity
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-emerald-950/60 text-emerald-400 border-emerald-700/40">
                Groth16 Zero-PII
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sybil-resistant 60m ICU locks & 18+ standby donor beacons
            </p>
          </div>
        </div>

        {/* Right: Status or Action Trigger */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Mode Selector Toggle */}
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setUseTestAadhaar(true)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                useTestAadhaar
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Permits test QR codes & 1-click judge simulation without Indian physical card"
            >
              Judge Test Mode
            </button>
            <button
              onClick={() => setUseTestAadhaar(false)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                !useTestAadhaar
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Requires official UIDAI QR code scan"
            >
              Live UIDAI QR
            </button>
          </div>

          {!isVerified ? (
            <div className="flex items-center gap-2">
              {/* 1-Click Judge Demo Button */}
              <button
                onClick={triggerJudgeDemo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition-all shadow-md shadow-amber-500/20 active:scale-95"
                title="1-Click bypass for international judges to test ZK reservations immediately"
              >
                <span>⚡</span>
                <span>1-Click Judge Demo</span>
              </button>

              {/* Official Anon Aadhaar Login Component */}
              <div className="scale-90 origin-right">
                {LoginComp ? (
                  <LoginComp
                    nullifierSeed={nullifierSeed}
                    fieldsToReveal={fieldsToReveal as any}
                  />
                ) : (
                  <span className="text-xs text-slate-400 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 font-semibold">
                    Anon Aadhaar
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Verified Citizen Pill & Metadata */
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs text-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-300">Verified Citizen</span>
                <span className="text-slate-400">|</span>
                <button
                  onClick={() => handleCopy(citizenData?.nullifier || '')}
                  className="font-mono text-emerald-400 hover:underline flex items-center gap-1"
                  title="Click to copy full Groth16 Nullifier"
                >
                  <span>{truncatedNullifier}</span>
                  <span className="text-[10px] text-slate-400">
                    {copied ? '✓' : '⧉'}
                  </span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-[11px] bg-slate-950/70 border border-slate-800 px-2.5 py-1.5 rounded-xl text-slate-300">
                <span className="text-emerald-400 font-bold">18+</span>
                <span>•</span>
                <span className="font-mono text-cyan-300">PIN: {citizenData?.pincode}</span>
                <span>•</span>
                <span className="text-slate-400">{citizenData?.state}</span>
              </div>

              <button
                onClick={logout}
                className="px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all"
                title="Disconnect Anon Aadhaar proof session"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Explanatory Banner for Hackathon Judges */}
      {!isVerified && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">Judge Note:</span>
            <span>
              If evaluating outside India, click <strong className="text-amber-300">⚡ 1-Click Judge Demo</strong> to instantly test 60m ZK anti-scalper reservations and standby donor broadcasts without needing a physical Aadhaar card.
            </span>
          </div>
          <span className="hidden md:inline font-mono text-[10px] text-slate-500">
            Seed: 492099108
          </span>
        </div>
      )}
    </div>
  );
}
