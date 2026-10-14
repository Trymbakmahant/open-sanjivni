'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Hospital,
  PlusCircle,
  Clock,
  MinusCircle,
  RefreshCw,
  Trash2,
  Check,
  AlertCircle,
  Radio,
  ExternalLink,
  ShieldAlert,
  Flame,
  Activity,
  History,
  Send,
} from 'lucide-react';
import { FacilityPreset, BeaconCategory, MedicalBeacon, BroadcastStockParams } from '@/types/beacon';
import { INDIAN_FACILITIES, AVAILABLE_ITEM_CODES } from '@/data/seedData';
import { beaconStore, ArkivAuditLog } from '@/lib/beaconStore';
import { broadcastMedicalStock } from '@/services/broadcastStock';
import { dispenseUnits, extendStockBeacon, deleteStockBeacon } from '@/services/manageStock';
import { ARKIV_CONFIG } from '@/lib/arkiv';
import { playEmergencyChimeSound } from '@/lib/audioAlert';

interface HospitalPortalProps {
  soundEnabled: boolean;
  onInspectProof: (beacon: MedicalBeacon) => void;
}

export function HospitalPortal({ soundEnabled, onInspectProof }: HospitalPortalProps) {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('aiims-raipur');
  const [beacons, setBeacons] = useState<MedicalBeacon[]>([]);
  const [auditLogs, setAuditLogs] = useState<ArkivAuditLog[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // Form state
  const [formCategory, setFormCategory] = useState<BeaconCategory>('BLOOD');
  const [formItemCode, setFormItemCode] = useState<string>('O_NEGATIVE');
  const [formUnits, setFormUnits] = useState<number>(4);
  const [formPrice, setFormPrice] = useState<string>('0.00');
  const [formNotes, setFormNotes] = useState<string>(
    'Emergency ICU cases prioritized. Immediate crossmatch desk active.'
  );

  const currentFacility = useMemo(() => {
    return (
      INDIAN_FACILITIES.find((f) => f.id === selectedFacilityId) || INDIAN_FACILITIES[0]
    );
  }, [selectedFacilityId]);

  // Sync beacons and logs
  useEffect(() => {
    setBeacons(beaconStore.getBeacons());
    setAuditLogs(beaconStore.getAuditLogs());

    const unsubscribe = beaconStore.subscribe(() => {
      setBeacons(beaconStore.getBeacons());
      setAuditLogs(beaconStore.getAuditLogs());
    });
    return unsubscribe;
  }, []);

  // Update default items when category changes
  useEffect(() => {
    const items = AVAILABLE_ITEM_CODES.filter((i) => i.category === formCategory);
    if (items.length > 0) {
      setFormItemCode(items[0].code);
      if (formCategory === 'BLOOD' || formCategory === 'ANTI_VENOM') {
        setFormPrice('0.00');
      } else if (formCategory === 'JAN_AUSHADHI') {
        setFormPrice('14.50');
      }
    }
  }, [formCategory]);

  // Filter beacons for current facility
  const facilityBeacons = useMemo(() => {
    return beacons.filter(
      (b) =>
        b.payload.facilityName.toLowerCase().includes(currentFacility.facilityName.slice(0, 10).toLowerCase()) ||
        b.owner.toLowerCase() === currentFacility.walletAddress.toLowerCase()
    );
  }, [beacons, currentFacility]);

  // Handle broadcast
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);
    setBroadcastSuccess(null);

    try {
      const params: BroadcastStockParams = {
        facilityName: currentFacility.facilityName,
        contactDesk: currentFacility.contactDesk,
        address: currentFacility.address,
        licenseNumber: currentFacility.licenseNumber,
        category: formCategory,
        itemCode: formItemCode,
        pincode: currentFacility.pincode,
        districtCode: currentFacility.districtCode,
        unitsAvailable: formUnits,
        priceInr: formPrice,
        notes: formNotes,
        isEmergency24x7: true,
      };

      const result = await broadcastMedicalStock(null, params, currentFacility.walletAddress);
      if (result.success) {
        setBroadcastSuccess(
          `Beacon created on Arkiv DB-Chain! Entity Key: ${result.entityKey.slice(0, 14)}...`
        );
        if (soundEnabled) playEmergencyChimeSound();
        setTimeout(() => setBroadcastSuccess(null), 5000);
      }
    } catch (err: any) {
      alert(`Broadcast error: ${err?.message || err}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDispense = async (beacon: MedicalBeacon) => {
    try {
      await dispenseUnits(null, beacon.key, beacon.attributes.unitsAvailable);
      if (soundEnabled) playEmergencyChimeSound();
    } catch (e: any) {
      console.error('Dispense failed', e);
    }
  };

  const handleExtend = async (beacon: MedicalBeacon) => {
    try {
      await extendStockBeacon(null, beacon.key);
      alert('Beacon lease extended by +4 Hours (+7,200 blocks) on Arkiv DB-Chain!');
    } catch (e: any) {
      console.error('Extend failed', e);
    }
  };

  const handleDelete = async (beacon: MedicalBeacon) => {
    if (confirm('Execute emergency recall for this listing? It will immediately purge from Arkiv.')) {
      try {
        await deleteStockBeacon(null, beacon.key);
      } catch (e: any) {
        console.error('Delete failed', e);
      }
    }
  };

  return (
    <div className="portal-root">
      {/* Top Banner */}
      <section className="portal-header-card">
        <div className="portal-header-left">
          <div className="portal-title-row">
            <Hospital className="portal-icon" size={28} />
            <div>
              <h2>Hospital & Jan Aushadhi Verified Desk Portal</h2>
              <p>
                Broadcast, dispense, and extend time-scoped inventory directly from verified medical
                wallets to the Arkiv DB-Chain.
              </p>
            </div>
          </div>
        </div>

        {/* Facility Selector */}
        <div className="facility-selector-box">
          <label htmlFor="facility-dropdown" className="selector-label">
            Switch Facility Desk:
          </label>
          <select
            id="facility-dropdown"
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="facility-dropdown"
          >
            {INDIAN_FACILITIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.facilityName} ({f.districtCode} - PIN {f.pincode})
              </option>
            ))}
          </select>
          <div className="facility-wallet-pill">
            <span className="wallet-dot" />
            <span className="wallet-addr">{currentFacility.walletAddress}</span>
          </div>
        </div>
      </section>

      {/* Grid: Broadcast Form & Active Beacons */}
      <div className="portal-layout-grid">
        {/* Left: Broadcast Form */}
        <div className="portal-column">
          <div className="card-box">
            <div className="card-box-header">
              <div className="card-box-title">
                <PlusCircle size={20} className="title-icon" />
                <h3>1-Click Broadcast Medical Beacon</h3>
              </div>
              <span className="arkiv-pill">createEntity()</span>
            </div>

            <p className="card-box-desc">
              Publishes real-time supply availability to Arkiv DB-Chain. Listings are signed with{' '}
              <strong>ExpirationTime.fromHours(4)</strong> to mathematically eliminate phantom
              stock.
            </p>

            {broadcastSuccess && (
              <div className="alert-success-banner">
                <Check size={18} />
                <span>{broadcastSuccess}</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="broadcast-form">
              {/* Category */}
              <div className="form-field">
                <label className="form-label">Supply Category</label>
                <div className="category-choice-grid">
                  {(['BLOOD', 'ANTI_VENOM', 'RABIES_VACCINE', 'JAN_AUSHADHI'] as BeaconCategory[]).map(
                    (cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setFormCategory(cat)}
                        className={`cat-choice-btn ${formCategory === cat ? 'selected' : ''}`}
                      >
                        {cat === 'BLOOD' && '🩸 Blood Group'}
                        {cat === 'ANTI_VENOM' && '🐍 Anti-Venom'}
                        {cat === 'RABIES_VACCINE' && '💉 Rabies Vac'}
                        {cat === 'JAN_AUSHADHI' && '💊 Jan Aushadhi'}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Item Code */}
              <div className="form-field">
                <label htmlFor="form-item-code" className="form-label">
                  Specific Item
                </label>
                <select
                  id="form-item-code"
                  value={formItemCode}
                  onChange={(e) => setFormItemCode(e.target.value)}
                  className="form-input"
                >
                  {AVAILABLE_ITEM_CODES.filter((i) => i.category === formCategory).map((i) => (
                    <option key={i.code} value={i.code}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Units & Price */}
              <div className="form-row-two">
                <div className="form-field">
                  <label htmlFor="form-units" className="form-label">
                    Units Available
                  </label>
                  <input
                    id="form-units"
                    type="number"
                    min={1}
                    max={500}
                    value={formUnits}
                    onChange={(e) => setFormUnits(Number(e.target.value))}
                    className="form-input"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="form-price" className="form-label">
                    Price (INR)
                  </label>
                  <input
                    id="form-price"
                    type="text"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Emergency Notes */}
              <div className="form-field">
                <label htmlFor="form-notes" className="form-label">
                  Desk Priority & Notes (No PHI)
                </label>
                <textarea
                  id="form-notes"
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="form-input"
                  placeholder="e.g. ICU admissions prioritized. Replacement donor encouraged."
                />
              </div>

              {/* Expiration Notice */}
              <div className="expiration-guarantee-box">
                <Clock size={16} className="clock-icon" />
                <p>
                  <strong>Arkiv Protocol Guarantee:</strong> This listing will automatically expire
                  in <strong>4 Hours</strong> (block TTL) unless extended.
                </p>
              </div>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="btn-primary btn-submit-broadcast"
              >
                {isBroadcasting ? (
                  <>
                    <RefreshCw className="spinning-icon" size={18} />
                    <span>Signing Transaction on Arkiv...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Broadcast Beacon to DB-Chain</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Active Beacons & Audit Log */}
        <div className="portal-column">
          {/* Active Beacons for Facility */}
          <div className="card-box">
            <div className="card-box-header">
              <div className="card-box-title">
                <Activity size={20} className="title-icon" />
                <h3>Active Facility Beacons ({facilityBeacons.length})</h3>
              </div>
              <span className="live-tag">Live State</span>
            </div>

            {facilityBeacons.length === 0 ? (
              <div className="no-beacons-notice">
                <AlertCircle size={32} />
                <p>No active beacons currently registered for {currentFacility.facilityName}.</p>
                <p className="subtext">Use the broadcast form on the left to publish live stock.</p>
              </div>
            ) : (
              <div className="facility-beacons-list">
                {facilityBeacons.map((beacon) => {
                  const isDepleted = beacon.attributes.status !== 'ACTIVE' || beacon.attributes.unitsAvailable <= 0;
                  const itemDef = AVAILABLE_ITEM_CODES.find((i) => i.code === beacon.attributes.itemCode);

                  return (
                    <div
                      key={beacon.key}
                      className={`facility-beacon-item ${isDepleted ? 'item-depleted' : ''}`}
                    >
                      <div className="item-meta-row">
                        <div>
                          <h4 className="item-title">
                            {itemDef ? itemDef.label : beacon.attributes.itemCode}
                          </h4>
                          <span className="item-key-sub">
                            Key: {beacon.key.slice(0, 16)}...
                          </span>
                        </div>
                        <div className="item-units-badge">
                          <span className="badge-count">{beacon.attributes.unitsAvailable}</span>
                          <span className="badge-unit">units left</span>
                        </div>
                      </div>

                      <div className="item-actions-row">
                        <button
                          onClick={() => handleDispense(beacon)}
                          disabled={beacon.attributes.unitsAvailable <= 0}
                          className="btn-action-dispense"
                          title="Dispense 1 Unit (-1 via patchEntity)"
                        >
                          <MinusCircle size={15} />
                          <span>Dispense Unit (-1)</span>
                        </button>

                        <button
                          onClick={() => handleExtend(beacon)}
                          className="btn-action-extend"
                          title="Extend TTL by 4 Hours (+4h via extendEntity)"
                        >
                          <RefreshCw size={15} />
                          <span>Extend (+4h)</span>
                        </button>

                        <button
                          onClick={() => handleDelete(beacon)}
                          className="btn-action-delete"
                          title="Emergency Recall / Deplete"
                        >
                          <Trash2 size={15} />
                          <span>Recall</span>
                        </button>

                        <button
                          onClick={() => onInspectProof(beacon)}
                          className="btn-action-proof"
                          title="Inspect Proof on Arkiv"
                        >
                          Proof
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Arkiv DB-Chain Audit Log Stream */}
          <div className="card-box audit-box">
            <div className="card-box-header">
              <div className="card-box-title">
                <History size={20} className="title-icon" />
                <h3>Arkiv DB-Chain Mutation Audit Stream</h3>
              </div>
              <span className="audit-pulse-pill">
                <span className="audit-dot" /> Live Events
              </span>
            </div>

            <div className="audit-events-stream">
              {auditLogs.slice(0, 8).map((log) => {
                const dateStr = new Date(log.timestamp).toLocaleTimeString();
                return (
                  <div key={log.id} className="audit-log-row">
                    <div className="log-action-tag">
                      <span className={`action-badge action-${log.action.toLowerCase()}`}>
                        {log.action}
                      </span>
                      <span className="log-time">{dateStr}</span>
                    </div>
                    <p className="log-summary">{log.summary}</p>
                    <div className="log-tx-row">
                      <span className="log-tx">TX: {log.txHash.slice(0, 18)}...</span>
                      <span className="log-block">Block #{log.blockNumber}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
