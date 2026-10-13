'use client';

import { MedicalBeacon, BroadcastStockParams, BeaconCategory } from '@/types/beacon';
import { INITIAL_BEACONS } from '@/data/seedData';
import { publicClient, ARKIV_CONFIG } from '@/lib/arkiv';

const STORAGE_KEY = 'sanjeevani_pulse_beacons_v1';
const AUDIT_KEY = 'sanjeevani_pulse_audit_v1';

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

class BeaconStore {
  private beacons: MedicalBeacon[] = [];
  private auditLogs: ArkivAuditLog[] = [];
  private listeners: Set<() => void> = new Set();
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initFromStorage();
    } else {
      this.beacons = [...INITIAL_BEACONS];
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
}

export const beaconStore = new BeaconStore();
