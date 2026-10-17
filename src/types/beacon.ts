export type BeaconCategory = 
  | 'BLOOD' 
  | 'ANTI_VENOM' 
  | 'RABIES_VACCINE' 
  | 'JAN_AUSHADHI';

export type BeaconStatus = 'ACTIVE' | 'DEPLETED' | 'EXPIRED';

export interface MedicalBeaconPayload {
  facilityName: string;
  contactDesk: string;
  address: string;
  licenseNumber?: string;
  operatingHours?: string;
  notes?: string;
  updatedAtIso?: string;
}

export interface MedicalBeaconAttributes {
  type: 'medical_beacon';
  category: BeaconCategory;
  itemCode: string;
  pincode: number;
  districtCode: string;
  unitsAvailable: number;
  priceInr: string;
  isEmergency24x7: 'YES' | 'NO';
  status: BeaconStatus;
}

export interface MedicalBeacon {
  key: string;
  owner: string;
  payload: MedicalBeaconPayload;
  attributes: MedicalBeaconAttributes;
  expiresAtBlock: number;
  expiresAtTimestamp: number; // Estimated wall-clock Unix ms
  createdAtTimestamp: number;
  blockNumber: number;
  txHash: string;
  stateRoot?: string;
  inclusionProof?: string;
}

export interface BroadcastStockParams {
  facilityName: string;
  contactDesk: string;
  address: string;
  licenseNumber?: string;
  operatingHours?: string;
  notes?: string;
  category: BeaconCategory;
  itemCode: string;
  pincode: number;
  districtCode: string;
  unitsAvailable: number;
  priceInr: string;
  isEmergency24x7?: boolean;
  ttlHours?: number;
}

export interface SearchFilterParams {
  category?: BeaconCategory | 'ALL';
  itemCode?: string;
  pincode?: number;
  maxDistanceKm?: number;
  districtCode?: string;
  emergencyOnly?: boolean;
}

export interface FacilityPreset {
  id: string;
  facilityName: string;
  contactDesk: string;
  address: string;
  pincode: number;
  districtCode: string;
  licenseNumber: string;
  walletAddress: `0x${string}`;
  category: BeaconCategory;
  badges: string[];
}
