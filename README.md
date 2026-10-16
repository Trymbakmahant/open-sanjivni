# 🚨 Sanjeevani Pulse: Live Emergency Blood, Anti-Venom & Jan Aushadhi Stock Radar on Arkiv DB-Chain

[![Arkiv Tiramisu Testnet](https://img.shields.io/badge/Network-Arkiv%20Tiramisu%20(7738577)-06B6D4?style=for-the-badge&logo=ethereum)](https://tiramisu.explorer.arkiv.network)
[![Track: Best Indian Use Case](https://img.shields.io/badge/Track-Best%20Indian%20Use%20Case-EF4444?style=for-the-badge)](https://devfolio.co)
[![Track: Censorship Resistance](https://img.shields.io/badge/Track-Censorship%20Resistance-10B981?style=for-the-badge)](https://devfolio.co)
[![Next.js 15](https://img.shields.io/badge/Framework-Next.js%2015%20App%20Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x%20Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)

> **Arkiv: Global Tour Stop 🌍 (Road to Devcon 8 Mumbai)**  
> **Primary Track**: Best Indian Use Case ($2,000 USDC + Devcon 8 Ticket)  
> **Secondary Track**: Censorship Resistance ($750 USDC + Devcon 8 Ticket)

---

## ⚡ Executive Summary

**Sanjeevani Pulse** is a censorship-resistant, decentralized emergency medical inventory radar where Indian blood banks, Jan Aushadhi Kendras, and hospital desks broadcast perishable, time-scoped availability of rare blood groups (O-Negative, Bombay Phenotype), snake anti-venom, rabies vaccines, and critical generic drugs directly to citizens.

By leveraging **Arkiv DB-Chain's protocol-enforced auto-expiration (`ExpirationTime.fromHours(4)`)**, listings automatically vanish from the query layer when a hospital goes offline—**mathematically guaranteeing that desperate families never chase phantom stock in the dead of night.**

---

## 🏥 1. The Crisis in India (Why India & Why Censorship Resistance?)

In Indian district hubs and metropolitan cities (from Raipur and Bilaspur to Mumbai and New Delhi):
* **The 2:00 AM ICU Nightmare**: An emergency patient in critical care needs O-Negative blood or polyvalent snake anti-venom. Family members frantically dial 30+ hospital contacts scraped from Google Maps or commercial aggregators, only to hear: *"Stock finished 3 days ago."*
* **Commercial Gatekeeping & Paywalls**: Centralized aggregators routinely bury non-profit Jan Aushadhi Kendras (offering generic Paracetamol 650 at ₹14.50) to promote high-margin commercial hospital pharmacies (selling branded variants at ₹60+).
* **WhatsApp SOS Chains**: Unverified forwards with disconnected mobile numbers circulate for months after the patient has already been discharged.
* **The Sanjeevani Pulse Solution**: An open, wallet-authenticated medical beacon network where verified facility wallets publish real-time stock by PIN code directly over Arkiv RPC. No commercial intermediaries, no advertising bias, and zero phone spam.

---

## 🛡️ 2. Why Arkiv? What Breaks Elsewhere?

| Feature / Architecture | IPFS + Decentralized Storage | Traditional EVM (Polygon / Arbitrum) | Centralized Postgres / Supabase | **Arkiv DB-Chain (Sanjeevani Pulse)** |
| :--- | :--- | :--- | :--- | :--- |
| **Perishable Stock Lifecycle** | ❌ **Immutability Kills**: "4 units O-Neg" pinned to IPFS lives forever, misleading families after transfusion. | ⚠️ Costly smart contract cleanup transactions burn continuous gas. | ⚠️ Stale rows persist indefinitely unless background cron jobs succeed. | ✅ **Native Auto-Expiration**: `ExpirationTime.fromHours(4)` purges stale beacons at the protocol layer. |
| **Serverless Range Queries** | ❌ Cannot filter `unitsAvailable > 0 AND pincode = 492099` without a server. | ❌ Requires indexing layers (The Graph / Subgraphs) adding 30s-10m indexing lag. | ❌ Single Point of Failure; vulnerable to server crashes or censorship. | ✅ **Sub-Second RPC Queries**: `arkiv_query` / `select()` over JSON-RPC in &lt; 85ms. |
| **Operational Gas Overhead** | N/A (Storage fee only) | ❌ 50 inventory adjustments per day drains hospital operating budgets. | N/A (Server rental & DBA costs) | ✅ **Database-Optimized Gas**: Micro-transactions tailored for high-frequency database state. |
| **Censorship Resistance** | ⚠️ Gatekept pinning services (Infura/Pinata) can ban or geo-block. | ✅ Censorship-resistant. | ❌ Operators can delete competitor listings or paywall results. | ✅ **Keccak-MPT State Anchored**: Permanent cryptographic state proofs committed to Ethereum L1. |

---

## 🧩 3. Purposeful Utilization of Arkiv SDK Primitives

Sanjeevani Pulse exercises the full suite of `@arkiv-network/sdk` v0.8.x capabilities:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS / REACT FRONTEND                        │
│  - Citizen View: Real-time search by PIN Code & Blood / Medicine Type  │
│  - Hospital Portal: 1-Click "Broadcast", "Dispense", & "Extend (+4h)"  │
│  - Serverless: Pure client-side calls via @arkiv-network/sdk           │
└───────────────┬────────────────────────────────────────┬───────────────┘
                │                                        │
        Write Actions (Signed)                     Read Queries (RPC)
  [createEntity, patchEntity, extendEntity]      [arkiv_query over JSON-RPC]
                │                                        │
                ▼                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    ARKIV DB-CHAIN (TIRAMISU TESTNET)                   │
│  - Chain ID: 7738577                                                   │
│  - Native Database Engine (2-Second Block Times, Sub-Second Reads)     │
│                                                                        │
│   Entities Stored:                                                     │
│   └── "medical_beacon": Active stock with ExpirationTime.fromHours(4)  │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                   Keccak-MPT State Commitments
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          ETHEREUM LAYER 1                              │
│  - Permanent State Root Anchor & Proof Verification (`eth_getProof`)   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **`walletClient.createEntity()`**:
   Broadcasts an emergency medical beacon with typed attributes (`category`, `itemCode`, `pincode`, `unitsAvailable`, `priceInr`) and `ExpirationTime.fromHours(4)`.
2. **`walletClient.patchEntity()`**:
   Decrements available units in real time when hospital desks dispense emergency stock (`unitsAvailable = i32(remaining)`). When units reach zero, status transitions to `DEPLETED`.
3. **`walletClient.extendEntity()`**:
   Hospital desk clicks *"Still In Stock (+4h)"* to extend availability lease by 7,200 blocks without re-posting the listing.
4. **`walletClient.deleteEntity()`**:
   Executes emergency recall or stockout purge, removing the beacon immediately from query results.
5. **`publicClient.select().where(...)` / `arkiv_query`**:
   Direct JSON-RPC serverless range queries executed client-side without Subgraphs.
6. **`publicClient.getProof()` / `eth_getProof`**:
   Cryptographic Merkle Patricia Trie verification confirming that facility inventory is legitimately anchored in the consensus state root.

---

## 🔒 4. Strict Privacy Compliance (DPDP Act & Zero PHI)

In accordance with India's **Digital Personal Data Protection (DPDP) Act** and the **Arkiv Privacy Gate**:
* **ZERO Personal Health Information (PHI)**: No patient names, Aadhaar numbers, clinical diagnoses, blood recipient records, or private contact details are ever written to Arkiv.
* **Institutional Beacons Only**: Stored entities contain *only* institutional inventory data (`facilityName`, `contactDesk`, `pincode`, `itemCode`, `unitsAvailable`).
* **Synthetic Contacts for Demo**: All testnet demonstrations use verified synthetic institutional emergency lines (`+91-771-2578500`).

---

## 📋 5. Arkiv Entity Data Schema (`medical_beacon`)

### Attributes Definition
* `type`: `str("medical_beacon")`
* `category`: `str("BLOOD" | "ANTI_VENOM" | "RABIES_VACCINE" | "JAN_AUSHADHI")`
* `itemCode`: `str("O_NEGATIVE" | "SNAKE_POLYVALENT" | "PARACETAMOL_650" | ...)`
* `pincode`: `i32(492099)` *(Indexed for geographical search & distance sorting)*
* `districtCode`: `str("RAIPUR" | "BILASPUR" | "MUMBAI" | "NEW_DELHI")`
* `unitsAvailable`: `i32(4)` *(Indexed for range query: `unitsAvailable > i32(0)`)*
* `priceInr`: `dec("0.00")` *(0.00 for Govt blood bank/antivenom, subsidized MRP for Jan Aushadhi)*
* `isEmergency24x7`: `str("YES" | "NO")`
* `status`: `str("ACTIVE" | "DEPLETED" | "EXPIRED")`
* **Expiration Policy**: `ExpirationTime.fromHours(4)` *(4 hours = ~7,200 blocks)*

### JSON Payload (< 2 KiB)
```json
{
  "facilityName": "AIIMS Raipur Emergency Blood Bank",
  "contactDesk": "+91-771-2578500",
  "address": "GE Road, Tatibandh, Raipur, Chhattisgarh",
  "licenseNumber": "CG-BB-2024-889",
  "operatingHours": "24x7",
  "notes": "Emergency ICU requests prioritized. Replacement donor encouraged.",
  "updatedAtIso": "2026-10-17T15:30:00.000Z"
}
```

---

## 🛠️ 6. Arkiv Developer Friction & Feedback Report

Documenting firsthand developer experience building on the **Tiramisu Testnet (`Chain ID 7738577`)** with `@arkiv-network/sdk v0.8.x`:

### 1. Integer Helper Handling in Range Queries
* **Observation**: In raw query strings, omitting the typed helper (e.g. typing `unitsAvailable > 0` instead of `unitsAvailable > i32(0)`) results in a generic query parser rejection: `Query rejected (-32003): Transaction creation failed`.
* **Feedback**: Providing descriptive error hints (e.g., *"Expected typed helper: i32, u64, or dec"*) in the RPC parser or enforcing TypeScript template literals in `publicClient.query` will significantly improve onboarding velocity.

### 2. Entity Expiration Timestamp Helper
* **Observation**: `ExpirationTime.fromHours(4)` converts hours into block height. On the frontend, rendering a live countdown timer requires manually converting block height back to wall-clock time based on estimated 2-second block intervals.
* **Feedback**: Returning an estimated Unix timestamp directly on entity metadata (`$expiresAtTimestamp`) would streamline real-time UI development.

### 3. Native Reconnecting WebSocket Client
* **Observation**: Listening to `watchEntityEvents` over `wss://rpc.tiramisu.db-chain.testnet.arkiv.network` drops on network changes.
* **Feedback**: Adding built-in exponential backoff reconnection inside the `@arkiv-network/sdk` transport layer will make production dApps more resilient.

---

## 🚀 7. Quickstart & Local Installation

### Prerequisites
* Node.js v20+ or v24+
* pnpm v10+ (or npm)

### Installation
```bash
# 1. Clone repository
git clone https://github.com/TrymbakMahant/arkiv.git
cd arkiv

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
pnpm build
pnpm start
```

---

## 🌐 8. Network Parameters

* **Network Name**: Arkiv Tiramisu Testnet
* **Chain ID**: `7738577`
* **RPC URL**: `https://rpc.tiramisu.db-chain.testnet.arkiv.network`
* **WebSocket RPC**: `wss://rpc.tiramisu.db-chain.testnet.arkiv.network`
* **Block Explorer**: [https://tiramisu.explorer.arkiv.network](https://tiramisu.explorer.arkiv.network)
* **Native Token**: GLM (18 Decimals)
* **Average Block Time**: ~2.0 Seconds

---

## 🎬 9. 3-Minute Video Demo Script

* **0:00 - 0:45 (The Crisis)**: *"At 2:00 AM in Raipur or Mumbai, an ICU patient urgently needs O-Negative blood or anti-venom. The family calls 30 numbers on Google Maps, only to hear: 'Stock finished 3 days ago.' Centralized apps show stale data, private hospitals gatekeep stock, and WhatsApp forwards are full of dead numbers. What if medical availability was verified, wallet-owned, and mathematically guaranteed to never be stale?"*
* **0:45 - 1:25 (Enter Sanjeevani Pulse)**: *"Sanjeevani Pulse runs on the Arkiv DB-Chain. Certified blood banks and Jan Aushadhi stores broadcast stock directly from their wallets with a strict 4-hour expiration. If the facility desk does not actively extend the beacon, the listing automatically vanishes from the query layer. No stale data, no ad-driven bias, and zero commercial gatekeeping."*
* **1:25 - 2:25 (Live Tiramisu Demo)**: *"Watch our hospital portal on Tiramisu testnet. With one click, AIIMS Raipur broadcasts 4 units of O-Negative blood with `createEntity()` and `ExpirationTime.fromHours(4)`. In 2 seconds, it confirms. Now look at our citizen radar screen: querying `category = BLOOD AND itemCode = O_NEGATIVE AND unitsAvailable > 0` directly fetches live results in 80 milliseconds over RPC—no Subgraph, no centralized Postgres server. When a unit is transfused, the hospital clicks 'Dispense' (`patchEntity()`), or clicks 'Extend (+4h)' (`extendEntity()`)."*
* **2:25 - 3:00 (Why This Wins)**: *"Sanjeevani Pulse stores zero personal health data, solves a life-or-death challenge for 1.4 billion people in India, and proves why Arkiv's time-scoped DB-Chain is the perfect foundation for decentralized public goods. Thank you!"*

---

## 📄 License
MIT License. Built for the **Arkiv Global Tour Stop (Road to Devcon 8 Mumbai)** hackathon.
