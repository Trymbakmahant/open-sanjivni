'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import dynamic from 'next/dynamic';

export interface VerifiedCitizenData {
  nullifier: string;
  ageAbove18: boolean;
  pincode: number;
  state: string;
  timestamp: string;
  source: 'live_qr' | 'judge_demo' | 'test_mode';
}

interface AnonAadhaarContextValue {
  useTestAadhaar: boolean;
  setUseTestAadhaar: (value: boolean | ((prev: boolean) => boolean)) => void;
  isVerified: boolean;
  citizenData: VerifiedCitizenData | null;
  triggerJudgeDemoVerification: () => void;
  clearVerification: () => void;
  activeLockKey: string | null;
  setActiveLockKey: (key: string | null) => void;
}

const AnonAadhaarContext = createContext<AnonAadhaarContextValue>({
  useTestAadhaar: true,
  setUseTestAadhaar: () => {},
  isVerified: false,
  citizenData: null,
  triggerJudgeDemoVerification: () => {},
  clearVerification: () => {},
  activeLockKey: null,
  setActiveLockKey: () => {},
});

export const useAnonAadhaarCitizen = () => useContext(AnonAadhaarContext);

// Dynamically load the AnonAadhaarProvider on client
interface AnonAadhaarWrapperProps {
  children: ReactNode;
}

export function AnonAadhaarWrapper({ children }: AnonAadhaarWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [useTestAadhaar, setUseTestAadhaar] = useState<boolean>(true);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [citizenData, setCitizenData] = useState<VerifiedCitizenData | null>(null);
  const [activeLockKey, setActiveLockKey] = useState<string | null>(null);
  const [ProviderComp, setProviderComp] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    setMounted(true);
    // Dynamically import AnonAadhaarProvider on client
    import('@anon-aadhaar/react')
      .then((mod) => {
        setProviderComp(() => mod.AnonAadhaarProvider);
      })
      .catch((err) => {
        console.warn('[AnonAadhaar] Client import deferred:', err);
      });

    // Restore any existing demo verification session from localStorage
    try {
      const saved = localStorage.getItem('open_sanjivni_zk_citizen');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCitizenData(parsed);
        setIsVerified(true);
      }
    } catch {}
  }, []);

  // 1-Click Judge Demo ZK Verification (Mandatory Gate for International Hackathon Judges)
  const triggerJudgeDemoVerification = () => {
    const demoData: VerifiedCitizenData = {
      nullifier: '0x8f42e1b99c72ad416a29bf33d90184e271a01298471928374650192837465019',
      ageAbove18: true,
      pincode: 492099, // AIIMS Raipur Trauma Corridor PIN
      state: 'Chhattisgarh',
      timestamp: String(Date.now()),
      source: 'judge_demo',
    };
    setCitizenData(demoData);
    setIsVerified(true);
    try {
      localStorage.setItem('open_sanjivni_zk_citizen', JSON.stringify(demoData));
    } catch {}
  };

  const clearVerification = () => {
    setCitizenData(null);
    setIsVerified(false);
    setActiveLockKey(null);
    try {
      localStorage.removeItem('open_sanjivni_zk_citizen');
      localStorage.removeItem('anonAadhaar');
    } catch {}
  };

  const contextValue: AnonAadhaarContextValue = {
    useTestAadhaar,
    setUseTestAadhaar,
    isVerified,
    citizenData,
    triggerJudgeDemoVerification,
    clearVerification,
    activeLockKey,
    setActiveLockKey,
  };

  if (!mounted || !ProviderComp) {
    return (
      <AnonAadhaarContext.Provider value={contextValue}>
        {children}
      </AnonAadhaarContext.Provider>
    );
  }

  const DynamicProvider = ProviderComp;

  return (
    <AnonAadhaarContext.Provider value={contextValue}>
      <DynamicProvider _useTestAadhaar={useTestAadhaar} _appName="Open Sanjivni">
        {children}
      </DynamicProvider>
    </AnonAadhaarContext.Provider>
  );
}
