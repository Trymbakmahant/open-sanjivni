'use client';

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Clock,
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Check,
  Zap,
  Navigation,
  ChevronRight,
  Droplet,
  Hospital,
  Heart,
  Share2,
  Copy,
} from 'lucide-react';
import { MedicalBeacon, BeaconCategory } from '@/types/beacon';
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
    <div className="mobile-app-wrapper">
      <div className="mobile-phone-frame">
        {/* Phone Notch & Status Bar */}
        <div className="mobile-status-bar">
          <span className="mobile-time">9:41</span>
          <div className="mobile-notch" />
          <div className="mobile-indicators">
            <span className="mobile-signal">●●●</span>
            <span className="mobile-wifi">WiFi</span>
            <span className="mobile-battery">100%</span>
          </div>
        </div>

        {/* Curved Red Emergency Header */}
        <div className="mobile-curved-header">
          <div className="mobile-header-nav">
            <div className="mobile-brand-icon">
              <Droplet size={18} className="drop-fill" />
            </div>
            <div className="mobile-header-titles">
              <h3>Sanjeevani Pulse</h3>
              <span className="mobile-header-sub">Emergency Corridor Radar</span>
            </div>
            <div className="mobile-header-badge">
              <span className="tiramisu-mini-dot" />
              <span>Arkiv DB</span>
            </div>
          </div>

          {/* Location Bar with 1-tap PIN switcher */}
          <div className="mobile-location-card">
            <div className="loc-left" onClick={() => setIsEditingLocation((prev) => !prev)}>
              <MapPin size={16} className="loc-pin-icon" />
              <div>
                <span className="loc-caption">Emergency Location (Indian PIN)</span>
                <span className="loc-val">
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
              className="loc-edit-btn"
            >
              {isEditingLocation ? 'Done' : 'Change'}
            </button>
          </div>

          {/* Location Editor Drawer */}
          {isEditingLocation && (
            <div className="mobile-location-drawer">
              <div className="pin-input-row">
                <input
                  type="text"
                  maxLength={6}
                  value={mobilePincode}
                  onChange={(e) => setMobilePincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit PIN code"
                  className="mobile-pin-input"
                />
                <button
                  onClick={() => setIsEditingLocation(false)}
                  className="btn-pin-confirm"
                >
                  Locate
                </button>
              </div>
              <div className="quick-hubs-scroll">
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
                    className={`hub-pill ${mobilePincode === h.code ? 'active' : ''}`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Emergency Specialty Switcher */}
        <div className="mobile-category-tabs">
          <button
            onClick={() => {
              setSelectedSpecialty('BLOOD');
              if (soundEnabled) playRadarPingSound();
            }}
            className={`cat-tab ${selectedSpecialty === 'BLOOD' ? 'active' : ''}`}
          >
            🩸 Blood Group
          </button>
          <button
            onClick={() => {
              setSelectedSpecialty('ANTI_VENOM');
              if (soundEnabled) playRadarPingSound();
            }}
            className={`cat-tab ${selectedSpecialty === 'ANTI_VENOM' ? 'active' : ''}`}
          >
            🐍 Anti-Venom
          </button>
          <button
            onClick={() => {
              setSelectedSpecialty('RABIES');
              if (soundEnabled) playRadarPingSound();
            }}
            className={`cat-tab ${selectedSpecialty === 'RABIES' ? 'active' : ''}`}
          >
            💉 Rabies Vac
          </button>
          <button
            onClick={() => {
              setSelectedSpecialty('JAN_AUSHADHI');
              if (soundEnabled) playRadarPingSound();
            }}
            className={`cat-tab ${selectedSpecialty === 'JAN_AUSHADHI' ? 'active' : ''}`}
          >
            💊 Jan Aushadhi
          </button>
        </div>

        {/* 1-Tap Blood Type Selector Card (Directly from BloodConnect+ design!) */}
        {selectedSpecialty === 'BLOOD' && (
          <div className="mobile-blood-selector-card">
            <span className="selector-title">Select Needed Blood Group</span>

            {/* Visual Blood Bag Highlight */}
            <div className="blood-bag-visual">
              <div className="bag-container">
                <div className="bag-tube" />
                <div className="bag-body">
                  <div className="bag-label-box">
                    <span className="bag-blood-type">
                      {selectedLetter}
                      {selectedSign}
                    </span>
                    <span className="bag-subtitle">Arkiv Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* A / B / AB / O Toggle Buttons */}
            <div className="letter-toggle-row">
              {(['A', 'B', 'AB', 'O'] as const).map((letter) => (
                <button
                  key={letter}
                  onClick={() => {
                    setSelectedLetter(letter);
                    if (soundEnabled) playRadarPingSound();
                  }}
                  className={`letter-btn ${selectedLetter === letter ? 'active' : ''}`}
                >
                  {letter}
                </button>
              ))}
            </div>

            {/* + / - Rh Factor Toggle */}
            <div className="rh-toggle-row">
              <button
                onClick={() => {
                  setSelectedSign('+');
                  if (soundEnabled) playRadarPingSound();
                }}
                className={`rh-btn ${selectedSign === '+' ? 'active' : ''}`}
              >
                + (Rh Positive)
              </button>
              <button
                onClick={() => {
                  setSelectedSign('-');
                  if (soundEnabled) playRadarPingSound();
                }}
                className={`rh-btn rh-rare ${selectedSign === '-' ? 'active' : ''}`}
              >
                - (Rh Negative / Rare)
              </button>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="mobile-results-header">
          <div className="results-title-line">
            <h4>Live Stock Near You</h4>
            <span className="results-count-tag">{mobileResults.length} Available</span>
          </div>
          <span className="results-auto-purge-hint">
            <Clock size={11} /> All results auto-purge in 4h via Arkiv protocol
          </span>
        </div>

        {/* Mobile Results List matching screenshot card layout */}
        <div className="mobile-results-list">
          {mobileResults.length === 0 ? (
            <div className="mobile-empty-state">
              <AlertTriangle size={32} className="empty-warn-icon" />
              <h5>No Available Stock in Current Radius</h5>
              <p>
                Listings have <strong>auto-expired on Arkiv DB-Chain</strong> to prevent misleading
                families. Try selecting another hospital hub or check district referral centers.
              </p>
              <button
                onClick={() => {
                  setSelectedSpecialty('BLOOD');
                  setSelectedLetter('O');
                  setSelectedSign('-');
                  setMobilePincode('492099');
                }}
                className="btn-mobile-reset"
              >
                Reset to AIIMS Raipur Corridor
              </button>
            </div>
          ) : (
            mobileResults.map(({ beacon, distanceKm, etaMins, remainingSeconds }) => {
              const itemDef = AVAILABLE_ITEM_CODES.find((i) => i.code === beacon.attributes.itemCode);
              const isUrgent = beacon.attributes.unitsAvailable <= 3 || beacon.attributes.itemCode.includes('NEGATIVE');

              return (
                <div key={beacon.key} className="mobile-result-card">
                  {/* Top Bar: Hospital & Distance */}
                  <div className="card-top-row">
                    <div className="hospital-avatar">
                      <Hospital size={18} />
                    </div>
                    <div className="hospital-details">
                      <strong className="hospital-name">{beacon.payload.facilityName}</strong>
                      <div className="distance-eta-row">
                        <span className="loc-km">📍 {distanceKm} kms</span>
                        <span className="dot-sep">•</span>
                        <span className="loc-eta">⏱️ ~{etaMins} mins drive</span>
                        {beacon.attributes.isEmergency24x7 === 'YES' && (
                          <>
                            <span className="dot-sep">•</span>
                            <span className="twentyfour-tag">24x7 ICU</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isUrgent && <span className="urgent-badge">Urgent</span>}
                  </div>

                  {/* Stock count and supply label */}
                  <div className="supply-stock-row">
                    <div>
                      <span className="supply-tag-label">
                        {itemDef ? itemDef.label : beacon.attributes.itemCode}
                      </span>
                      <span className="address-snippet">{beacon.payload.address}</span>
                    </div>

                    <div className="units-count-pill">
                      <span className="num">{beacon.attributes.unitsAvailable}</span>
                      <span className="lbl">{itemDef?.unitName || 'Units'}</span>
                    </div>
                  </div>

                  {/* Arkiv TTL & Price line */}
                  <div className="arkiv-meta-line">
                    <span className="ttl-pill">
                      <Clock size={11} /> Auto-purges in {formatCountdown(remainingSeconds)}
                    </span>
                    {beacon.attributes.priceInr === '0.00' ? (
                      <span className="free-badge">Govt Free Supply</span>
                    ) : (
                      <span className="subsidized-badge">Jan Aushadhi ₹{beacon.attributes.priceInr}</span>
                    )}
                  </div>

                  {/* Big Call Button & Proof */}
                  <div className="mobile-action-buttons">
                    <a
                      href={`tel:${beacon.payload.contactDesk}`}
                      onClick={() => {
                        setCallingBeacon(beacon);
                        if (soundEnabled) playEmergencyChimeSound();
                      }}
                      className="btn-mobile-call"
                    >
                      <PhoneCall size={16} />
                      <span>CALL 24x7 DESK NOW</span>
                    </a>

                    <button
                      onClick={() => onInspectProof(beacon)}
                      className="btn-mobile-proof"
                      title="View Arkiv Keccak-MPT Inclusion Proof"
                    >
                      <ShieldCheck size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Emergency Call Quick Modal for Mobile */}
        {callingBeacon && (
          <div className="mobile-modal-backdrop" onClick={() => setCallingBeacon(null)}>
            <div className="mobile-modal-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-handle" />
              <div className="sheet-header">
                <h4>Direct Hospital Desk Hotline</h4>
                <p>{callingBeacon.payload.facilityName}</p>
              </div>

              <div className="sheet-body">
                <span className="desk-caption">24x7 Emergency Contact Line</span>
                <a href={`tel:${callingBeacon.payload.contactDesk}`} className="sheet-phone-number">
                  {callingBeacon.payload.contactDesk}
                </a>

                <div className="sheet-stock-alert">
                  <strong>Stock Reserved for Immediate Dispatch:</strong>
                  <span>
                    {callingBeacon.attributes.unitsAvailable} Units of {callingBeacon.attributes.itemCode}
                  </span>
                </div>
              </div>

              <div className="sheet-footer">
                <button
                  onClick={() => handleCopy(callingBeacon.payload.contactDesk)}
                  className="btn-sheet-copy"
                >
                  {copiedDesk ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedDesk ? 'Copied' : 'Copy Number'}</span>
                </button>
                <a
                  href={`tel:${callingBeacon.payload.contactDesk}`}
                  className="btn-sheet-dial"
                  onClick={() => setCallingBeacon(null)}
                >
                  <PhoneCall size={16} />
                  <span>Call Hospital Desk</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Mobile App Bottom Tab Bar (matching BloodConnect+ screenshot) */}
        <div className="mobile-bottom-tabs">
          <button className="tab-item active">
            <Droplet size={18} />
            <span>Emergency</span>
          </button>
          <button onClick={onNavigateToHospitalPortal} className="tab-item">
            <Hospital size={18} />
            <span>Hospital</span>
          </button>
          <button
            onClick={() => {
              if (mobileResults.length > 0) onInspectProof(mobileResults[0].beacon);
            }}
            className="tab-item"
          >
            <ShieldCheck size={18} />
            <span>Proofs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
