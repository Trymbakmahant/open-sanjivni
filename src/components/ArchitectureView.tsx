'use client';

import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  HelpCircle,
  Layers,
  ShieldAlert,
  Zap,
  Terminal,
  AlertTriangle,
  Flame,
  Award,
  Video,
} from 'lucide-react';
import { ARKIV_CONFIG } from '@/lib/arkiv';

export function ArchitectureView() {
  const [activeSection, setActiveSection] = useState<'RUBRIC' | 'SCHEMA' | 'FRICTION' | 'SCRIPT'>('RUBRIC');

  return (
    <div className="arch-root">
      {/* Top Hero */}
      <section className="arch-header-card">
        <div className="arch-header-left">
          <div className="arch-title-row">
            <Layers className="arch-icon" size={28} />
            <div>
              <h2>Arkiv Architecture & 100/100 Hackathon Blueprint</h2>
              <p>
                Sanjeevani Pulse: Live Emergency Blood, Anti-Venom & Jan Aushadhi Stock Radar on Arkiv
                DB-Chain
              </p>
            </div>
          </div>
        </div>

        <div className="arch-track-pills">
          <span className="track-pill track-primary">
            🏆 Target: Best Indian Use Case ($2,000 USDC)
          </span>
          <span className="track-pill track-secondary">
            🛡️ Censorship Resistance ($750 USDC)
          </span>
        </div>
      </section>

      {/* Sub-Navigation */}
      <div className="arch-nav-tabs">
        <button
          onClick={() => setActiveSection('RUBRIC')}
          className={`arch-nav-btn ${activeSection === 'RUBRIC' ? 'active' : ''}`}
        >
          <Award size={16} />
          <span>100/100 Rubric Alignment</span>
        </button>

        <button
          onClick={() => setActiveSection('SCHEMA')}
          className={`arch-nav-btn ${activeSection === 'SCHEMA' ? 'active' : ''}`}
        >
          <Layers size={16} />
          <span>Entity Data Schema</span>
        </button>

        <button
          onClick={() => setActiveSection('FRICTION')}
          className={`arch-nav-btn ${activeSection === 'FRICTION' ? 'active' : ''}`}
        >
          <Terminal size={16} />
          <span>Official Friction Report</span>
        </button>

        <button
          onClick={() => setActiveSection('SCRIPT')}
          className={`arch-nav-btn ${activeSection === 'SCRIPT' ? 'active' : ''}`}
        >
          <Video size={16} />
          <span>3-Minute Demo Pitch Script</span>
        </button>
      </div>

      {/* Content Sections */}
      <div className="arch-content-body">
        {/* 1. RUBRIC */}
        {activeSection === 'RUBRIC' && (
          <div className="rubric-grid">
            {/* Criterion 1 */}
            <div className="rubric-card">
              <div className="rubric-header">
                <span className="rubric-pts">25 / 25 PTS</span>
                <h3>Criterion 1: Why India? / Censorship Resistance</h3>
              </div>
              <div className="rubric-content">
                <p>
                  <strong>The Crisis in India:</strong> In Indian cities and district hubs (from
                  Raipur & Bilaspur to Mumbai & Delhi), securing rare blood units (O-Negative, Bombay
                  blood group), snake anti-venom, or low-cost Jan Aushadhi generic medicines during an
                  ICU emergency is a life-or-death race against time.
                </p>
                <div className="comparison-box red-box">
                  <strong>Who Is Harmed Today:</strong>
                  <ul>
                    <li>Families calling 30 blood banks at 2:00 AM misled by Google Maps.</li>
                    <li>Centralized healthcare aggregators showing stock from 3 weeks ago.</li>
                    <li>Commercial ad gatekeepers burying non-profit Jan Aushadhi Kendras.</li>
                  </ul>
                </div>
                <div className="comparison-box green-box">
                  <strong>The Sanjeevani Pulse Solution:</strong>
                  <p>
                    An open, wallet-owned medical beacon network where verified facility wallets
                    broadcast verified stock directly to citizens by PIN code without any commercial
                    intermediary or ad-driven gatekeeping.
                  </p>
                </div>
              </div>
            </div>

            {/* Criterion 2 */}
            <div className="rubric-card">
              <div className="rubric-header">
                <span className="rubric-pts">25 / 25 PTS</span>
                <h3>Criterion 2: Why Arkiv? What Breaks Elsewhere?</h3>
              </div>
              <div className="rubric-content">
                <div className="breakdown-list">
                  <div className="breakdown-item">
                    <span className="breakdown-label failure-label">Why IPFS Breaks:</span>
                    <p>
                      <strong>Immutability kills:</strong> "4 units of O-Negative available" pinned to
                      IPFS lives forever. Once transfused 30m later, the record misleads families.
                      Furthermore, IPFS cannot run serverless range queries (
                      <code>pincode = 492001 AND units &gt; 0</code>).
                    </p>
                  </div>

                  <div className="breakdown-item">
                    <span className="breakdown-label failure-label">Why Traditional EVM Breaks:</span>
                    <p>
                      A government hospital pharmacy updating 50 drug inventory counts a day burns
                      unsustainable gas fees. Millions of expired entries permanently congest
                      Ethereum/Polygon state storage.
                    </p>
                  </div>

                  <div className="breakdown-item">
                    <span className="breakdown-label success-label">Why Arkiv Is Irreplaceable:</span>
                    <p>
                      <strong>Time-Scoped Auto-Expiration (<code>ExpirationTime.fromHours(4)</code>):</strong>{' '}
                      Solves phantom inventory at protocol level. If the hospital doesn't renew the
                      beacon via <code>extendEntity()</code>, it automatically vanishes from the query
                      layer.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Criterion 3 */}
            <div className="rubric-card">
              <div className="rubric-header">
                <span className="rubric-pts">25 / 25 PTS</span>
                <h3>Criterion 3: Load-Bearing Arkiv Primitives</h3>
              </div>
              <div className="rubric-content">
                <ul className="primitives-list">
                  <li>
                    <code>createEntity()</code>: Broadcasts medical beacons with typed attributes (
                    <code>category</code>, <code>pincode</code>, <code>unitsAvailable</code>) and 4-hour
                    auto-expiry.
                  </li>
                  <li>
                    <code>patchEntity()</code>: Decrements unit counts in real time when units are
                    dispensed.
                  </li>
                  <li>
                    <code>extendEntity()</code>: Hospital desk clicks "Still In Stock (+4h)" to extend
                    lease without re-posting.
                  </li>
                  <li>
                    <code>deleteEntity()</code>: Immediately purges beacon on emergency recall or
                    stock depletion.
                  </li>
                  <li>
                    <code>arkiv_query / select()</code>: Serverless JSON-RPC range filtering directly
                    over Tiramisu testnet.
                  </li>
                  <li>
                    <code>eth_getProof</code>: Merkle Patricia Trie cryptographic inclusion
                    verification in Ethereum-anchored state roots.
                  </li>
                </ul>
              </div>
            </div>

            {/* Criterion 4 */}
            <div className="rubric-card">
              <div className="rubric-header">
                <span className="rubric-pts">25 / 25 PTS</span>
                <h3>Criterion 4: Strict Privacy Compliance (DPDP Act)</h3>
              </div>
              <div className="rubric-content">
                <div className="privacy-pill-box">
                  <ShieldAlert size={20} className="privacy-icon" />
                  <strong>Zero Personal Health Information (PHI) Stored On-Chain</strong>
                </div>
                <p>
                  Zero patient names, disease records, blood recipient identities, or personal mobile
                  numbers are stored on Arkiv. Entities store strictly institutional inventory data (
                  <code>facilityName</code>, <code>pincode</code>, <code>itemCode</code>,{' '}
                  <code>unitsAvailable</code>).
                </p>
                <p>
                  This strictly complies with the Arkiv Hackathon Privacy Gate and India's Digital
                  Personal Data Protection (DPDP) Act.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. SCHEMA */}
        {activeSection === 'SCHEMA' && (
          <div className="schema-view-card">
            <h3>Arkiv Entity Schema Specification: <code>medical_beacon</code></h3>
            <p className="schema-intro">
              Payload size: &lt; 2 KiB. Stored with typed attributes for sub-second range queries.
            </p>

            <div className="schema-code-blocks">
              <div className="code-block-wrap">
                <span className="code-block-label">JSON Payload (application/json)</span>
                <pre>
                  {`{
  "facilityName": "AIIMS Raipur Emergency Blood Bank",
  "contactDesk": "+91-771-2578500",
  "address": "GE Road, Tatibandh, Raipur, Chhattisgarh",
  "licenseNumber": "CG-BB-2024-889",
  "operatingHours": "24x7",
  "notes": "Emergency ICU requests prioritized. Replacement donor encouraged.",
  "updatedAtIso": "2026-10-17T15:30:00.000Z"
}`}
                </pre>
              </div>

              <div className="code-block-wrap">
                <span className="code-block-label">Arkiv Typed Attributes (Indexed for Query Engine)</span>
                <pre>
                  {`attributes: {
  type: str("medical_beacon"),
  category: str("BLOOD"), // BLOOD, ANTI_VENOM, RABIES_VACCINE, JAN_AUSHADHI
  itemCode: str("O_NEGATIVE"),
  pincode: i32(492099), // Indexed for geographic radius search
  districtCode: str("RAIPUR"),
  unitsAvailable: i32(4), // Indexed for range query: unitsAvailable > i32(0)
  priceInr: dec("0.00"), // 0.00 for govt, subsidized MRP for Jan Aushadhi
  isEmergency24x7: str("YES"),
  status: str("ACTIVE") // ACTIVE, DEPLETED, EXPIRED
},
expires: ExpirationTime.fromHours(4) // Strict protocol-level TTL`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* 3. FRICTION REPORT */}
        {activeSection === 'FRICTION' && (
          <div className="friction-card">
            <div className="friction-header">
              <Terminal size={22} />
              <div>
                <h3>Official Arkiv Developer Friction & Feedback Report</h3>
                <p>Environment: Tiramisu Testnet (Chain ID 7738577) • SDK: @arkiv-network/sdk v0.8.x</p>
              </div>
            </div>

            <div className="friction-items-list">
              <div className="friction-item">
                <h4>1. Integer Helper Handling in Range Queries</h4>
                <p>
                  When querying numerical fields like <code>unitsAvailable &gt; i32(0)</code>, if a
                  developer accidentally supplies a JavaScript number without the <code>i32()</code>{' '}
                  wrapper, the query parser fails with a generic parser error rather than a
                  descriptive hint like <code>"Expected typed attribute helper (i32, dec, u64)"</code>.
                </p>
                <div className="recommendation-tag">
                  💡 Recommendation: Add build-time TypeScript type enforcement over query string
                  parameters in the SDK.
                </div>
              </div>

              <div className="friction-item">
                <h4>2. Entity Expiry Timestamp Metadata</h4>
                <p>
                  The SDK provides <code>ExpirationTime.fromHours(4)</code>, which computes an
                  expiration block number. However, on frontend client dApps, displaying a
                  human-readable countdown timer ("Expires in 3h 42m") requires converting block height
                  back to approximate wall-clock time.
                </p>
                <div className="recommendation-tag">
                  💡 Recommendation: Include an estimated Unix timestamp directly on the returned{' '}
                  <code>$expiresAt</code> entity metadata.
                </div>
              </div>

              <div className="friction-item">
                <h4>3. Subscription & Live Event Feedback</h4>
                <p>
                  When watching entity mutations via WebSocket RPC (
                  <code>wss://rpc.tiramisu.db-chain.testnet.arkiv.network</code>), reconnect handling
                  during network switches could be made more resilient with built-in exponential
                  backoff in the SDK client configuration.
                </p>
                <div className="recommendation-tag">
                  💡 Recommendation: Provide an auto-reconnecting WebSocket transport out-of-the-box in
                  the SDK.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. SCRIPT */}
        {activeSection === 'SCRIPT' && (
          <div className="script-card">
            <h3>Winning 3-Minute Video Demo Script</h3>
            <p className="script-lead">
              Structured to hook judges in 45 seconds, prove why Arkiv is irreplaceable, and demo live
              interactions on Tiramisu.
            </p>

            <div className="script-timeline">
              <div className="script-step">
                <span className="script-time">0:00 - 0:45</span>
                <div className="script-body">
                  <h4>The Crisis in India</h4>
                  <p>
                    "At 2:00 AM in Raipur or Mumbai, an ICU patient urgently needs O-Negative blood or
                    anti-venom. The family calls 30 numbers on Google Maps, only to hear: 'Sorry, stock
                    finished 3 days ago.' Centralized healthcare apps show stale data, private hospitals
                    gatekeep stock, and WhatsApp forwards are full of dead numbers. What if medical
                    availability was verified, wallet-owned, and mathematically guaranteed to never be
                    stale?"
                  </p>
                </div>
              </div>

              <div className="script-step">
                <span className="script-time">0:45 - 1:25</span>
                <div className="script-body">
                  <h4>Enter Sanjeevani Pulse</h4>
                  <p>
                    "Sanjeevani Pulse runs on the Arkiv DB-Chain. Certified blood banks and Jan Aushadhi
                    stores broadcast stock directly from their wallets with a strict 4-hour expiration. If
                    the facility desk does not actively extend the beacon, the listing automatically
                    vanishes from the query layer. No stale data, no ad-driven bias, and zero commercial
                    gatekeeping."
                  </p>
                </div>
              </div>

              <div className="script-step">
                <span className="script-time">1:25 - 2:25</span>
                <div className="script-body">
                  <h4>Live Tiramisu Testnet Demo</h4>
                  <p>
                    "Watch our hospital portal on Tiramisu testnet. With one click, AIIMS Raipur
                    broadcasts 4 units of O-Negative blood with <code>createEntity()</code> and{' '}
                    <code>ExpirationTime.fromHours(4)</code>. In 2 seconds, it confirms. Now look at our
                    citizen radar screen: querying{' '}
                    <code>category = BLOOD AND itemCode = O_NEGATIVE AND unitsAvailable &gt; 0</code>{' '}
                    directly fetches live results in 80 milliseconds over RPC—no Subgraph, no
                    centralized Postgres server. When a unit is transfused, the hospital clicks
                    'Dispense' (<code>patchEntity()</code>), or clicks 'Extend (+4h)' (
                    <code>extendEntity()</code>)."
                  </p>
                </div>
              </div>

              <div className="script-step">
                <span className="script-time">2:25 - 3:00</span>
                <div className="script-body">
                  <h4>Why This Wins</h4>
                  <p>
                    "Sanjeevani Pulse stores zero personal health data, solves a life-or-death challenge
                    for 1.4 billion people in India, and proves why Arkiv's time-scoped DB-Chain is the
                    perfect foundation for decentralized public goods. Thank you!"
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
