# Arkiv Entity Schema Specification — Open Sanjivni

## 1. Overview
Open Sanjivni models emergency medical supplies (rare blood groups, snake polyvalent anti-venoms, anti-rabies immunoglobulins, and Jan Aushadhi generic medicines) as **Time-Scoped Beacons** on the **Arkiv DB-Chain Tiramisu Testnet** (Chain ID: `7738577`).

Unlike traditional smart contracts where data persists indefinitely unless pruned at great gas cost, or off-chain Web2 databases prone to hoarding and stale phantom listings, Open Sanjivni leverages Arkiv's native **Time-To-Live (TTL)** protocol engine.

---

## 2. Entity Specification

### Entity Type Name
`medical_beacon`

### Indexed Typed Attributes
Arkiv stores indexed attributes alongside the entity to enable sub-100ms range queries directly over JSON-RPC without requiring subgraphs or centralized indexers.

> [!NOTE]
> Arkiv DB-Chain validator precompiles enforce lowercase snake_case attribute names (`[a-z][a-z0-9._-]*`). Uppercase ASCII bytes are rejected with `Ident32InvalidByte`.

| Attribute Name | Typed Helper | Data Type | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `category` | `str` | `string` | Medical category for taxonomy | `str('BLOOD')` |
| `item_code` | `str` | `string` | Standardized inventory code | `str('O_NEGATIVE')` |
| `units_available`| `i32` | `int32` | Verified ready-to-dispatch units | `i32(6)` |
| `pincode` | `i32` | `int32` | 6-digit Indian Postal Index | `i32(492099)` |
| `district_code` | `str` | `string` | District administrative code | `str('RAIPUR')` |
| `price_inr` | `dec` | `decimal` | Unit cost in Indian Rupees (₹0 for Govt) | `dec(0.00)` |
| `is_emergency_24x7`| `str` | `string` | 24x7 Casualty Desk availability | `str('YES')` |
| `status` | `str` | `string` | Lifecycle status | `str('ACTIVE')` |
| `type` | `str` | `string` | Top-level entity discriminator | `str('medical_beacon')` |

### Unindexed JSON Payload
The payload holds institutional facility data and operational dispatch instructions:

```json
{
  "facilityName": "AIIMS Raipur Blood Center & Trauma ICU",
  "address": "GE Road, Tatibandh, Raipur, Chhattisgarh 492099",
  "districtCode": "CG-RAI",
  "contactDesk": "+91-771-2970600",
  "operatingHours": "24x7 Emergency Casualty",
  "notes": "Direct ambulance corridor active. Immediate crossmatch desk staffed.",
  "broadcastTimestamp": 1792251800000
}
```

---

## 3. Anon Aadhaar Zero-Knowledge Identity Entities

Open Sanjivni pairs Arkiv's native DB-Chain engine with **Anon Aadhaar** zero-knowledge Groth16 proofs to guarantee anti-scalper sybil protection and verified volunteer donor networks with **STRICT ZERO PII**.

### DPDP Act & Privacy Architecture (Zero PII Guarantee)
- **Zero Raw PII on Arkiv**: No Aadhaar numbers, real names, phone numbers, or dates of birth are ever written to Arkiv DB-Chain—not even hashed.
- **Cryptographic Nullifier**: An anonymous deterministic nullifier (`0x...`) derived from `Poseidon(AadhaarSignature, appSeed=492099108)` acts as an anonymous, un-linkable single-use identifier.
- **Selective Disclosure Signals**: Only the zero-knowledge boolean `ageAbove18` and the proven `pincode` (extracted from the UIDAI RSA digital signature inside the SNARK circuit) are stored.
- **Synthetic Communication Relays**: Contact is mediated through synthetic tokens (`ICU-REQ-8F42E1`, `matrix_relay_0x8f42e1b9`).

---

### Entity #2: `emergency_lock` (Anti-Scalper 60-Minute Reservation)

Prevents hoarding or predatory scalping of critical O-Negative blood or anti-venoms.

#### Indexed Typed Attributes
| Attribute Name | Typed Helper | Data Type | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `type` | `str` | `string` | Entity type identifier | `str('emergency_lock')` |
| `beacon_key` | `str` | `string` | Target `medical_beacon` entity key | `str('0x9a8f...31')` |
| `zk_nullifier` | `str` | `string` | Anon Aadhaar Groth16 nullifier | `str('0x8f42e1b9...5019')` |
| `verified_pincode`| `i32` | `int32` | Proven pincode from ZK proof | `i32(492099)` |
| `is_adult_verified`| `str` | `string` | Age 18+ proof verification | `str('YES')` |
| `status` | `str` | `string` | Lock lifecycle status | `str('LOCKED')` |

#### Unindexed JSON Payload
```json
{
  "beaconKey": "0x9a8f1029bc4127...",
  "zkProofTimestamp": "1792251800000",
  "syntheticPatientToken": "ICU-REQ-8F42E1",
  "hospitalName": "AIIMS Raipur Emergency Blood Bank",
  "itemCode": "O_NEGATIVE"
}
```

#### Protocol-Level Auto-Expiration
```typescript
// Strict 60-Minute Auto-Release
expires: ExpirationTime.fromMinutes(60)
```
If an attendant does not arrive at the hospital casualty desk within 60 minutes, Arkiv DB-Chain automatically releases the lock without manual intervention.

---

### Entity #3: `volunteer_donor` (ZK-Verified Standby Volunteer Donor Beacon)

When hospital inventory is depleted (0 units), families locate verified adult standby replacement donors in their exact PIN code.

#### Indexed Typed Attributes
| Attribute Name | Typed Helper | Data Type | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `type` | `str` | `string` | Entity type identifier | `str('volunteer_donor')` |
| `blood_group` | `str` | `string` | Blood group code | `str('O_NEGATIVE')` |
| `pincode` | `i32` | `int32` | Enforced from ZK proof | `i32(492099)` |
| `zk_nullifier` | `str` | `string` | Unique anonymous donor nullifier | `str('0x8f42e1b9...5019')` |
| `is_anon_aadhaar_verified` | `str` | `string` | Cryptographic confirmation | `str('YES')` |
| `status` | `str` | `string` | Standby availability | `str('AVAILABLE')` |

#### Unindexed JSON Payload
```json
{
  "bloodGroup": "O_NEGATIVE",
  "syntheticRelay": "matrix_relay_0x8f42e1b9",
  "state": "Chhattisgarh",
  "note": "Available for emergency ICU replacement donation at AIIMS corridor.",
  "registeredAtIso": "2026-10-17T17:30:00.000Z"
}
```

#### Protocol-Level Auto-Expiration
```typescript
// 12-Hour Standby Readiness TTL
expires: ExpirationTime.fromHours(12)
```

---

## 4. Protocol-Level Expiration Model (Category-Adaptive TTL)

Open Sanjivni implements Category-Adaptive Time-To-Live parameters:
- **Emergency Blood (Platelets / O-Neg RBC)**: `ExpirationTime.fromHours(8)`
- **Snake Anti-Venom & Rabies Immunoglobulins**: `ExpirationTime.fromDays(2)` (48 hours)
- **Jan Aushadhi Generic Essential Medicines**: `ExpirationTime.fromDays(14)` (336 hours)
- **Anti-Scalper Citizen Locks**: `ExpirationTime.fromMinutes(60)` (1 hour)
- **Standby Volunteer Donors**: `ExpirationTime.fromHours(12)` (12 hours)

### Automatic State Trie Pruning
- If not extended or renewed before expiration, Arkiv validator consensus automatically prunes the entity from the active state trie.
- **Zero Gas Cost**: Pruning requires zero gas fees from the hospital or patient.
- **Anti-Phantom Guarantee**: Patients in ICU hospital corridors will never chase stale numbers or phantom stock.

---

## 5. Query Semantics & Range Operations

### Direct JSON-RPC Querying
Citizens and emergency attendants query Arkiv Tiramisu RPC (`https://rpc.tiramisu.db-chain.testnet.arkiv.network`) directly without an intermediary server or GraphQL subgraph.

#### Anti-Scalper Sybil Query:
```sql
type = str('emergency_lock') AND zkNullifier = str('0x8f42e1b99c72ad416a29bf33d90184e271a01298471928374650192837465019') AND status = str('LOCKED')
```

#### Standby Donor Neighborhood Query:
```sql
type = str('volunteer_donor') AND bloodGroup = str('O_NEGATIVE') AND pincode = i32(492099) AND status = str('AVAILABLE')
```

---

## 6. Whitelisted Institutional Desks on Tiramisu Testnet

| Facility Name | District | PIN Code | Authorized Wallet Address |
| :--- | :--- | :--- | :--- |
| **AIIMS Raipur Trauma Desk** | Raipur, CG | `492099` | `0x8F42a8b9C2D1F3e47a61B72A4E90F84e51119B10` |
| **Pt. JNM / Dr. BRAM Hospital** | Raipur, CG | `492001` | `0x3C19Fe42A90b8B3d5B72611aE102F71569e9E421` |
| **CIMS Bilaspur Blood Center** | Bilaspur, CG | `495001` | `0x5B10A49e219C0F12e4B8192aF0182E119b91A012` |
| **Safdarjung Emergency Desk** | New Delhi, DL | `110029` | `0x7D81b899F231e33D106e231154E8976E2A10A054` |
| **KEM Hospital Blood Bank** | Mumbai, MH | `400012` | `0x2a91e5F42D1C90B3e1209bF541E8972E10972A01` |
| **Jan Aushadhi Kendra Raipur Hub** | Raipur, CG | `492001` | `0x4e19F90a210Eb8B3d52611aE102F71569e9E9901` |

