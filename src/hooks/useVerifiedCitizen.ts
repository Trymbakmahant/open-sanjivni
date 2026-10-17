'use client';

import { useState, useEffect } from 'react';
import { useAnonAadhaar, useProver } from '@anon-aadhaar/react';
import { deserialize } from '@anon-aadhaar/core';
import { useAnonAadhaarCitizen, VerifiedCitizenData } from '@/providers/AnonAadhaarWrapper';

export const ANON_AADHAAR_CONFIG = {
  appName: 'Open Sanjivni',
  nullifierSeed: 492099108,
  fieldsToReveal: ['revealAgeAbove18', 'revealPinCode', 'revealState'] as const,
};

export function useVerifiedCitizen() {
  const [anonAadhaar, startReq] = useAnonAadhaar();
  const [proverState, latestProof] = useProver();
  const context = useAnonAadhaarCitizen();
  const [extractedData, setExtractedData] = useState<VerifiedCitizenData | null>(null);

  // Parse real Anon Aadhaar Groth16 proof if available
  useEffect(() => {
    let isCancelled = false;

    async function parseProof() {
      if (anonAadhaar.status === 'logged-in') {
        try {
          let proofObj: any = latestProof?.proof;

          if (!proofObj && anonAadhaar.anonAadhaarProofs) {
            const keys = Object.keys(anonAadhaar.anonAadhaarProofs);
            if (keys.length > 0) {
              const latestKey = Number(keys[keys.length - 1]);
              const pcdWrapper = anonAadhaar.anonAadhaarProofs[latestKey];
              if (pcdWrapper?.pcd) {
                const deserialized = await deserialize(pcdWrapper.pcd);
                proofObj = deserialized.proof;
              }
            }
          }

          if (proofObj && !isCancelled) {
            const nullifierStr = String(proofObj.nullifier || '');
            const rawAge = proofObj.ageAbove18;
            const isAdult = rawAge === '1' || rawAge === 1 || rawAge === true || rawAge === 'true';
            const rawPin = proofObj.pincode;
            const pinNumber = Number(rawPin) || 492099;
            const stateStr = String(proofObj.state || 'Chhattisgarh');
            const timeStr = String(proofObj.timestamp || Date.now());

            const verified: VerifiedCitizenData = {
              nullifier: nullifierStr.startsWith('0x') ? nullifierStr : '0x' + BigInt(nullifierStr || '0').toString(16),
              ageAbove18: isAdult,
              pincode: pinNumber,
              state: stateStr,
              timestamp: timeStr,
              source: context.useTestAadhaar ? 'test_mode' : 'live_qr',
            };

            setExtractedData(verified);
          }
        } catch (err) {
          console.warn('[AnonAadhaar] Error deserializing proof:', err);
        }
      } else {
        if (!isCancelled) {
          setExtractedData(null);
        }
      }
    }

    parseProof();

    return () => {
      isCancelled = true;
    };
  }, [anonAadhaar, latestProof, context.useTestAadhaar]);

  // Priority: Context citizen data (from 1-click judge demo or saved session) or extracted real ZK proof
  const activeCitizen: VerifiedCitizenData | null = context.citizenData || extractedData;
  const isVerified = Boolean(activeCitizen && activeCitizen.nullifier);

  const logout = () => {
    try {
      startReq({ type: 'logout' });
    } catch {}
    context.clearVerification();
    setExtractedData(null);
  };

  return {
    isVerified,
    citizenData: activeCitizen,
    status: isVerified ? 'logged-in' : anonAadhaar.status,
    proverState,
    useTestAadhaar: context.useTestAadhaar,
    setUseTestAadhaar: context.setUseTestAadhaar,
    triggerJudgeDemo: context.triggerJudgeDemoVerification,
    logout,
    nullifierSeed: ANON_AADHAAR_CONFIG.nullifierSeed,
    fieldsToReveal: ANON_AADHAAR_CONFIG.fieldsToReveal,
  };
}
