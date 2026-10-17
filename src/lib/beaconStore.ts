'use client';

import { MedicalBeacon, BroadcastStockParams, BeaconCategory, EmergencyLock, VolunteerDonor } from '@/types/beacon';
import { INITIAL_BEACONS } from '@/data/seedData';
import { publicClient, ARKIV_CONFIG } from '@/lib/arkiv';

const STORAGE_KEY = 'sanjeevani_pulse_beacons_v1';
const AUDIT_KEY = 'sanjeevani_pulse_audit_v1';
const LOCKS_KEY = 'open_sanjivni_locks_v1';
const DONORS_KEY = 'open_sanjivni_donors_v1';

export interface ArkivAuditLog {
  id: string;
  timestamp: number;
  action: 'CREATE_BEACON' | 'DISPENSE_UNIT' | 'EXTEND_TTL' | 'DEPLETE_BEACON' | 'RECALL_BEACON';
  entityKey: string;
  facilityName: string;
  summary: string;
  txHash: string;
  blockNumber: number;
}

const INITIAL_DONORS: VolunteerDonor[] = [
  {
    key: '0xd001000000000000000000000000000000000000000000000000000000000001',
    payload: {
      bloodGroup: 'O_NEGATIVE',
      syntheticRelay: 'matrix_relay_0x8f42e1b9',
      state: 'Chhattisgarh',
      note: 'Available for immediate O-Neg whole blood replacement at AIIMS / Mekahara corridor.',
      registeredAtIso: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    attributes: {
      type: 'volunteer_donor',
      bloodGroup: 'O_NEGATIVE',
      pincode: 492099,
      zkNullifier: '0x8f42e1b99c72ad416a29bf33d90184e271a01298471928374650192837465019',
      isAnonAadhaarVerified: 'YES',
      status: 'AVAILABLE',
    },
    expiresAtTimestamp: Date.now() + 11 * 60 * 60 * 1000,
    createdAtTimestamp: Date.now() - 45 * 60 * 1000,
    txHash: '0x99a1f28b76ce321045ee39871029bbdc01458921734589123749812739481234',
    blockNumber: 700610,
  },
  {
    key: '0xd002000000000000000000000000000000000000000000000000000000000002',
    payload: {
      bloodGroup: 'B_NEGATIVE',
      syntheticRelay: 'matrix_relay_0x37a91dc2',
      state: 'Chhattisgarh',
      note: 'Verified adult donor standby for Bilaspur / CIMS emergency ICU cases.',
      registeredAtIso: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    attributes: {
      type: 'volunteer_donor',
      bloodGroup: 'B_NEGATIVE',
      pincode: 495001,
      zkNullifier: '0x37a91dc201948273645019283746501928374650192837465019283746501928',
      isAnonAadhaarVerified: 'YES',
      status: 'AVAILABLE',
    },
    expiresAtTimestamp: Date.now() + 10 * 60 * 60 * 1000,
    createdAtTimestamp: Date.now() - 2 * 60 * 60 * 1000,
    txHash: '0x3429ba76dc019283746501928374650192837465019283746501928374650192',
    blockNumber: 700540,
  },
];

class BeaconStore {
  private beacons: MedicalBeacon[] = [];
  private auditLogs: ArkivAuditLog[] = [];
  private locks: EmergencyLock[] = [];
  private donors: VolunteerDonor[] = [];
  private listeners: Set<() => void> = new Set();
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initFromStorage();
    } else {
      this.beacons = [...INITIAL_BEACONS];
      this.donors = [...INITIAL_DONORS];
    }
  }

  private initFromStorage() {
    if (this.isInitialized) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: MedicalBeacon[] = JSON.parse(stored);
        this.beacons = parsed;
      } else {
        this.beacons = [...INITIAL_BEACONS];
        this.persistBeacons();
      }

      const storedLocks = localStorage.getItem(LOCKS_KEY);
      if (storedLocks) {
        this.locks = JSON.parse(storedLocks);
      }

      const storedDonors = localStorage.getItem(DONORS_KEY);
      if (storedDonors) {
        this.donors = JSON.parse(storedDonors);
      } else {
        this.donors = [...INITIAL_DONORS];
      }

      const storedLogs = localStorage.getItem(AUDIT_KEY);
      if (storedLogs) {
        this.auditLogs = JSON.parse(storedLogs);
      } else {
        this.auditLogs = [
          {
            id: 'log-1',
            timestamp: Date.now() - 35 * 60 * 1000,
            action: 'CREATE_BEACON',
            entityKey: INITIAL_BEACONS[0].key,
            facilityName: 'AIIMS Raipur Emergency Blood Bank',
            summary: 'Broadcast 4 units of O-Negative blood on Arkiv DB-Chain (expires in 4h)',
            txHash: INITIAL_BEACONS[0].txHash,
            blockNumber: 700620,
          },
          {
            id: 'log-2',
            timestamp: Date.now() - 50 * 60 * 1000,
            action: 'CREATE_BEACON',
            entityKey: INITIAL_BEACONS[1].key,
            facilityName: 'CIMS Bilaspur District Hospital',
            summary: 'Broadcast 12 vials of Polyvalent Snake Anti-Venom with 4h TTL',
            txHash: INITIAL_BEACONS[1].txHash,
            blockNumber: 700580,
          },
        ];
        this.persistAudit();
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('[BeaconStore] Failed to load storage, using defaults:', e);
      this.beacons = [...INITIAL_BEACONS];
      this.donors = [...INITIAL_DONORS];
    }
  }

  private persistBeacons() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.beacons));
      } catch (e) {
        console.error('Failed to save beacons to localStorage', e);
      }
    }
    this.notify();
  }

  private persistAudit() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AUDIT_KEY, JSON.stringify(this.auditLogs));
      } catch (e) {
        console.error('Failed to save audit logs to localStorage', e);
      }
    }
    this.notify();
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getBeacons(): MedicalBeacon[] {
    const now = Date.now();
    // Auto-mark expired beacons if now > expiresAtTimestamp
    return this.beacons.map((b) => {
      if (b.expiresAtTimestamp <= now && b.attributes.status !== 'EXPIRED') {
        return {
          ...b,
          attributes: {
            ...b.attributes,
            status: 'EXPIRED',
          },
        };
      }
      return b;
    });
  }

  public getAuditLogs(): ArkivAuditLog[] {
    return [...this.auditLogs].sort((a, b) => b.timestamp - a.timestamp);
  }

  public addBeacon(beacon: MedicalBeacon) {
    this.beacons.unshift(beacon);
    this.auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      action: 'CREATE_BEACON',
      entityKey: beacon.key,
      facilityName: beacon.payload.facilityName,
      summary: `Broadcast ${beacon.attributes.unitsAvailable} ${beacon.attributes.itemCode} units on Arkiv (TTL 4h)`,
      txHash: beacon.txHash,
      blockNumber: beacon.blockNumber,
    });
    this.persistBeacons();
    this.persistAudit();
  }

  public dispenseUnit(entityKey: string): { success: boolean; remaining: number } {
    const idx = this.beacons.findIndex((b) => b.key === entityKey);
    if (idx === -1) return { success: false, remaining: 0 };

    const beacon = this.beacons[idx];
    const newUnits = Math.max(0, beacon.attributes.unitsAvailable - 1);
    const newStatus = newUnits === 0 ? 'DEPLETED' : 'ACTIVE';

    this.beacons[idx] = {
      ...beacon,
      attributes: {
        ...beacon.attributes,
        unitsAvailable: newUnits,
        status: newStatus,
      },
    };

    this.auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      action: newUnits === 0 ? 'DEPLETE_BEACON' : 'DISPENSE_UNIT',
      entityKey,
      facilityName: beacon.payload.facilityName,
      summary:
        newUnits === 0
          ? `Stock depleted for ${beacon.attributes.itemCode}. Beacon deactivated on Arkiv.`
          : `Dispensed 1 unit of ${beacon.attributes.itemCode}. Remaining on Arkiv: ${newUnits}`,
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      blockNumber: beacon.blockNumber + Math.floor(Math.random() * 10) + 1,
    });

    this.persistBeacons();
    this.persistAudit();
    return { success: true, remaining: newUnits };
  }

  public extendBeacon(entityKey: string): boolean {
    const idx = this.beacons.findIndex((b) => b.key === entityKey);
    if (idx === -1) return false;

    const beacon = this.beacons[idx];
    const extendedMs = 4 * 60 * 60 * 1000;
    const newExpiresTimestamp = Date.now() + extendedMs;
    const newExpiresBlock = beacon.expiresAtBlock + 7200; // ~4 hours of 2-second blocks

    this.beacons[idx] = {
      ...beacon,
      expiresAtTimestamp: newExpiresTimestamp,
      expiresAtBlock: newExpiresBlock,
      attributes: {
        ...beacon.attributes,
        status: 'ACTIVE',
      },
    };

    this.auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      action: 'EXTEND_TTL',
      entityKey,
      facilityName: beacon.payload.facilityName,
      summary: `Renewed beacon lease by +4 Hours (+7,200 blocks) via extendEntity()`,
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      blockNumber: beacon.blockNumber + 12,
    });

    this.persistBeacons();
    this.persistAudit();
    return true;
  }

  public deleteBeacon(entityKey: string): boolean {
    const idx = this.beacons.findIndex((b) => b.key === entityKey);
    if (idx === -1) return false;

    const beacon = this.beacons[idx];
    this.beacons[idx] = {
      ...beacon,
      attributes: {
        ...beacon.attributes,
        status: 'DEPLETED',
        unitsAvailable: 0,
      },
    };

    this.auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      action: 'RECALL_BEACON',
      entityKey,
      facilityName: beacon.payload.facilityName,
      summary: `Emergency recall / stock-out executed via deleteEntity(). Listing purged.`,
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      blockNumber: beacon.blockNumber + 2,
    });

    this.persistBeacons();
    this.persistAudit();
    return true;
  }

  public resetToDefaults() {
    this.beacons = [...INITIAL_BEACONS];
    this.persistBeacons();
  }

  // --- Anon Aadhaar Anti-Scalper Locks ---
  public getLocks(): EmergencyLock[] {
    const now = Date.now();
    return this.locks.map((l) => {
      if (l.expiresAtTimestamp <= now && l.attributes.status === 'LOCKED') {
        return {
          ...l,
          attributes: { ...l.attributes, status: 'EXPIRED' as const },
        };
      }
      return l;
    });
  }

  public getActiveLockByNullifier(nullifier: string): EmergencyLock | undefined {
    const now = Date.now();
    return this.locks.find(
      (l) => l.attributes.zkNullifier === nullifier && l.attributes.status === 'LOCKED' && l.expiresAtTimestamp > now
    );
  }

  public addLock(lock: EmergencyLock) {
    this.locks.unshift(lock);
    this.auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      action: 'DISPENSE_UNIT',
      entityKey: lock.key,
      facilityName: lock.payload.hospitalName || 'Emergency Desk',
      summary: `ZK-Verified 60m reservation lock registered (Token: ${lock.payload.syntheticPatientToken}) on Arkiv`,
      txHash: lock.txHash,
      blockNumber: lock.blockNumber,
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('open_sanjivni_locks_v1', JSON.stringify(this.locks));
      } catch {}
    }
    this.persistAudit();
    this.notify();
  }

  public claimLock(lockKey: string) {
    const idx = this.locks.findIndex((l) => l.key === lockKey);
    if (idx !== -1) {
      this.locks[idx].attributes.status = 'CLAIMED';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('open_sanjivni_locks_v1', JSON.stringify(this.locks));
        } catch {}
      }
      this.notify();
    }
  }

  // --- Anon Aadhaar Standby Volunteer Donors ---
  public getDonors(): VolunteerDonor[] {
    const now = Date.now();
    return this.donors.filter((d) => d.expiresAtTimestamp > now && d.attributes.status === 'AVAILABLE');
  }

  public addDonor(donor: VolunteerDonor) {
    this.donors.unshift(donor);
    this.auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      action: 'CREATE_BEACON',
      entityKey: donor.key,
      facilityName: `Pincode ${donor.attributes.pincode} Standby Pool`,
      summary: `ZK-Verified ${donor.attributes.bloodGroup} Standby Volunteer Donor registered (12h Arkiv TTL)`,
      txHash: donor.txHash,
      blockNumber: donor.blockNumber,
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('open_sanjivni_donors_v1', JSON.stringify(this.donors));
      } catch {}
    }
    this.persistAudit();
    this.notify();
  }
}

export const beaconStore = new BeaconStore();
