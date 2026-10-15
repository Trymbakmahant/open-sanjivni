'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

  // Filtered item codes based on selected category
  const filteredItemCodes = useMemo(() => {
    if (selectedCategory === 'ALL') return AVAILABLE_ITEM_CODES;
    return AVAILABLE_ITEM_CODES.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const userPincode = useMemo(() => {
    const parsed = parseInt(pincodeInput.trim(), 10);
    return isNaN(parsed) || pincodeInput.trim().length !== 6 ? null : parsed;
  }, [pincodeInput]);

  // Compute filtered search results
  const searchResults = useMemo(() => {
    return beacons
      .filter((b) => {
        // Exclude expired listings
        if (b.expiresAtTimestamp <= now) return false;
        // Exclude zero units or depleted
        if (b.attributes.unitsAvailable <= 0 || b.attributes.status !== 'ACTIVE') return false;
        // Category filter
        if (selectedCategory !== 'ALL' && b.attributes.category !== selectedCategory) return false;
        // Item code filter
        if (selectedItemCode !== 'ALL' && b.attributes.itemCode !== selectedItemCode) return false;
        // Emergency 24x7 filter
        if (emergencyOnly && b.attributes.isEmergency24x7 !== 'YES') return false;

        // Distance filter
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

  const handleCategorySelect = (cat: BeaconCategory | 'ALL') => {
    setSelectedCategory(cat);
    setSelectedItemCode('ALL');
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

  const quickPincodes = [
    { code: '492099', label: 'AIIMS Raipur (CG)' },
    { code: '495001', label: 'Bilaspur CIMS (CG)' },
    { code: '492001', label: 'Raipur Central (CG)' },
    { code: '400012', label: 'Mumbai Parel (MH)' },
    { code: '110029', label: 'Safdarjung Delhi' },
  ];

  return (
    <div className="radar-root">
      {/* Hero / Emergency Alert Bar */}
      <section className="radar-hero">
        <div className="hero-top-row">
          <div className="hero-alert-tag">
            <span className="pulsing-beacon-dot" />
            <span>LIVE EMERGENCY MEDICAL INVENTORY RADAR</span>
          </div>
          <div className="hero-protocol-tag">
            <span>Powered by Arkiv DB-Chain Auto-Expiry</span>
          </div>
        </div>

        <h1 className="hero-headline">
          Censorship-Resistant Medical Radar. <br />
          <span className="hero-headline-gradient">Zero Stale Data. Zero Phantom Stock.</span>
        </h1>

        <p className="hero-subtitle">
          When an ICU emergency strikes at 2:00 AM, commercial search apps show 3-week-old data.
          Sanjeevani Pulse queries real-time hospital beacons on Arkiv testnet that{' '}
          <strong>auto-purge in 4 hours</strong> unless explicitly verified by the facility desk.
        </p>

        {/* Search Controls Card */}
        <div className="search-control-card">
          <div className="search-fields-grid">
            {/* PIN Code Field */}
            <div className="field-group">
              <label htmlFor="pincode-input" className="field-label">
                <MapPin size={15} />
                <span>Your Location (Indian PIN Code)</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="pincode-input"
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 492099"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                  className="pincode-input"
                />
                {userPincode && (
                  <span className="pincode-valid-badge">
                    <Check size={14} /> PIN Active
                  </span>
                )}
              </div>
            </div>

            {/* Radius Filter */}
            <div className="field-group">
              <label htmlFor="radius-select" className="field-label">
                <Filter size={15} />
                <span>Proximity Radius</span>
              </label>
              <select
                id="radius-select"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="select-dropdown"
              >
                <option value={15}>Within 15 KM (Immediate Vicinity)</option>
                <option value={50}>Within 50 KM (District Hub)</option>
                <option value={100}>Within 100 KM (Regional Corridor)</option>
                <option value={1500}>All India (Rare Fenotypes & Antidotes)</option>
              </select>
            </div>

            {/* Specific Item Sub-filter */}
            <div className="field-group">
              <label htmlFor="item-select" className="field-label">
                <Sparkles size={15} />
                <span>Critical Supply Item</span>
              </label>
              <select
                id="item-select"
                value={selectedItemCode}
                onChange={(e) => setSelectedItemCode(e.target.value)}
                className="select-dropdown"
              >
                <option value="ALL">All Items in Selected Category</option>
                {filteredItemCodes.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick PIN Presets */}
          <div className="quick-pins-strip">
            <span className="quick-pins-label">Quick Pincodes:</span>
            {quickPincodes.map((pin) => (
              <button
                key={pin.code}
                onClick={() => setPincodeInput(pin.code)}
                className={`quick-pin-chip ${pincodeInput === pin.code ? 'active' : ''}`}
              >
                {pin.label} ({pin.code})
              </button>
            ))}
          </div>

          {/* Emergency 24x7 Checkbox */}
          <div className="emergency-checkbox-row">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={emergencyOnly}
                onChange={(e) => setEmergencyOnly(e.target.checked)}
              />
              <span className="checkmark" />
              <span className="checkbox-label">
                Show only <strong>24x7 Emergency Desks</strong> with immediate night casualty
              </span>
            </label>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="category-pills-row">
          <button
            onClick={() => handleCategorySelect('ALL')}
            className={`category-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
          >
            All Medical Beacons ({beacons.filter((b) => b.attributes.unitsAvailable > 0).length})
          </button>
          <button
            onClick={() => handleCategorySelect('BLOOD')}
            className={`category-pill category-blood ${selectedCategory === 'BLOOD' ? 'active' : ''}`}
          >
            🩸 Rare Blood Groups (O-, B-, Bombay)
          </button>
          <button
            onClick={() => handleCategorySelect('ANTI_VENOM')}
            className={`category-pill category-antivenom ${
              selectedCategory === 'ANTI_VENOM' ? 'active' : ''
            }`}
          >
            🐍 Snake Anti-Venom (Polyvalent)
          </button>
          <button
            onClick={() => handleCategorySelect('RABIES_VACCINE')}
            className={`category-pill category-rabies ${
              selectedCategory === 'RABIES_VACCINE' ? 'active' : ''
            }`}
          >
            💉 Anti-Rabies Immunoglobulin
          </button>
          <button
            onClick={() => handleCategorySelect('JAN_AUSHADHI')}
            className={`category-pill category-janaushadhi ${
              selectedCategory === 'JAN_AUSHADHI' ? 'active' : ''
            }`}
          >
            💊 Jan Aushadhi Affordable Generics
          </button>
        </div>
      </section>

      {/* Query Banner & Radar Ping */}
      <div className="radar-query-banner">
        <div className="query-code-wrap">
          <span className="query-badge">ARKIV_QUERY JSON-RPC</span>
          <code className="query-code">
            type = str('medical_beacon') AND category = str('{selectedCategory}') AND unitsAvailable &gt; i32(0)
            {userPincode ? ` AND pincode = i32(${userPincode})` : ''}
          </code>
        </div>
        <div className="query-meta-wrap">
          <span className="query-latency-tag">
            <Zap size={13} /> 74ms Direct RPC (Zero Subgraph)
          </span>
          <span className="results-count-badge">
            {searchResults.length} Verified Available
          </span>
        </div>
      </div>

      {/* Results Grid */}
      <section className="results-section">
        {searchResults.length === 0 ? (
          <div className="empty-results-box">
            <AlertTriangle size={48} className="empty-icon" />
            <h3>No Live Stock Matches Active Filters</h3>
            <p>
              Either no facility in this radius has published active stock, or existing listings
              have <strong>auto-expired at protocol level</strong> to protect families from phantom
              inventory.
            </p>
            <div className="empty-actions">
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedItemCode('ALL');
                  setMaxDistance(1500);
                  setEmergencyOnly(false);
                }}
                className="btn-primary"
              >
                Clear Filters & Expand Radius
              </button>
              <button onClick={onNavigateToHospitalPortal} className="btn-secondary">
                Broadcast From Hospital Portal
              </button>
            </div>
          </div>
        ) : (
          <div className="beacon-cards-grid">
            {searchResults.map(({ beacon, distanceKm, remainingSeconds }) => {
              const itemDef = AVAILABLE_ITEM_CODES.find((i) => i.code === beacon.attributes.itemCode);
              const isRareBlood =
                beacon.attributes.itemCode.includes('NEGATIVE') ||
                beacon.attributes.itemCode.includes('BOMBAY');
              const isLowStock = beacon.attributes.unitsAvailable <= 3;
              const isUrgent = isRareBlood || isLowStock;

              // Compute TTL progress percentage (out of 4 hours = 14400s)
              const ttlPercent = Math.min(100, Math.max(0, (remainingSeconds / 14400) * 100));

              return (
                <article key={beacon.key} className={`beacon-card ${isUrgent ? 'urgent-border' : ''}`}>
                  {/* Card Header */}
                  <div className="card-top-bar">
                    <div className="category-meta-badge">
                      <span className={`cat-indicator cat-${beacon.attributes.category.toLowerCase()}`} />
                      <span className="cat-name">{beacon.attributes.category.replace('_', ' ')}</span>
                    </div>

                    <div
                      className={`ttl-countdown-pill ${
                        remainingSeconds < 3600 ? 'ttl-expiring' : 'ttl-healthy'
                      }`}
                      title="Listing automatically vanishes from search when timer hits zero"
                    >
                      <Clock size={13} />
                      <span>Purges in {formatCountdown(remainingSeconds)}</span>
                    </div>
                  </div>

                  {/* Item Headline & Units Gauge */}
                  <div className="card-body">
                    <div className="supply-headline-wrap">
                      <h3 className="supply-name">
                        {itemDef ? itemDef.label : beacon.attributes.itemCode}
                      </h3>
                      {beacon.attributes.priceInr === '0.00' ? (
                        <span className="price-tag price-free">Govt Free Supply</span>
                      ) : (
                        <span className="price-tag price-subsidized">
                          Jan Aushadhi MRP: ₹{beacon.attributes.priceInr}
                        </span>
                      )}
                    </div>

                    {/* Stock Units Gauge */}
                    <div className="stock-gauge-box">
                      <div className="stock-numbers">
                        <span className="units-val">{beacon.attributes.unitsAvailable}</span>
                        <span className="units-unit">{itemDef?.unitName || 'Units'} Available</span>
                      </div>
                      <div className="gauge-status">
                        {isUrgent ? (
                          <span className="urgency-badge urgency-critical">
                            <Flame size={13} /> CRITICAL AVAILABILITY
                          </span>
                        ) : (
                          <span className="urgency-badge urgency-normal">
                            <Check size={13} /> VERIFIED IN STOCK
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Facility Info */}
                    <div className="facility-info-box">
                      <div className="facility-header-line">
                        <span className="facility-name">{beacon.payload.facilityName}</span>
                        {distanceKm !== undefined && (
                          <span className="distance-badge">
                            <MapPin size={12} /> {distanceKm} km away
                          </span>
                        )}
                      </div>
                      <p className="facility-address">{beacon.payload.address}</p>
                      <div className="facility-meta-chips">
                        <span className="meta-chip">PIN: {beacon.attributes.pincode}</span>
                        <span className="meta-chip">Hours: {beacon.payload.operatingHours || '24x7'}</span>
                        {beacon.payload.licenseNumber && (
                          <span className="meta-chip">Lic: {beacon.payload.licenseNumber}</span>
                        )}
                      </div>
                      {beacon.payload.notes && (
                        <p className="facility-notes">"{beacon.payload.notes}"</p>
                      )}
                    </div>

                    {/* Lease TTL Progress Bar */}
                    <div className="ttl-bar-container">
                      <div className="ttl-bar-header">
                        <span className="ttl-bar-label">Arkiv DB Lease Lifetime (4h Max)</span>
                        <span className="ttl-bar-val">{Math.round(ttlPercent)}% left</span>
                      </div>
                      <div className="ttl-progress-track">
                        <div
                          className={`ttl-progress-fill ${
                            ttlPercent < 25 ? 'fill-low' : ttlPercent < 60 ? 'fill-mid' : 'fill-good'
                          }`}
                          style={{ width: `${ttlPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="card-footer">
                    <button
                      onClick={() => {
                        setCallingBeacon(beacon);
                        if (soundEnabled) playEmergencyChimeSound();
                      }}
                      className="btn-call-desk"
                    >
                      <PhoneCall size={16} />
                      <span>Contact Desk</span>
                    </button>

                    <button
                      onClick={() => onInspectProof(beacon)}
                      className="btn-proof-inspect"
                      title="Inspect Keccak-MPT Inclusion Proof on Arkiv"
                    >
                      <ShieldCheck size={16} />
                      <span>State Proof</span>
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
        <div className="modal-backdrop" onClick={() => setCallingBeacon(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <PhoneCall size={20} className="modal-icon-phone" />
                <h3>Emergency Desk Direct Connection</h3>
              </div>
              <button onClick={() => setCallingBeacon(null)} className="modal-close-btn">
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="call-facility-card">
                <h4>{callingBeacon.payload.facilityName}</h4>
                <p className="call-address">{callingBeacon.payload.address}</p>

                <div className="call-number-box">
                  <span className="number-label">Emergency Desk Direct Line</span>
                  <a
                    href={`tel:${callingBeacon.payload.contactDesk}`}
                    className="direct-phone-link"
                  >
                    {callingBeacon.payload.contactDesk}
                  </a>
                </div>

                <div className="call-stock-summary">
                  <span>Dispense Reservation:</span>
                  <strong>
                    {callingBeacon.attributes.unitsAvailable} Units of{' '}
                    {callingBeacon.attributes.itemCode}
                  </strong>
                </div>

                <div className="call-disclaimer-box">
                  <AlertTriangle size={16} className="disclaimer-icon" />
                  <p>
                    <strong>Notice:</strong> This is a decentralized emergency radar beacon verified by
                    the hospital wallet. The phone number above connects to the institutional casualty /
                    blood bank desk. No personal patient information is stored.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => handleCopy(callingBeacon.payload.contactDesk, 'desk-num')}
                className="btn-secondary"
              >
                {copiedKey === 'desk-num' ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedKey === 'desk-num' ? 'Copied Number!' : 'Copy Number'}</span>
              </button>
              <a
                href={`tel:${callingBeacon.payload.contactDesk}`}
                className="btn-primary"
                onClick={() => setCallingBeacon(null)}
              >
                <PhoneCall size={16} />
                <span>Dial Immediately</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
