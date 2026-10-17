# Arkiv Entity Schema Specification — Sanjeevani Pulse

## 1. Overview
Sanjeevani Pulse models emergency medical supplies (rare blood groups, snake polyvalent anti-venoms, anti-rabies immunoglobulins, and Jan Aushadhi generic medicines) as **Time-Scoped Beacons** on the **Arkiv DB-Chain Tiramisu Testnet** (Chain ID: `7738577`).

Unlike traditional smart contracts where data persists indefinitely unless pruned at great gas cost, or off-chain Web2 databases prone to hoarding and stale phantom listings, Sanjeevani Pulse leverages Arkiv's native **Time-To-Live (TTL)** protocol engine.

---

## 2. Entity Specification

### Entity Type Name
`medical_beacon`

### Indexed Typed Attributes
Arkiv stores indexed attributes alongside the entity to enable sub-100ms range queries directly over JSON-RPC without requiring subgraphs or centralized indexers.

| Attribute Name | Typed Helper | Data Type | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `category` | `str` | `string` | Medical category for taxonomy | `str('BLOOD')` |
| `itemCode` | `str` | `string` | Standardized inventory code | `str('O_NEGATIVE')` |
| `unitsAvailable`| `i32` | `int32` | Verified ready-to-dispatch units | `i32(6)` |
| `pincode` | `i32` | `int32` | 6-digit Indian Postal Index | `i32(492099)` |
| `priceInr` | `dec` | `decimal` | Unit cost in Indian Rupees (₹0 for Govt) | `dec(0.00)` |
| `isEmergency24x7`| `str` | `string` | 24x7 Casualty Desk availability | `str('YES')` |
| `status` | `str` | `string` | Lifecycle status | `str('ACTIVE')` |
| `facilityId` | `str` | `string` | Institutional identifier | `str('aiims-raipur')` |

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

## 3. Protocol-Level Expiration Model (TTL)

### 4-Hour Life Cycle
Every medical beacon is instantiated with strict 4-hour validity:
```typescript
import { ExpirationTime } from '@arkiv-network/sdk';

// Exact 4-hour protocol lifespan
const expiration = ExpirationTime.fromHours(4);
```

### Automatic State Trie Pruning
- If a hospital trauma desk fails to re-affirm stock within 4 hours, the Arkiv validator consensus automatically prunes the beacon from the active state trie.
- **Zero Gas Cost**: Pruning requires zero gas fees from the hospital or patient.
- **Anti-Phantom Guarantee**: Patients in ICU hospital corridors will never chase stale numbers or phantom stock listed 3 days prior.

---

## 4. Query Semantics & Range Operations

### Direct JSON-RPC Querying
Citizens and emergency attendants query Arkiv Tiramisu RPC (`https://rpc.tiramisu.db-chain.testnet.arkiv.network`) directly without an intermediary server or GraphQL subgraph.

#### Query Filter Example:
```sql
type = str('medical_beacon') AND unitsAvailable > i32(0) AND category = str('BLOOD') AND pincode = i32(492099)
```

#### TypeScript SDK Invocation:
```typescript
import { createPublicClient } from '@arkiv-network/sdk';
import { http } from 'viem';
import { str, i32 } from '@arkiv-network/sdk/attr';

const publicClient = createPublicClient({
  transport: http('https://rpc.tiramisu.db-chain.testnet.arkiv.network'),
});

const beacons = await publicClient.queryEntities({
  where: `type = str('medical_beacon') AND unitsAvailable > i32(0) AND category = str('${category}')`,
});
```

---

## 5. Mutation & Lifecycle Operations

1. **Broadcast (`createEntity`)**:
   Hospital wallet signs an EIP-712 medical beacon creation with typed attributes and payload.
2. **Dispense (`patchEntity`)**:
   When 1 unit of O-Negative blood is transfused, the hospital wallet invokes an in-place patch to mutate only `unitsAvailable`:
   ```typescript
   await walletClient.patchEntity({
     key: beaconKey,
     attributes: {
       unitsAvailable: i32(newUnitCount),
     },
   });
   ```
3. **Extend (`extendEntity`)**:
   When nursing staff verify continued refrigerated viability, they extend the beacon by +4 hours:
   ```typescript
   await walletClient.extendEntity({
     key: beaconKey,
     expirationTime: ExpirationTime.fromHours(4),
   });
   ```
4. **Purge (`deleteEntity`)**:
   Explicit deletion if inventory fails quality tests or hemolysis screening.

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
