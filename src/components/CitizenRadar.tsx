'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Search,
  MapPin,
  Clock,
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Flame,
  Zap,
  Filter,
  Droplet,
  HeartPulse,
} from 'lucide-react';
import { BeaconCategory, MedicalBeacon } from '@/types/beacon';
import { AVAILABLE_ITEM_CODES, PINCODE_COORDINATES, calculatePincodeDistance } from '@/data/seedData';
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

  // Sync beacons from beaconStore
  useEffect(() => {
    setBeacons(beaconStore.getBeacons());
    const unsubscribe = beaconStore.subscribe(() => {
      setBeacons(beaconStore.getBeacons());
    });
    return unsubscribe;
  }, []);

  // Timer loop for countdown and radar pings
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

  // Compute filtered search results
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
    <div className="clean-radar-root">
      {/* 1. Hero Section matching user design reference */}
      <section className="clean-hero-section">
        <div className="clean-hero-container">
          {/* Left Text & CTA */}
          <div className="clean-hero-content">
            <h1 className="clean-hero-headline">
              Donate your Blood <br />
              <span className="clean-headline-dark">for saving life</span>
            </h1>

            <p className="clean-hero-desc">
              Sanjeevani Pulse runs on the <strong>Arkiv DB-Chain</strong>. Certified blood banks, Jan Aushadhi
              stores, and trauma centers broadcast time-scoped medical availability with protocol-enforced{' '}
              <strong>4-hour auto-expiration</strong> so families never chase phantom stock.
            </p>

            <div className="clean-hero-cta-row">
              <button onClick={onNavigateToHospitalPortal} className="clean-btn-dark">
                DONATE / BROADCAST NOW
              </button>
              <button
                onClick={() => {
                  setSelectedCategory('BLOOD');
                  setSelectedItemCode('O_NEGATIVE');
                }}
                className="clean-btn-outline"
              >
                Find O-Negative Blood
              </button>
            </div>

            <div className="clean-hero-metrics">
              <div className="clean-metric-item">
                <span className="metric-num">4 Hours</span>
                <span className="metric-label">Arkiv DB Auto-Purge</span>
              </div>
              <div className="clean-metric-divider" />
              <div className="clean-metric-item">
                <span className="metric-num">100%</span>
                <span className="metric-label">Censorship Resistant</span>
              </div>
              <div className="clean-metric-divider" />
              <div className="clean-metric-item">
                <span className="metric-num">0%</span>
                <span className="metric-label">Phantom Stock</span>
              </div>
            </div>
          </div>

          {/* Right Hero Illustration */}
          <div className="clean-hero-image-wrap">
            <div className="clean-image-frame">
              <Image
                src="/images/blood_donation_hero.jpg"
                alt="Blood donation medical clinic illustration"
                width={560}
                height={420}
                priority
                className="clean-hero-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Floating Search Bar Card (Matching Reference Screenshot) */}
      <section className="clean-search-bar-section">
        <div className="clean-floating-search-bar">
          <div className="search-field-location">
            <MapPin size={18} className="search-field-icon" />
            <input
              type="text"
              maxLength={6}
              placeholder="Search Location (PIN Code e.g. 492099)"
              value={pincodeInput}
              onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
              className="clean-search-input"
            />
            {userPincode && (
              <span className="search-pin-active-pill">
                <Check size={12} /> PIN Active
              </span>
            )}
          </div>

          <div className="search-divider" />

          <div className="search-field-group">
            <Droplet size={18} className="search-field-icon red-icon" />
            <select
              value={selectedItemCode}
              onChange={(e) => setSelectedItemCode(e.target.value)}
              className="clean-search-select"
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
          </div>

          <button
            onClick={() => {
              if (soundEnabled) playRadarPingSound();
            }}
            className="clean-btn-search"
          >
            Find Donor / Stock
          </button>
        </div>

        {/* Quick Location Pills */}
        <div className="clean-quick-pins">
          <span className="clean-quick-label">Quick Hubs:</span>
          {[
            { code: '492099', label: 'AIIMS Raipur' },
            { code: '495001', label: 'Bilaspur CIMS' },
            { code: '492001', label: 'Katora Talab' },
            { code: '400012', label: 'KEM Mumbai' },
            { code: '110029', label: 'Safdarjung Delhi' },
          ].map((pin) => (
            <button
              key={pin.code}
              onClick={() => setPincodeInput(pin.code)}
              className={`clean-pin-chip ${pincodeInput === pin.code ? 'active' : ''}`}
            >
              {pin.label} ({pin.code})
            </button>
          ))}
        </div>
      </section>

      {/* 3. Section 2 matching screenshot: Lab Illustration + Circular Blood Groups */}
      <section className="clean-lab-circles-section">
        <div className="clean-lab-grid">
          {/* Left Lab Image */}
          <div className="clean-lab-image-col">
            <div className="clean-lab-img-frame">
              <Image
                src="/images/blood_lab_testing.jpg"
                alt="Medical laboratory testing blood tubes with microscope"
                width={480}
                height={480}
                className="clean-lab-img"
              />
            </div>
          </div>

          {/* Right Blood Group Circles (Matching Screenshot Design!) */}
          <div className="clean-circles-col">
            <div className="circles-headline-wrap">
              <span className="circles-subtitle">SELECT BLOOD GROUP RADAR</span>
              <h2 className="circles-title">Real-Time Blood Availability by Group</h2>
              <p className="circles-desc">
                Select any blood group below to instantly scan certified blood bank vaults on Arkiv
                DB-Chain. Active beacons update automatically.
              </p>
            </div>

            {/* Circular Neumorphic Pills */}
            <div className="clean-blood-circles-grid">
              {bloodGroupCircles.map((bg) => {
                const isSelected = selectedItemCode === bg.code;
                return (
                  <button
                    key={bg.label}
                    onClick={() => handleBloodGroupClick(bg.code)}
                    className={`clean-circle-pill ${isSelected ? 'active-circle' : ''}`}
                  >
                    <span className="circle-text">{bg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Other Critical Categories Buttons */}
            <div className="clean-other-categories-row">
              <button
                onClick={() => {
                  setSelectedCategory('ANTI_VENOM');
                  setSelectedItemCode('SNAKE_POLYVALENT');
                  if (soundEnabled) playRadarPingSound();
                }}
                className={`clean-alt-cat-btn ${selectedCategory === 'ANTI_VENOM' ? 'active' : ''}`}
              >
                🐍 Snake Anti-Venom
              </button>
              <button
                onClick={() => {
                  setSelectedCategory('RABIES_VACCINE');
                  setSelectedItemCode('RABIES_IMMUNOGLOBULIN');
                  if (soundEnabled) playRadarPingSound();
                }}
                className={`clean-alt-cat-btn ${selectedCategory === 'RABIES_VACCINE' ? 'active' : ''}`}
              >
                💉 Rabies Immunoglobulin
              </button>
              <button
                onClick={() => {
                  setSelectedCategory('JAN_AUSHADHI');
                  setSelectedItemCode('ALL');
                  if (soundEnabled) playRadarPingSound();
                }}
                className={`clean-alt-cat-btn ${selectedCategory === 'JAN_AUSHADHI' ? 'active' : ''}`}
              >
                💊 Jan Aushadhi Medicines
              </button>
            </div>

            <div className="clean-tips-btn-row">
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedItemCode('ALL');
                }}
                className="clean-btn-secondary"
              >
                Reset All Filters ({beacons.length} Active Listings)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Arkiv DB-Chain Query Bar */}
      <div className="clean-query-bar">
        <div className="clean-query-left">
          <span className="clean-query-tag">ARKIV_QUERY JSON-RPC</span>
          <code className="clean-query-string">
            type = str('medical_beacon') AND unitsAvailable &gt; i32(0)
            {selectedCategory !== 'ALL' ? ` AND category = str('${selectedCategory}')` : ''}
            {userPincode ? ` AND pincode = i32(${userPincode})` : ''}
          </code>
        </div>
        <div className="clean-query-right">
          <span className="clean-rpc-speed">
            <Zap size={14} /> 74ms Direct RPC (Zero Subgraph)
          </span>
          <span className="clean-results-count">
            {searchResults.length} Verified Available
          </span>
        </div>
      </div>

      {/* 5. Live Results Cards */}
      <section className="clean-results-section">
        {searchResults.length === 0 ? (
          <div className="clean-empty-box">
            <AlertTriangle size={42} className="empty-icon" />
            <h3>No Live Stock Matches Active Filters</h3>
            <p>
              Either no facility in this radius has published active stock, or existing listings have{' '}
              <strong>auto-expired at protocol level</strong> to protect families from phantom inventory.
            </p>
            <div className="empty-actions">
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedItemCode('ALL');
                  setMaxDistance(1500);
                  setEmergencyOnly(false);
                }}
                className="clean-btn-dark"
              >
                Clear Filters &amp; Expand Radius
              </button>
              <button onClick={onNavigateToHospitalPortal} className="clean-btn-secondary">
                Broadcast From Hospital Portal
              </button>
            </div>
          </div>
        ) : (
          <div className="clean-cards-grid">
            {searchResults.map(({ beacon, distanceKm, remainingSeconds }) => {
              const itemDef = AVAILABLE_ITEM_CODES.find((i) => i.code === beacon.attributes.itemCode);
              const isRare =
                beacon.attributes.itemCode.includes('NEGATIVE') ||
                beacon.attributes.itemCode.includes('BOMBAY');
              const ttlPercent = Math.min(100, Math.max(0, (remainingSeconds / 14400) * 100));

              return (
                <article key={beacon.key} className={`clean-card ${isRare ? 'card-rare-highlight' : ''}`}>
                  {/* Card Header */}
                  <div className="clean-card-header">
                    <div className="clean-card-badge-wrap">
                      <span className={`clean-cat-pill cat-${beacon.attributes.category.toLowerCase()}`}>
                        {beacon.attributes.category.replace('_', ' ')}
                      </span>
                    </div>

                    <div
                      className={`clean-countdown-badge ${
                        remainingSeconds < 3600 ? 'expiring' : 'healthy'
                      }`}
                      title="Protocol auto-purges listing when countdown hits zero"
                    >
                      <Clock size={13} />
                      <span>Purges in {formatCountdown(remainingSeconds)}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="clean-card-body">
                    <h3 className="clean-supply-title">
                      {itemDef ? itemDef.label : beacon.attributes.itemCode}
                    </h3>

                    <div className="clean-price-row">
                      {beacon.attributes.priceInr === '0.00' ? (
                        <span className="clean-price-pill free">Govt Free Supply</span>
                      ) : (
                        <span className="clean-price-pill subsidized">
                          Jan Aushadhi MRP: ₹{beacon.attributes.priceInr}
                        </span>
                      )}
                      {distanceKm !== undefined && (
                        <span className="clean-distance-tag">
                          <MapPin size={12} /> {distanceKm} km away
                        </span>
                      )}
                    </div>

                    {/* Available Units Highlight */}
                    <div className="clean-stock-box">
                      <div className="clean-stock-number">
                        <span className="stock-big-num">{beacon.attributes.unitsAvailable}</span>
                        <span className="stock-unit-label">{itemDef?.unitName || 'Units'} Available</span>
                      </div>
                      <div className="clean-status-tag">
                        {isRare ? (
                          <span className="status-critical">
                            <Flame size={12} /> CRITICAL RARE
                          </span>
                        ) : (
                          <span className="status-verified">
                            <Check size={12} /> VERIFIED IN STOCK
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Facility Address */}
                    <div className="clean-facility-info">
                      <strong className="facility-title">{beacon.payload.facilityName}</strong>
                      <p className="facility-addr">{beacon.payload.address}</p>
                      <div className="facility-chips">
                        <span className="chip">PIN: {beacon.attributes.pincode}</span>
                        <span className="chip">Hours: {beacon.payload.operatingHours || '24x7'}</span>
                      </div>
                    </div>

                    {/* TTL Bar */}
                    <div className="clean-ttl-wrap">
                      <div className="clean-ttl-header">
                        <span>Arkiv Lease Validity</span>
                        <span>{Math.round(ttlPercent)}% time remaining</span>
                      </div>
                      <div className="clean-ttl-bar">
                        <div
                          className={`clean-ttl-fill ${
                            ttlPercent < 25 ? 'fill-red' : ttlPercent < 60 ? 'fill-amber' : 'fill-green'
                          }`}
                          style={{ width: `${ttlPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="clean-card-footer">
                    <button
                      onClick={() => {
                        setCallingBeacon(beacon);
                        if (soundEnabled) playEmergencyChimeSound();
                      }}
                      className="clean-btn-call"
                    >
                      <PhoneCall size={16} />
                      <span>Contact Desk</span>
                    </button>

                    <button
                      onClick={() => onInspectProof(beacon)}
                      className="clean-btn-inspect"
                      title="Inspect Keccak-MPT Inclusion Proof on Arkiv"
                    >
                      <ShieldCheck size={16} />
                      <span>Proof</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Emergency Call Modal */}
      {callingBeacon && (
        <div className="clean-modal-backdrop" onClick={() => setCallingBeacon(null)}>
          <div className="clean-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="clean-modal-header">
              <div className="modal-title-row">
                <PhoneCall size={20} className="modal-phone-icon" />
                <h3>Hospital Emergency Desk Direct Line</h3>
              </div>
              <button onClick={() => setCallingBeacon(null)} className="clean-modal-close">
                ✕
              </button>
            </div>

            <div className="clean-modal-body">
              <h4>{callingBeacon.payload.facilityName}</h4>
              <p className="modal-facility-addr">{callingBeacon.payload.address}</p>

              <div className="clean-call-number-box">
                <span className="call-label">Casualty / Blood Bank Hotline</span>
                <a href={`tel:${callingBeacon.payload.contactDesk}`} className="call-big-phone">
                  {callingBeacon.payload.contactDesk}
                </a>
              </div>

              <div className="modal-supply-summary">
                <span>Requested Item:</span>
                <strong>
                  {callingBeacon.attributes.unitsAvailable} Units of {callingBeacon.attributes.itemCode}
                </strong>
              </div>

              <div className="clean-modal-notice">
                <AlertTriangle size={15} />
                <p>
                  Zero personal health information is stored. This phone number connects directly to
                  the hospital institutional casualty desk.
                </p>
              </div>
            </div>

            <div className="clean-modal-footer">
              <button
                onClick={() => handleCopy(callingBeacon.payload.contactDesk, 'modal-desk')}
                className="clean-btn-secondary"
              >
                {copiedKey === 'modal-desk' ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiedKey === 'modal-desk' ? 'Copied' : 'Copy Number'}</span>
              </button>
              <a
                href={`tel:${callingBeacon.payload.contactDesk}`}
                className="clean-btn-dark"
                onClick={() => setCallingBeacon(null)}
              >
                <PhoneCall size={15} />
                <span>Dial Immediately</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
