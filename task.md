# Open Sanjivni — Arkiv Hackathon Execution Tasks

## Hackathon Context
- **Hackathon**: Arkiv Global Tour Stop (Road to Devcon 8 Mumbai)
- **Target Tracks**: 
  - 🏆 **Best Indian Use Case** ($2,000 USDC + Devcon 8 Ticket)
  - 🛡️ **Censorship Resistance (Global)** ($750 USDC + Devcon 8 Ticket)
  - 🔒 **Security / CROPS Mandate**

---

## Task Checklist

### 1. Repository & Gate Policy
- [x] Configure `.gitignore` to allow mandatory gate documentation:
  - `!README.md`
  - `!arkiv/schema.md`
  - `!arkiv/friction.md`
  - `!task.md`

### 2. Mandatory Submission Gates
- [x] Create `/arkiv/schema.md`:
  - Complete schema definition of `medical_beacon` entity
  - Typed attributes (`str`, `i32`, `dec`)
  - 4-Hour TTL expiration model (`ExpirationTime.fromHours(4)`)
  - JSON-RPC query filters and serverless indexing
  - Authorized hospital wallet addresses on Tiramisu Testnet
- [x] Create `/arkiv/friction.md`:
  - 25-point judging rubric fulfillment
  - Specific, reproducible developer feedback on `@arkiv-network/sdk` v0.8.1 and Tiramisu RPC
  - In-place patching, transport helper typing, query parser subtleties, and state proof verification

### 3. Security & Institutional Access Control
- [x] Add **Desk Authorization Simulation** to `HospitalPortal.tsx`:
  - Whitelist of certified hospital wallet addresses (AIIMS Raipur, CIMS Bilaspur, Safdarjung)
  - Unauthorized Attendant / Citizen Wallet test option (`0x1111...1111`)
  - 1-click test toggles for hackathon judges
  - Clear access-denied state with blocked mutation capabilities

### 4. Public Trust & Censorship Resistance
- [x] Keep **State Proofs** public:
  - Re-affirm public verifiability primitive for citizens, NGOs, and investigative journalists
  - Highlight Keccak-MPT Merkle proofs (`eth_getProof`) as the anti-hoarding verification tool

### 5. Anon Aadhaar Zero-Knowledge Identity Integration
- [x] Configure `@anon-aadhaar/react` & `@anon-aadhaar/core` wrapper (`AnonAadhaarWrapper.tsx`):
  - Client-side safe dynamic loading to guarantee zero SSR hydration errors in Next.js 15
  - Mode toggle: Judge Test Aadhaar Mode (1-Click) vs Live UIDAI QR Scanner
- [x] Implement `useVerifiedCitizen.ts`:
  - Deterministic app seed: `nullifierSeed={492099108}`
  - Selective disclosure: `ageAbove18`, `pincode`, `state`
  - 1-Click Judge Demo fallback for instant international evaluation
- [x] Implement Feature #1: Anti-Scalper 60-Minute Emergency Reservation (`src/services/reserveStock.ts`):
  - Sybil protection query on Arkiv DB-Chain by `zkNullifier`
  - Auto-expiring `emergency_lock` with `ExpirationTime.fromMinutes(60)`
  - Synthetic claim token: `ICU-REQ-XXXXXX`
- [x] Implement Feature #2: Standby Volunteer Donor Beacon (`src/services/registerDonor.ts`):
  - Zero-stock fallback for families in critical ICU emergencies
  - Enforce age 18+ and lock `pincode` to Anon Aadhaar proof (anti-spoofing)
  - Auto-expiring `volunteer_donor` with `ExpirationTime.fromHours(12)`
  - Synthetic Matrix relay handle: `matrix_relay_0x...`
- [x] Build UI Components:
  - `<AnonAadhaarBadge />` status bar with 1-click judge demo & QR login
  - "Reserve 1 Unit (60m ZK Lock)" button on inventory cards
  - Active reservation ticket banner with live countdown timer
  - "Standby Volunteer Donors (Zero-Stock Fallback)" tab and broadcast modal
- [x] Update Gate Documentation:
  - Updated `/arkiv/schema.md` with `emergency_lock` and `volunteer_donor` schemas
  - Documented DPDP Act zero-PII cryptographic guarantees
  - Updated `README.md`

### 6. Verification & Submission Readiness
- [x] `pnpm tsc --noEmit` validation (0 errors)
- [x] Next.js dev server rendering validation (200 OK)
- [x] Gate files committed under `TrymbakMahant <trymbak0102mahant@gmail.com>`
