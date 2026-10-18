# 🚨 Open Sanjivni: Live Emergency Blood, Anti-Venom & Jan Aushadhi Stock Radar on Arkiv DB-Chain

[![Arkiv Tiramisu Testnet](https://img.shields.io/badge/Network-Arkiv%20Tiramisu%20(7738577)-06B6D4?style=for-the-badge&logo=ethereum)](https://tiramisu.explorer.arkiv.network)
[![Track: Indian Public Goods](https://img.shields.io/badge/Track-Best%20Indian%20Use%20Case-EF4444?style=for-the-badge)](https://devfolio.co)
[![Track: Censorship Resistance](https://img.shields.io/badge/Track-Censorship%20Resistance-10B981?style=for-the-badge)](https://devfolio.co)
[![Anon Aadhaar ZK](https://img.shields.io/badge/Privacy-Anon%20Aadhaar%20ZK-8B5CF6?style=for-the-badge)](https://anon-aadhaar.pse.dev)
[![Next.js 15](https://img.shields.io/badge/Framework-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x%20Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)

> **Open Sanjivni** is a decentralized public goods infrastructure built for the **Arkiv Global Tour Stop (Road to Devcon 8 Mumbai)**.  
> **Target Tracks**: *Best Indian Use Case* • *Censorship Resistance*  
> **Core Mission**: Eliminating midnight "phantom stock" crises for rare blood groups, anti-venom, and essential generic medicines across India through Arkiv DB-Chain's native cryptographic auto-expiration and Anon Aadhaar Zero-Knowledge verification.

---

## ⚡ Executive Summary

**Open Sanjivni** is a censorship-resistant, decentralized emergency medical inventory radar where Indian blood banks, Jan Aushadhi Kendras, and hospital desks broadcast perishable, time-scoped availability of rare blood groups (O-Negative, Bombay Phenotype), snake anti-venom, rabies vaccines, and critical generic drugs directly to citizens.

By leveraging **Arkiv DB-Chain's protocol-enforced auto-expiration (`ExpirationTime.fromHours(4)`)**, listings automatically vanish from the query layer when a hospital goes offline—**mathematically guaranteeing that desperate families never chase phantom stock in the dead of night.**

---

## 🏥 1. The Crisis in India (Why India & Why Censorship Resistance?)

In Indian district hubs and metropolitan cities (from Raipur and Bilaspur to Mumbai and New Delhi):
* **The 2:00 AM ICU Nightmare**: An emergency patient in critical care needs O-Negative blood or polyvalent snake anti-venom. Family members frantically dial 30+ hospital contacts scraped from Google Maps or commercial aggregators, only to hear: *"Stock finished 3 days ago."*
* **Commercial Gatekeeping & Paywalls**: Centralized aggregators routinely bury non-profit Jan Aushadhi Kendras (offering generic Paracetamol 650 at ₹14.50) to promote high-margin commercial hospital pharmacies (selling branded variants at ₹60+).
* **WhatsApp SOS Chains**: Unverified forwards with disconnected mobile numbers circulate for months after the patient has already been discharged.
* **The Open Sanjivni Solution**: An open, wallet-authenticated medical beacon network where verified facility wallets publish real-time stock by PIN code directly over Arkiv RPC. No commercial intermediaries, no advertising bias, and zero phone spam. Fully supports real MetaMask on-chain signatures as well as 1-click evaluator simulation mode.

---

## 🛡️ 2. Why Arkiv? What Breaks Elsewhere?

| Feature / Architecture | IPFS + Decentralized Storage | Traditional EVM (Polygon / Arbitrum) | Centralized Postgres / Supabase | **Arkiv DB-Chain (Open Sanjivni)** |
| :--- | :--- | :--- | :--- | :--- |
| **Perishable Stock Lifecycle** | ❌ **Immutability Kills**: "4 units O-Neg" pinned to IPFS lives forever, misleading families after transfusion. | ⚠️ Costly smart contract cleanup transactions burn continuous gas. | ⚠️ Stale rows persist indefinitely unless background cron jobs succeed. | ✅ **Native Auto-Expiration**: `ExpirationTime.fromHours(4)` purges stale beacons at the protocol layer. |
| **Serverless Range Queries** | ❌ Cannot filter `unitsAvailable > 0 AND pincode = 492099` without a server. | ❌ Requires indexing layers (The Graph / Subgraphs) adding 30s-10m indexing lag. | ❌ Single Point of Failure; vulnerable to server crashes or censorship. | ✅ **Sub-Second RPC Queries**: `arkiv_query` / `select()` over JSON-RPC in &lt; 85ms. |
| **Operational Gas Overhead** | N/A (Storage fee only) | ❌ 50 inventory adjustments per day drains hospital operating budgets. | N/A (Server rental & DBA costs) | ✅ **Database-Optimized Gas**: Micro-transactions tailored for high-frequency database state. |
| **Censorship Resistance** | ⚠️ Gatekept pinning services (Infura/Pinata) can ban or geo-block. | ✅ Censorship-resistant. | ❌ Operators can delete competitor listings or paywall results. | ✅ **Keccak-MPT State Anchored**: Permanent cryptographic state proofs committed to Ethereum L1. |

---

## 🧩 3. Purposeful Utilization of Arkiv SDK Primitives

Open Sanjivni exercises the full suite of `@arkiv-network/sdk` v0.8.x capabilities:

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

## 🛡️ 4. Anon Aadhaar Zero-Knowledge Privacy Architecture (Zero PII Guarantee)

Open Sanjivni pairs Arkiv's native DB-Chain engine with **Anon Aadhaar** zero-knowledge Groth16 proofs to guarantee anti-scalper sybil protection and verified volunteer donor networks with **STRICT ZERO PII**:

* **Zero Raw PII on Arkiv**: In compliance with India's **DPDP Act**, no Aadhaar numbers, real names, phone numbers, or dates of birth are ever stored on-chain—not even hashed.
* **Cryptographic Groth16 Nullifier**: An anonymous deterministic nullifier derived from `Poseidon(AadhaarSignature, appSeed=492099108)` acts as an anonymous, un-linkable single-use identifier.
* **Feature #1 — 60-Minute Anti-Scalper Reservation (`emergency_lock`)**:
  - Sybil protection check prevents bots or hoarders from locking multiple rare blood or anti-venom units across a city.
  - Automatically written to Arkiv with `ExpirationTime.fromMinutes(60)`. If unclaimed at the casualty counter within 60 minutes, the lock auto-purges from the consensus state trie without gas cost.
  - Dispenses a zero-PII synthetic claim token: `ICU-REQ-XXXXXX`.
* **Feature #2 — ZK-Verified Standby Volunteer Donor Beacon (`volunteer_donor`)**:
  - Zero-stock emergency fallback: when hospital blood banks hit 0 units, families locate verified standby donors in their exact PIN code.
  - Age 18+ and residence PIN code are cryptographically enforced and locked directly by the Anon Aadhaar Groth16 proof (preventing location-spoofing).
  - Broadcasted to Arkiv with `ExpirationTime.fromHours(12)` readiness TTL and synthetic Matrix relay handle (`matrix_relay_0x...`).
* **Judge Accessibility Gate**: Includes a visible **"⚡ 1-Click Judge Demo"** button allowing international hackathon evaluators to test Groth16 ZK reservations and donor beacons immediately without needing an Indian physical Aadhaar card.

---

## 📋 5. Arkiv Entity Data Schemas

### Entity 1: `medical_beacon` (Active Hospital / Pharmacy Inventory)
* `type`: `str("medical_beacon")`
* `category`: `str("BLOOD" | "ANTI_VENOM" | "RABIES_VACCINE" | "JAN_AUSHADHI")`
* `itemCode`: `str("O_NEGATIVE" | "SNAKE_POLYVALENT" | "PARACETAMOL_650" | ...)`
* `pincode`: `i32(492099)` *(Indexed for geographical search & distance sorting)*
* `unitsAvailable`: `i32(4)` *(Indexed for range query: `unitsAvailable > i32(0)`)*
* `priceInr`: `dec("0.00")` *(₹0.00 for Govt supply, subsidized MRP for Jan Aushadhi)*
* `isEmergency24x7`: `str("YES" | "NO")`
* `status`: `str("ACTIVE" | "DEPLETED" | "EXPIRED")`
* **Expiration Policy**: Category-adaptive TTL (8h for Blood, 48h for Anti-Venom, 14d for Jan Aushadhi)

### Entity 2: `emergency_lock` (Anti-Scalper 60-Min Reservation)
* `type`: `str("emergency_lock")`
* `beaconKey`: `str(beaconEntityKey)`
* `zkNullifier`: `str(nullifier)` *(Groth16 anonymous commitment)*
* `verifiedPincode`: `i32(pincode)`
* `isAdultVerified`: `str("YES")`
* `status`: `str("LOCKED" | "CLAIMED" | "EXPIRED")`
* **Expiration Policy**: `ExpirationTime.fromMinutes(60)`

### Entity 3: `volunteer_donor` (Standby Volunteer Donor Beacon)
* `type`: `str("volunteer_donor")`
* `bloodGroup`: `str("O_NEGATIVE" | "B_NEGATIVE" | ...)`
* `pincode`: `i32(pincode)` *(Cryptographically locked to ZK proof)*
* `zkNullifier`: `str(nullifier)`
* `isAnonAadhaarVerified`: `str("YES")`
* `status`: `str("AVAILABLE" | "ENGAGED" | "EXPIRED")`
* **Expiration Policy**: `ExpirationTime.fromHours(12)`

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
* **0:45 - 1:25 (Enter Open Sanjivni)**: *"Open Sanjivni runs on the Arkiv DB-Chain. Certified blood banks and Jan Aushadhi stores broadcast stock directly from their wallets with a strict 4-hour expiration. If the facility desk does not actively extend the beacon, the listing automatically vanishes from the query layer. No stale data, no ad-driven bias, and zero commercial gatekeeping."*
* **1:25 - 2:25 (Live Tiramisu Demo)**: *"Watch our hospital portal on Tiramisu testnet. With one click, AIIMS Raipur broadcasts 4 units of O-Negative blood with `createEntity()` and `ExpirationTime.fromHours(4)`. In 2 seconds, it confirms. Now look at our citizen radar screen: querying `category = BLOOD AND itemCode = O_NEGATIVE AND unitsAvailable > 0` directly fetches live results in 80 milliseconds over RPC—no Subgraph, no centralized Postgres server. When a unit is transfused, the hospital clicks 'Dispense' (`patchEntity()`), or clicks 'Extend (+4h)' (`extendEntity()`)."*
* **2:25 - 3:00 (Public Goods Impact)**: *"Open Sanjivni stores zero personal health data, solves a life-or-death challenge for 1.4 billion people in India, and proves why Arkiv's time-scoped DB-Chain is the perfect foundation for decentralized public goods. Thank you!"*

---

## 📄 License
MIT License. Built for the **Arkiv Global Tour Stop (Road to Devcon 8 Mumbai)** hackathon.
