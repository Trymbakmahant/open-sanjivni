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

### 5. Verification & Submission Readiness
- [x] `pnpm tsc --noEmit` validation (0 errors)
- [x] State Proofs Anti-Hoarding Verification UI for Citizens & NGOs
- [x] Desk Authorization Simulation with 1-click Judge Toggles
- [x] Mandatory Gate Files (`arkiv/schema.md`, `arkiv/friction.md`)
- [x] Git commit under `TrymbakMahant <trymbak0102mahant@gmail.com>` with clean streak
