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
  Activity,
  History,
  Send,
} from 'lucide-react';
import { FacilityPreset, BeaconCategory, MedicalBeacon, BroadcastStockParams } from '@/types/beacon';
import { INDIAN_FACILITIES, AVAILABLE_ITEM_CODES } from '@/data/seedData';
import { beaconStore, ArkivAuditLog } from '@/lib/beaconStore';
import { broadcastMedicalStock } from '@/services/broadcastStock';
import { dispenseUnits, extendStockBeacon, deleteStockBeacon } from '@/services/manageStock';
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
    <div className="space-y-8">
      {/* Top Banner Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Hospital size={26} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Hospital &amp; Jan Aushadhi Desk Portal</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Broadcast, dispense, and extend time-scoped inventory directly from verified medical wallets to Arkiv DB-Chain.
            </p>
          </div>
        </div>

        {/* Facility Selector */}
        <div className="w-full md:w-auto min-w-[280px] bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-1.5">
          <label htmlFor="facility-dropdown" className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Active Verified Desk
          </label>
          <select
            id="facility-dropdown"
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="w-full bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
          >
            {INDIAN_FACILITIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.facilityName} ({f.districtCode} - PIN {f.pincode})
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">{currentFacility.walletAddress}</span>
          </div>
        </div>
      </section>

      {/* Grid: Broadcast Form & Active Beacons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Broadcast Form */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PlusCircle size={20} className="text-rose-600" />
                <h3 className="font-extrabold text-lg text-slate-900">1-Click Broadcast Medical Beacon</h3>
              </div>
              <span className="bg-sky-50 text-sky-600 text-[10px] font-extrabold px-2.5 py-1 rounded font-mono">
                createEntity()
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Publishes live availability directly to the Arkiv DB engine. Signed with{' '}
              <strong className="text-slate-800">ExpirationTime.fromHours(4)</strong> to mathematically eliminate phantom stock.
            </p>

            {broadcastSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
                <Check size={16} />
                <span>{broadcastSuccess}</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Supply Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['BLOOD', 'ANTI_VENOM', 'RABIES_VACCINE', 'JAN_AUSHADHI'] as BeaconCategory[]).map(
                    (cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setFormCategory(cat)}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all ${
                          formCategory === cat
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
                        }`}
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
              <div className="space-y-1.5">
                <label htmlFor="form-item-code" className="text-xs font-extrabold text-slate-700">
                  Specific Item
                </label>
                <select
                  id="form-item-code"
                  value={formItemCode}
                  onChange={(e) => setFormItemCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  {AVAILABLE_ITEM_CODES.filter((i) => i.category === formCategory).map((i) => (
                    <option key={i.code} value={i.code}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Units & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="form-units" className="text-xs font-extrabold text-slate-700">
                    Units Available
                  </label>
                  <input
                    id="form-units"
                    type="number"
                    min={1}
                    max={500}
                    value={formUnits}
                    onChange={(e) => setFormUnits(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-extrabold text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="form-price" className="text-xs font-extrabold text-slate-700">
                    Price (INR)
                  </label>
                  <input
                    id="form-price"
                    type="text"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-extrabold text-slate-800 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label htmlFor="form-notes" className="text-xs font-extrabold text-slate-700">
                  Desk Priority &amp; Instructions (No PHI)
                </label>
                <textarea
                  id="form-notes"
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none resize-none"
                />
              </div>

              {/* Protocol Expiry Notice */}
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 flex items-center gap-2.5 text-xs text-sky-800 font-semibold">
                <Clock size={16} className="text-sky-600 shrink-0" />
                <span>Arkiv Protocol: Listing automatically vanishes in 4 Hours unless extended.</span>
              </div>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 tracking-wider transition-all"
              >
                {isBroadcasting ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Signing Transaction on Arkiv...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Broadcast Beacon to DB-Chain</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Active Beacons & Audit Log */}
        <div className="lg:col-span-7 space-y-8">
          {/* Active Beacons */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity size={20} className="text-rose-600" />
                <h3 className="font-extrabold text-lg text-slate-900">
                  Active Facility Beacons ({facilityBeacons.length})
                </h3>
              </div>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded">
                Live State
              </span>
            </div>

            {facilityBeacons.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-8 text-center space-y-2 border border-slate-100">
                <AlertCircle size={28} className="text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No active beacons registered for this desk.</p>
                <p className="text-[11px] text-slate-400">Use the broadcast form on the left to publish live stock.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {facilityBeacons.map((beacon) => {
                  const itemDef = AVAILABLE_ITEM_CODES.find((i) => i.code === beacon.attributes.itemCode);

                  return (
                    <div
                      key={beacon.key}
                      className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <strong className="block font-bold text-sm text-slate-900">
                          {itemDef ? itemDef.label : beacon.attributes.itemCode}
                        </strong>
                        <span className="block font-mono text-[10px] text-slate-400 truncate max-w-xs">
                          Key: {beacon.key}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xl font-black font-mono text-slate-900">
                            {beacon.attributes.unitsAvailable}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-bold">units left</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDispense(beacon)}
                            disabled={beacon.attributes.unitsAvailable <= 0}
                            className="bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 font-extrabold text-xs px-3 py-2 rounded-lg flex items-center gap-1 disabled:opacity-40"
                            title="Dispense 1 Unit (-1 via patchEntity)"
                          >
                            <MinusCircle size={14} />
                            <span>-1 Unit</span>
                          </button>

                          <button
                            onClick={() => handleExtend(beacon)}
                            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs px-2.5 py-2 rounded-lg"
                            title="Extend TTL by 4 Hours (+4h via extendEntity)"
                          >
                            <RefreshCw size={14} />
                          </button>

                          <button
                            onClick={() => handleDelete(beacon)}
                            className="bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 p-2 rounded-lg"
                            title="Recall / Purge"
                          >
                            <Trash2 size={14} />
                          </button>

                          <button
                            onClick={() => onInspectProof(beacon)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold text-xs px-2.5 py-2 rounded-lg"
                          >
                            Proof
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mutation Audit Stream */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <History size={20} className="text-slate-700" />
                <h3 className="font-extrabold text-lg text-slate-900">Arkiv DB-Chain Mutation Audit Stream</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-sky-600 bg-sky-50 px-2.5 py-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" /> Live Stream
              </span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {auditLogs.slice(0, 8).map((log) => {
                const dateStr = new Date(log.timestamp).toLocaleTimeString();
                return (
                  <div key={log.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200/60">
                        {log.action}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{dateStr}</span>
                    </div>
                    <p className="font-semibold text-slate-800">{log.summary}</p>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                      <span className="truncate max-w-[200px]">TX: {log.txHash}</span>
                      <span>Block #{log.blockNumber}</span>
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
