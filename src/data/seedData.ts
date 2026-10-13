import { MedicalBeacon, FacilityPreset, BeaconCategory } from '@/types/beacon';

export const INDIAN_FACILITIES: FacilityPreset[] = [
  {
    id: 'aiims-raipur',
    facilityName: 'AIIMS Raipur Emergency Blood Bank & Trauma Desk',
    contactDesk: '+91-771-2578500',
    address: 'GE Road, Tatibandh, Raipur, Chhattisgarh',
    pincode: 492099,
    districtCode: 'RAIPUR',
    licenseNumber: 'CG-BB-2024-889',
    walletAddress: '0x71C83647a0D68b43ecf8e563A2f38c64C6c5079a',
    category: 'BLOOD',
    badges: ['Government Apex Institute', '24x7 Cryo-Storage', 'Component Separation Unit'],
  },
  {
    id: 'cims-bilaspur',
    facilityName: 'CIMS Bilaspur District Hospital & Anti-Venom Cell',
    contactDesk: '+91-7752-224150',
    address: 'Sardar Vallabhbhai Patel Hospital Road, Bilaspur, Chhattisgarh',
    pincode: 495001,
    districtCode: 'BILASPUR',
    licenseNumber: 'CG-HOSP-2023-412',
    walletAddress: '0x498a9668E2d87eA051C60f38b4A163778FeF7741',
    category: 'ANTI_VENOM',
    badges: ['Designated Snakebite Referral Hub', 'Govt Subsidized Anti-Venom'],
  },
  {
    id: 'jan-aushadhi-raipur',
    facilityName: 'Pradhan Mantri Bhartiya Janaushadhi Kendra #1042',
    contactDesk: '+91-98271-98740',
    address: 'Shop 14, Commercial Complex, Katora Talab, Raipur, Chhattisgarh',
    pincode: 492001,
    districtCode: 'RAIPUR',
    licenseNumber: 'PMBJP-CG-1042',
    walletAddress: '0x3A2B1D635F924e5A48F95328A1C52dC71B78988B',
    category: 'JAN_AUSHADHI',
    badges: ['Subsidized Generic MRP', 'Govt of India Certified PMBJP'],
  },
  {
    id: 'kem-mumbai',
    facilityName: 'KEM Hospital & Blood Bank Parel',
    contactDesk: '+91-22-24107000',
    address: 'Acharya Donde Marg, Parel, Mumbai, Maharashtra',
    pincode: 400012,
    districtCode: 'MUMBAI',
    licenseNumber: 'MH-BB-2022-108',
    walletAddress: '0x8b321F55e5C58A2B68625Bf49b1E83F00570b555',
    category: 'BLOOD',
    badges: ['Rare Bombay Phenotype Registry', '24x7 Trauma Blood Bank'],
  },
  {
    id: 'safdarjung-delhi',
    facilityName: 'Safdarjung Hospital Emergency Rabies & Vaccine Desk',
    contactDesk: '+91-11-26165060',
    address: 'Ring Road, Opposite AIIMS, New Delhi',
    pincode: 110029,
    districtCode: 'NEW_DELHI',
    licenseNumber: 'DL-HOSP-2021-004',
    walletAddress: '0x1C2F3E4D5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D',
    category: 'RABIES_VACCINE',
    badges: ['National Rabies Management Center', 'Zero Stockout Desk'],
  },
  {
    id: 'dr-bram-raipur',
    facilityName: 'Dr. BRAM Hospital & Pt. JNM Medical College Desk',
    contactDesk: '+91-771-2890001',
    address: 'Jail Road, Byron Bazar, Raipur, Chhattisgarh',
    pincode: 492001,
    districtCode: 'RAIPUR',
    licenseNumber: 'CG-BB-2023-112',
    walletAddress: '0x9E8D7C6B5A4F3E2D1C0B9A8F7E6D5C4B3A2F1E0D',
    category: 'BLOOD',
    badges: ['State Medical College Hub', 'Platelet Apheresis Unit'],
  },
];

export const AVAILABLE_ITEM_CODES = [
  // Blood
  { code: 'O_NEGATIVE', label: 'O-Negative (Universal Donor / Critical Rare)', category: 'BLOOD', unitName: 'Units' },
  { code: 'B_NEGATIVE', label: 'B-Negative (Rare Blood Group)', category: 'BLOOD', unitName: 'Units' },
  { code: 'A_NEGATIVE', label: 'A-Negative', category: 'BLOOD', unitName: 'Units' },
  { code: 'AB_NEGATIVE', label: 'AB-Negative (Super Rare Blood Group)', category: 'BLOOD', unitName: 'Units' },
  { code: 'O_POSITIVE', label: 'O-Positive', category: 'BLOOD', unitName: 'Units' },
  { code: 'B_POSITIVE', label: 'B-Positive', category: 'BLOOD', unitName: 'Units' },
  { code: 'BOMBAY_PHENOTYPE', label: 'Bombay Blood Group (Oh Phenotype - Extremely Rare)', category: 'BLOOD', unitName: 'Units' },
  
  // Anti-Venom
  { code: 'SNAKE_POLYVALENT', label: 'Polyvalent Snake Anti-Venom (Cobra/Krait/Vipers)', category: 'ANTI_VENOM', unitName: 'Vials (10ml)' },
  { code: 'LYOPHILIZED_ASV', label: 'Lyophilized Polyvalent Anti-Snake Venom Serum', category: 'ANTI_VENOM', unitName: 'Vials' },

  // Rabies
  { code: 'RABIES_IMMUNOGLOBULIN', label: 'Human Rabies Immunoglobulin (HRIG 300 IU)', category: 'RABIES_VACCINE', unitName: 'Vials' },
  { code: 'PURIFIED_VERO_RABIES', label: 'Purified Vero Cell Rabies Vaccine (PVRV 2.5 IU)', category: 'RABIES_VACCINE', unitName: 'Doses' },

  // Jan Aushadhi Generic
  { code: 'PARACETAMOL_650', label: 'Paracetamol Tablets IP 650mg (Jan Aushadhi)', category: 'JAN_AUSHADHI', unitName: 'Strips (10 tab)' },
  { code: 'AZITHROMYCIN_500', label: 'Azithromycin Tablets IP 500mg (Jan Aushadhi)', category: 'JAN_AUSHADHI', unitName: 'Strips (3 tab)' },
  { code: 'METFORMIN_500_SR', label: 'Metformin Sustained Release 500mg', category: 'JAN_AUSHADHI', unitName: 'Strips (10 tab)' },
  { code: 'HUMAN_INSULIN_30_70', label: 'Human Insulin 30/70 Injection (Subsidized)', category: 'JAN_AUSHADHI', unitName: 'Cartridges' },
  { code: 'HUMAN_ALBUMIN_20', label: 'Human Albumin Infusion 20% (100ml)', category: 'JAN_AUSHADHI', unitName: 'Bottles' },
];

export const PINCODE_COORDINATES: Record<number, { lat: number; lng: number; district: string; state: string }> = {
  492099: { lat: 21.2514, lng: 81.5796, district: 'Raipur', state: 'Chhattisgarh' },
  492001: { lat: 21.2514, lng: 81.6296, district: 'Raipur', state: 'Chhattisgarh' },
  495001: { lat: 22.0797, lng: 82.1409, district: 'Bilaspur', state: 'Chhattisgarh' },
  491001: { lat: 21.1904, lng: 81.2849, district: 'Durg-Bhilai', state: 'Chhattisgarh' },
  400012: { lat: 18.9986, lng: 72.8428, district: 'Mumbai', state: 'Maharashtra' },
  110029: { lat: 28.5683, lng: 77.2078, district: 'New Delhi', state: 'Delhi' },
};

/**
 * Calculates straight-line distance in kilometers between two PIN codes.
 */
export function calculatePincodeDistance(pin1: number, pin2: number): number {
  if (pin1 === pin2) return 0.5;
  const c1 = PINCODE_COORDINATES[pin1];
  const c2 = PINCODE_COORDINATES[pin2];

  if (!c1 || !c2) {
    // Deterministic synthetic distance fallback based on PIN prefix difference
    const diff = Math.abs(pin1 - pin2);
    if (diff < 10) return Math.max(1.2, diff * 1.5);
    if (diff < 1000) return 15 + (diff % 40);
    return 100 + (diff % 500);
  }

  const R = 6371; // Earth radius in km
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const NOW = Date.now();
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export const INITIAL_BEACONS: MedicalBeacon[] = [
  {
    key: '0x9a8f4c12b7e56d3910c2837f40129abcde1029384756a1b2c3d4e5f60718293a',
    owner: '0x71C83647a0D68b43ecf8e563A2f38c64C6c5079a',
    payload: {
      facilityName: 'AIIMS Raipur Emergency Blood Bank',
      contactDesk: '+91-771-2578500',
      address: 'GE Road, Tatibandh, Raipur, Chhattisgarh',
      licenseNumber: 'CG-BB-2024-889',
      operatingHours: '24x7',
      notes: 'Emergency ICU requests prioritized. Replacement donor encouraged but not mandatory for critical cases.',
      updatedAtIso: new Date(NOW - 35 * 60 * 1000).toISOString(),
    },
    attributes: {
      type: 'medical_beacon',
      category: 'BLOOD',
      itemCode: 'O_NEGATIVE',
      pincode: 492099,
      districtCode: 'RAIPUR',
      unitsAvailable: 4,
      priceInr: '0.00',
      isEmergency24x7: 'YES',
      status: 'ACTIVE',
    },
    expiresAtBlock: 707850,
    expiresAtTimestamp: NOW + (3.4 * 60 * 60 * 1000), // ~3h 24m remaining
    createdAtTimestamp: NOW - 35 * 60 * 1000,
    blockNumber: 700620,
    txHash: '0xfa39b49129587c6d9a102458f7e2a9b401283746192837465019283746501928',
    stateRoot: '0x8892fca019283847561928374650192837465019283746501928374650192837',
    inclusionProof: '0x0182746152837492817263548192837465019283746501928374650192837465',
  },
  {
    key: '0x5b32e1892837465019283746501928374650192837465019283746501928374b',
    owner: '0x498a9668E2d87eA051C60f38b4A163778FeF7741',
    payload: {
      facilityName: 'CIMS Bilaspur District Hospital & Anti-Venom Cell',
      contactDesk: '+91-7752-224150',
      address: 'Sardar Patel Hospital Road, Bilaspur, Chhattisgarh',
      licenseNumber: 'CG-HOSP-2023-412',
      operatingHours: '24x7 Emergency Casualty',
      notes: 'Polyvalent equine anti-venom for krait, viper, and cobra bites. Immediate casualty administration.',
      updatedAtIso: new Date(NOW - 50 * 60 * 1000).toISOString(),
    },
    attributes: {
      type: 'medical_beacon',
      category: 'ANTI_VENOM',
      itemCode: 'SNAKE_POLYVALENT',
      pincode: 495001,
      districtCode: 'BILASPUR',
      unitsAvailable: 12,
      priceInr: '0.00',
      isEmergency24x7: 'YES',
      status: 'ACTIVE',
    },
    expiresAtBlock: 707600,
    expiresAtTimestamp: NOW + (3.1 * 60 * 60 * 1000),
    createdAtTimestamp: NOW - 50 * 60 * 1000,
    blockNumber: 700580,
    txHash: '0x4c21983746501928374650192837465019283746501928374650192837465019',
    stateRoot: '0x7721839485760192837465019283746501928374650192837465019283746501',
    inclusionProof: '0x9928374650192837465019283746501928374650192837465019283746501928',
  },
  {
    key: '0x1c8736481928374650192837465019283746501928374650192837465019283c',
    owner: '0x3A2B1D635F924e5A48F95328A1C52dC71B78988B',
    payload: {
      facilityName: 'Pradhan Mantri Bhartiya Janaushadhi Kendra #1042',
      contactDesk: '+91-98271-98740',
      address: 'Shop 14, Commercial Complex, Katora Talab, Raipur, Chhattisgarh',
      licenseNumber: 'PMBJP-CG-1042',
      operatingHours: '08:00 AM - 10:30 PM',
      notes: 'Government certified affordable generic medicine center. Subsidized rates vs branded equivalents.',
      updatedAtIso: new Date(NOW - 15 * 60 * 1000).toISOString(),
    },
    attributes: {
      type: 'medical_beacon',
      category: 'JAN_AUSHADHI',
      itemCode: 'PARACETAMOL_650',
      pincode: 492001,
      districtCode: 'RAIPUR',
      unitsAvailable: 85,
      priceInr: '14.50',
      isEmergency24x7: 'NO',
      status: 'ACTIVE',
    },
    expiresAtBlock: 707920,
    expiresAtTimestamp: NOW + (3.7 * 60 * 60 * 1000),
    createdAtTimestamp: NOW - 15 * 60 * 1000,
    blockNumber: 700640,
    txHash: '0x1928374650192837465019283746501928374650192837465019283746501928',
    stateRoot: '0x3344556677889900112233445566778899001122334455667788990011223344',
    inclusionProof: '0x5566778899001122334455667788990011223344556677889900112233445566',
  },
  {
    key: '0x7e4491827364501928374650192837465019283746501928374650192837465d',
    owner: '0x8b321F55e5C58A2B68625Bf49b1E83F00570b555',
    payload: {
      facilityName: 'KEM Hospital & Blood Bank Parel',
      contactDesk: '+91-22-24107000',
      address: 'Acharya Donde Marg, Parel, Mumbai, Maharashtra',
      licenseNumber: 'MH-BB-2022-108',
      operatingHours: '24x7 Apex Blood Center',
      notes: 'Extremely rare Bombay Phenotype (Oh) units stored in liquid nitrogen cryo-tank. Pre-crossmatch mandatory.',
      updatedAtIso: new Date(NOW - 110 * 60 * 1000).toISOString(),
    },
    attributes: {
      type: 'medical_beacon',
      category: 'BLOOD',
      itemCode: 'BOMBAY_PHENOTYPE',
      pincode: 400012,
      districtCode: 'MUMBAI',
      unitsAvailable: 2,
      priceInr: '0.00',
      isEmergency24x7: 'YES',
      status: 'ACTIVE',
    },
    expiresAtBlock: 707100,
    expiresAtTimestamp: NOW + (2.1 * 60 * 60 * 1000),
    createdAtTimestamp: NOW - 110 * 60 * 1000,
    blockNumber: 700490,
    txHash: '0x6655443322110099887766554433221100998877665544332211009988776655',
    stateRoot: '0x9988776655443322110099887766554433221100998877665544332211009988',
    inclusionProof: '0x2233445566778899001122334455667788990011223344556677889900112233',
  },
  {
    key: '0x8a9203847561928374650192837465019283746501928374650192837465019e',
    owner: '0x1C2F3E4D5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D',
    payload: {
      facilityName: 'Safdarjung Hospital Emergency Rabies Desk',
      contactDesk: '+91-11-26165060',
      address: 'Ring Road, Opposite AIIMS, New Delhi',
      licenseNumber: 'DL-HOSP-2021-004',
      operatingHours: '24x7 Anti-Rabies Clinic',
      notes: 'Category III animal bite exposure protocol. Weight-based infiltration into bite wound.',
      updatedAtIso: new Date(NOW - 20 * 60 * 1000).toISOString(),
    },
    attributes: {
      type: 'medical_beacon',
      category: 'RABIES_VACCINE',
      itemCode: 'RABIES_IMMUNOGLOBULIN',
      pincode: 110029,
      districtCode: 'NEW_DELHI',
      unitsAvailable: 8,
      priceInr: '0.00',
      isEmergency24x7: 'YES',
      status: 'ACTIVE',
    },
    expiresAtBlock: 707900,
    expiresAtTimestamp: NOW + (3.6 * 60 * 60 * 1000),
    createdAtTimestamp: NOW - 20 * 60 * 1000,
    blockNumber: 700630,
    txHash: '0x7788990011223344556677889900112233445566778899001122334455667788',
    stateRoot: '0x4455667788990011223344556677889900112233445566778899001122334455',
    inclusionProof: '0x1122334455667788990011223344556677889900112233445566778899001122',
  },
  {
    key: '0x4f1283948576019283746501928374650192837465019283746501928374650f',
    owner: '0x9E8D7C6B5A4F3E2D1C0B9A8F7E6D5C4B3A2F1E0D',
    payload: {
      facilityName: 'Dr. BRAM Hospital & Pt. JNM Medical College Desk',
      contactDesk: '+91-771-2890001',
      address: 'Jail Road, Byron Bazar, Raipur, Chhattisgarh',
      licenseNumber: 'CG-BB-2023-112',
      operatingHours: '24x7 State Referral Blood Center',
      notes: 'Negative blood groups reserved for emergency cesarean and trauma casualty admissions.',
      updatedAtIso: new Date(NOW - 75 * 60 * 1000).toISOString(),
    },
    attributes: {
      type: 'medical_beacon',
      category: 'BLOOD',
      itemCode: 'B_NEGATIVE',
      pincode: 492001,
      districtCode: 'RAIPUR',
      unitsAvailable: 6,
      priceInr: '0.00',
      isEmergency24x7: 'YES',
      status: 'ACTIVE',
    },
    expiresAtBlock: 707400,
    expiresAtTimestamp: NOW + (2.7 * 60 * 60 * 1000),
    createdAtTimestamp: NOW - 75 * 60 * 1000,
    blockNumber: 700540,
    txHash: '0x8877665544332211009988776655443322110099887766554433221100998877',
    stateRoot: '0x5544332211009988776655443322110099887766554433221100998877665544',
    inclusionProof: '0x6677889900112233445566778899001122334455667788990011223344556677',
  },
];
