'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Hospital,
  PlusCircle,
  Clock,
  MinusCircle,
  RefreshCw,
  Trash2,
  Check,
  AlertCircle,
  Activity,
  History,
  Send,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Wallet,
  ExternalLink,
  Zap,
  Plus,
  Minus,
  Copy,
  Globe,
} from 'lucide-react';
import { FacilityPreset, BeaconCategory, MedicalBeacon, BroadcastStockParams } from '@/types/beacon';
import { INDIAN_FACILITIES, AVAILABLE_ITEM_CODES } from '@/data/seedData';
import { beaconStore, ArkivAuditLog } from '@/lib/beaconStore';
import { broadcastMedicalStock } from '@/services/broadcastStock';
import { dispenseUnits, extendStockBeacon, deleteStockBeacon } from '@/services/manageStock';
import { playEmergencyChimeSound } from '@/lib/audioAlert';
import { publicClient, ARKIV_CONFIG } from '@/lib/arkiv';
import { formatEther } from 'viem';
import {
  isMetaMaskInstalled,
  getEthereumProvider,
  connectMetaMask,
  switchToTiramisuNetwork,
  getMetaMaskArkivClient,
  isTiramisuChain,
  TIRAMISU_CHAIN_ID_HEX,
  MetaMaskState,
} from '@/lib/metamask';

interface HospitalPortalProps {
  soundEnabled: boolean;
  onInspectProof: (beacon: MedicalBeacon) => void;
}

export function HospitalPortal({ soundEnabled, onInspectProof }: HospitalPortalProps) {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('aiims-raipur');
  const [beacons, setBeacons] = useState<MedicalBeacon[]>([]);
  const [auditLogs, setAuditLogs] = useState<ArkivAuditLog[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<{
    entityKey: string;
    txHash: string;
    itemLabel: string;
    units: number;
    blockNumber: number;
    facilityName: string;
    walletAddress: string;
    beacon: MedicalBeacon;
  } | null>(null);
  const [copiedSuccessField, setCopiedSuccessField] = useState<string | null>(null);

  const handleCopySuccessField = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSuccessField(field);
    setTimeout(() => setCopiedSuccessField(null), 2000);
  };

  // MetaMask Web3 State
  const [metaMaskState, setMetaMaskState] = useState<MetaMaskState>({
    isInstalled: false,
    isConnected: false,
    account: null,
    chainId: null,
    isCorrectNetwork: false,
    balanceGlm: '0.00',
  });
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState(false);
  const [useMetaMaskBroadcast, setUseMetaMaskBroadcast] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalNotice, setPortalNotice] = useState<string | null>(null);

  // Form state
  const [formCategory, setFormCategory] = useState<BeaconCategory>('BLOOD');
  const [formItemCode, setFormItemCode] = useState<string>('O_NEGATIVE');
  const [formUnits, setFormUnits] = useState<number | string>(4);
  const [formTtlHours, setFormTtlHours] = useState<number>(8); // Category-adaptive default
  const [formPrice, setFormPrice] = useState<string>('0.00');
  const [formNotes, setFormNotes] = useState<string>(
    'Emergency ICU cases prioritized. Immediate crossmatch desk active.'
  );

  const isAuthorized = selectedFacilityId !== 'unauthorized-citizen' || (useMetaMaskBroadcast && metaMaskState.isConnected);

  const currentFacility = useMemo(() => {
    return (
      INDIAN_FACILITIES.find((f) => f.id === selectedFacilityId) || INDIAN_FACILITIES[0]
    );
  }, [selectedFacilityId]);

  // Sync beacons and logs
  useEffect(() => {
    setBeacons(beaconStore.getBeacons());
    setAuditLogs(beaconStore.getAuditLogs());

    const unsubscribe = beaconStore.subscribe(() => {
      setBeacons(beaconStore.getBeacons());
      setAuditLogs(beaconStore.getAuditLogs());
    });
    return unsubscribe;
  }, []);

  // Check MetaMask presence and existing accounts
  useEffect(() => {
    const provider = getEthereumProvider();
    if (provider) {
      setMetaMaskState((prev) => ({ ...prev, isInstalled: true }));

      provider
        .request({ method: 'eth_accounts' })
        .then(async (accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            const account = accounts[0] as `0x${string}`;
            const chainId = await provider.request({ method: 'eth_chainId' });
            const isCorrect = isTiramisuChain(chainId);
            let balanceGlm = '0.00';
            try {
              const rawBal = await publicClient.getBalance({ address: account });
              balanceGlm = parseFloat(formatEther(rawBal)).toFixed(4);
            } catch {}
            setMetaMaskState({
              isInstalled: true,
              isConnected: true,
              account,
              chainId,
              isCorrectNetwork: isCorrect,
              balanceGlm,
            });
            setUseMetaMaskBroadcast(true);
          }
        })
        .catch(() => {});

      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          setMetaMaskState((prev) => ({
            ...prev,
            isConnected: false,
            account: null,
            balanceGlm: '0.00',
          }));
          setUseMetaMaskBroadcast(false);
        } else {
          const account = accounts[0] as `0x${string}`;
          let balanceGlm = '0.00';
          try {
            const rawBal = await publicClient.getBalance({ address: account });
            balanceGlm = parseFloat(formatEther(rawBal)).toFixed(4);
          } catch {}
          setMetaMaskState((prev) => ({
            ...prev,
            isConnected: true,
            account,
            balanceGlm,
          }));
          setUseMetaMaskBroadcast(true);
        }
      };

      const handleChainChanged = (newChainId: string) => {
        setMetaMaskState((prev) => ({
          ...prev,
          chainId: newChainId,
          isCorrectNetwork: isTiramisuChain(newChainId),
        }));
      };

      provider.on?.('accountsChanged', handleAccountsChanged);
      provider.on?.('chainChanged', handleChainChanged);

      return () => {
        provider.removeListener?.('accountsChanged', handleAccountsChanged);
        provider.removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const handleConnectMetaMask = async () => {
    setIsConnectingMetaMask(true);
    try {
      const res = await connectMetaMask();
      setMetaMaskState({
        isInstalled: true,
        isConnected: true,
        account: res.account,
        chainId: res.chainId,
        isCorrectNetwork: res.isCorrectNetwork,
        balanceGlm: res.balanceGlm,
      });
      setUseMetaMaskBroadcast(true);
    } catch (err: any) {
      setPortalError(err?.message || 'Failed to connect MetaMask');
    } finally {
      setIsConnectingMetaMask(false);
    }
  };

  const handleSwitchNetwork = async () => {
    const ok = await switchToTiramisuNetwork();
    const provider = getEthereumProvider();
    if (ok && provider) {
      const chainId = await provider.request({ method: 'eth_chainId' });
      setMetaMaskState((prev) => ({
        ...prev,
        chainId,
        isCorrectNetwork: isTiramisuChain(chainId),
      }));
    }
  };

  // Update default items and category-adaptive TTL when category changes
  useEffect(() => {
    const items = AVAILABLE_ITEM_CODES.filter((i) => i.category === formCategory);
    if (items.length > 0) {
      setFormItemCode(items[0].code);
      if (formCategory === 'BLOOD') {
        setFormPrice('0.00');
        setFormTtlHours(8); // 8 Hours (1 Nursing Shift)
      } else if (formCategory === 'ANTI_VENOM' || formCategory === 'RABIES_VACCINE') {
        setFormPrice('0.00');
        setFormTtlHours(48); // 48 Hours (2-Day Cold-Chain Audit)
      } else if (formCategory === 'JAN_AUSHADHI') {
        setFormPrice('14.50');
        setFormTtlHours(336); // 14 Days (Bi-weekly Pharmacy Quota)
      }
    }
  }, [formCategory]);

  // Filter beacons for current facility
  const facilityBeacons = useMemo(() => {
    const activeAddress = (useMetaMaskBroadcast && metaMaskState.account)
      ? metaMaskState.account.toLowerCase()
      : currentFacility.walletAddress.toLowerCase();

    return beacons.filter(
      (b) =>
        b.payload.facilityName.toLowerCase().includes(currentFacility.facilityName.slice(0, 10).toLowerCase()) ||
        b.owner.toLowerCase() === activeAddress
    );
  }, [beacons, currentFacility, useMetaMaskBroadcast, metaMaskState.account]);

  // Handle broadcast
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      setPortalError('Access Denied: Unregistered public wallet cannot broadcast medical stock. Please select a certified hospital desk or connect an authorized wallet.');
      return;
    }
    setIsBroadcasting(true);
    setBroadcastSuccess(null);

    try {
      let walletClient: any = null;
      let broadcastAddress = currentFacility.walletAddress;

      // If user enabled MetaMask mode, sign using real MetaMask wallet client
      if (useMetaMaskBroadcast && metaMaskState.isConnected && metaMaskState.account) {
        if (!metaMaskState.isCorrectNetwork) {
          setPortalError('Network Mismatch: Please switch your wallet to the Arkiv Tiramisu Testnet (Chain ID 7738577).');
          await handleSwitchNetwork();
          setIsBroadcasting(false);
          return;
        }
        walletClient = getMetaMaskArkivClient(metaMaskState.account);
        broadcastAddress = metaMaskState.account;
      }

      const parsedUnits = Math.max(1, Number(formUnits) || 1);
      const params: BroadcastStockParams = {
        facilityName: currentFacility.facilityName,
        contactDesk: currentFacility.contactDesk,
        address: currentFacility.address,
        licenseNumber: currentFacility.licenseNumber,
        category: formCategory,
        itemCode: formItemCode,
        pincode: currentFacility.pincode,
        districtCode: currentFacility.districtCode,
        unitsAvailable: parsedUnits,
        priceInr: formPrice,
        notes: formNotes,
        isEmergency24x7: true,
        ttlHours: formTtlHours,
      };

      const result = await broadcastMedicalStock(walletClient, params, broadcastAddress);
      if (result.success) {
        const itemDef = AVAILABLE_ITEM_CODES.find((i) => i.code === params.itemCode);
        setBroadcastSuccess({
          entityKey: result.entityKey,
          txHash: result.txHash,
          itemLabel: itemDef ? itemDef.label : params.itemCode,
          units: params.unitsAvailable,
          blockNumber: result.beacon.blockNumber,
          facilityName: currentFacility.facilityName,
          walletAddress: broadcastAddress,
          beacon: result.beacon,
        });
        if (soundEnabled) playEmergencyChimeSound();
      }
    } catch (err: any) {
      console.error('Broadcast failed:', err);
      const msg = err?.message || String(err);
      if (msg.includes('insufficient funds') || msg.includes('gas')) {
        setPortalError(
          'MetaMask Gas Error: Your wallet does not have enough test GLM on Arkiv Tiramisu to pay for transaction gas. Please claim free testnet tokens from the Arkiv Hub Faucet (https://hub.arkiv.network/faucet), or switch to "Simulated Desk Mode" to broadcast without spending tokens.'
        );
      } else if (msg.includes('rejected') || msg.includes('denied') || msg.includes('User rejected')) {
        setPortalNotice('Notice: Transaction signature was cancelled in your wallet.');
      } else {
        setPortalError(`Broadcast error: ${msg}`);
      }
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDispense = async (beacon: MedicalBeacon) => {
    if (!isAuthorized) {
      setPortalError('Access Denied: Only certified hospital desk wallets can mutate inventory beacons.');
      return;
    }
    try {
      let walletClient = null;
      if (useMetaMaskBroadcast && metaMaskState.isConnected && metaMaskState.account) {
        walletClient = getMetaMaskArkivClient(metaMaskState.account);
      }
      await dispenseUnits(walletClient, beacon.key, beacon.attributes.unitsAvailable);
      if (soundEnabled) playEmergencyChimeSound();
    } catch (e: any) {
      console.error('Dispense failed', e);
      setPortalError('Dispense error: ' + (e?.message || e));
    }
  };

  const handleExtend = async (beacon: MedicalBeacon) => {
    if (!isAuthorized) {
      setPortalError('Access Denied: Only certified hospital desk wallets can extend inventory leases.');
      return;
    }
    try {
      let walletClient = null;
      if (useMetaMaskBroadcast && metaMaskState.isConnected && metaMaskState.account) {
        walletClient = getMetaMaskArkivClient(metaMaskState.account);
      }
      await extendStockBeacon(walletClient, beacon.key);
      setPortalNotice('Beacon lease extended by +4 Hours (+7,200 blocks) on Arkiv DB-Chain!');
    } catch (e: any) {
      console.error('Extend failed', e);
      setPortalError('Extend error: ' + (e?.message || e));
    }
  };

  const handleDelete = async (beacon: MedicalBeacon) => {
    if (!isAuthorized) {
      setPortalError('Access Denied: Only certified hospital desk wallets can recall inventory.');
      return;
    }
    if (confirm('Execute emergency recall for this listing? It will immediately purge from Arkiv.')) {
      try {
        let walletClient = null;
        if (useMetaMaskBroadcast && metaMaskState.isConnected && metaMaskState.account) {
          walletClient = getMetaMaskArkivClient(metaMaskState.account);
        }
        await deleteStockBeacon(walletClient, beacon.key);
      } catch (e: any) {
        console.error('Delete failed', e);
        setPortalError('Delete error: ' + (e?.message || e));
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Dynamic Error Banner (Replaces disruptive browser alert) */}
      {portalError && (
        <div className="bg-rose-950/90 border border-rose-500/60 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3 text-rose-200 shadow-xl animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-sm font-bold text-rose-300">Action Required:</strong>
              <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed break-words">{portalError}</p>
            </div>
          </div>
          <button
            onClick={() => setPortalError(null)}
            className="text-rose-400 hover:text-rose-200 text-lg leading-none p-1 rounded-lg hover:bg-rose-900/50"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dynamic Notice Banner */}
      {portalNotice && (
        <div className="bg-emerald-950/90 border border-emerald-500/60 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3 text-emerald-200 shadow-xl animate-in fade-in">
          <div className="flex items-start gap-3">
            <Check size={22} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-sm font-bold text-emerald-300">Notice:</strong>
              <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed break-words">{portalNotice}</p>
            </div>
          </div>
          <button
            onClick={() => setPortalNotice(null)}
            className="text-emerald-400 hover:text-emerald-200 text-lg leading-none p-1 rounded-lg hover:bg-emerald-900/50"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Hospital size={26} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Open Sanjivni Hospital &amp; Jan Aushadhi Desk Portal</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Broadcast, dispense, and extend time-scoped inventory directly from verified medical wallets to Arkiv DB-Chain.
            </p>
          </div>
        </div>

        {/* Facility Selector */}
        <div className="w-full md:w-auto min-w-[280px] bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-1.5">
          <label htmlFor="facility-dropdown" className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Active Verified Desk
          </label>
          <select
            id="facility-dropdown"
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="w-full bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
          >
            {INDIAN_FACILITIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.facilityName} ({f.districtCode} - PIN {f.pincode})
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 truncate">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAuthorized ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
            <span className="truncate">
              {useMetaMaskBroadcast && metaMaskState.account ? metaMaskState.account : currentFacility.walletAddress}
            </span>
          </div>
        </div>
      </section>

      {/* Live Web3 MetaMask Connection Bar */}
      <section className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-orange-500/25 shrink-0">
              🦊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  MetaMask Web3 Mode: Live On-Chain Signatures
                </h3>
                {metaMaskState.isConnected ? (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Wallet Connected
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {metaMaskState.isConnected
                  ? `Connected: ${metaMaskState.account?.slice(0, 8)}...${metaMaskState.account?.slice(-6)} • Balance: ${metaMaskState.balanceGlm} GLM`
                  : 'Connect your MetaMask extension to broadcast real on-chain medical beacons directly to the Arkiv Tiramisu DB-Chain with wallet signatures.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap">
            {!metaMaskState.isConnected ? (
              <button
                type="button"
                onClick={handleConnectMetaMask}
                disabled={isConnectingMetaMask}
                className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-orange-600/25 transition-all flex items-center gap-2"
              >
                <Wallet size={15} />
                <span>{isConnectingMetaMask ? 'Connecting MetaMask...' : 'Connect MetaMask (Real Signing)'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {!metaMaskState.isCorrectNetwork ? (
                  <button
                    type="button"
                    onClick={handleSwitchNetwork}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Zap size={14} />
                    <span>Switch to Arkiv Tiramisu</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Tiramisu Testnet (7738577)
                  </span>
                )}

                <a
                  href="https://hub.arkiv.network/faucet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-200 transition-all flex items-center gap-1"
                  title="Claim free test GLM tokens to pay for Arkiv gas"
                >
                  <ExternalLink size={13} />
                  <span>Get Free GLM (Faucet)</span>
                </a>

                <button
                  type="button"
                  onClick={() => setUseMetaMaskBroadcast((prev) => !prev)}
                  className={`text-xs font-extrabold px-3 py-2 rounded-xl border transition-all ${
                    useMetaMaskBroadcast
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {useMetaMaskBroadcast ? '✓ Using MetaMask Signing' : 'Using Desk Simulation'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Security & Access Control Banner */}
      <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        isAuthorized
          ? 'bg-slate-900 border-slate-800 text-white shadow-md'
          : 'bg-rose-950/90 border-rose-800 text-rose-50 shadow-md'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isAuthorized ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-300 animate-pulse'
            }`}>
              {isAuthorized ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base">
                  Institutional Access Control (EIP-712 Registry Whitelist)
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  isAuthorized
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                }`}>
                  {isAuthorized ? 'Verified Desk' : 'Access Restricted'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAuthorized
                  ? 'Only whitelisted medical authority wallets can broadcast, dispense, or mutate beacons on Arkiv DB-Chain.'
                  : 'Simulated unauthorized caller. Mutation transactions are blocked by consensus whitelist to prevent spoofed stock.'}
              </p>
            </div>
          </div>

          {/* 1-Click Simulation Buttons for Hackathon Judges */}
          <div className="flex items-center gap-2 self-stretch md:self-auto bg-black/30 p-1.5 rounded-xl border border-white/10 shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pl-2">
              Judge Test:
            </span>
            <button
              onClick={() => setSelectedFacilityId('aiims-raipur')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedFacilityId === 'aiims-raipur'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              AIIMS Desk (Authorized)
            </button>
            <button
              onClick={() => setSelectedFacilityId('unauthorized-citizen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedFacilityId === 'unauthorized-citizen'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Unauthorized Attendant (Blocked)
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Broadcast Form & Active Beacons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Broadcast Form */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PlusCircle size={20} className="text-rose-600" />
                <h3 className="font-extrabold text-lg text-slate-900">1-Click Broadcast Medical Beacon</h3>
              </div>
              <span className="bg-sky-50 text-sky-600 text-[10px] font-extrabold px-2.5 py-1 rounded font-mono">
                createEntity()
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Publishes live availability directly to the Arkiv DB engine. Signed with{' '}
              <strong className="text-slate-800">ExpirationTime.fromHours(4)</strong> to mathematically eliminate phantom stock.
            </p>

            {broadcastSuccess && (
              <div className="bg-emerald-50/90 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 text-xs text-slate-800 space-y-3.5 shadow-md shadow-emerald-500/10 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-black text-emerald-950">
                          Broadcast Confirmed On-Chain!
                        </strong>
                        <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-300 text-emerald-800">
                          Block #{broadcastSuccess.blockNumber.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                        {broadcastSuccess.units} Units of {broadcastSuccess.itemLabel} published live.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setBroadcastSuccess(null)}
                    className="text-slate-400 hover:text-slate-700 text-sm p-1 leading-none rounded-lg hover:bg-emerald-100/60 transition-colors"
                    aria-label="Dismiss banner"
                  >
                    ✕
                  </button>
                </div>

                {/* On-Chain Hashes & Keys */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {/* Entity Key Box */}
                  <div className="bg-white/80 border border-emerald-200/80 rounded-xl p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>Arkiv Entity Key</span>
                      <button
                        type="button"
                        onClick={() => handleCopySuccessField(broadcastSuccess.entityKey, 'entityKey')}
                        className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-semibold"
                      >
                        {copiedSuccessField === 'entityKey' ? (
                          <>
                            <Check size={10} className="text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={10} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <code className="block font-mono text-[10px] text-slate-800 truncate select-all">
                      {broadcastSuccess.entityKey}
                    </code>
                  </div>

                  {/* Transaction Hash Box */}
                  <div className="bg-white/80 border border-emerald-200/80 rounded-xl p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>Transaction Hash</span>
                      <button
                        type="button"
                        onClick={() => handleCopySuccessField(broadcastSuccess.txHash, 'txHash')}
                        className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-semibold"
                      >
                        {copiedSuccessField === 'txHash' ? (
                          <>
                            <Check size={10} className="text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={10} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <code className="block font-mono text-[10px] text-slate-800 truncate select-all">
                      {broadcastSuccess.txHash}
                    </code>
                  </div>
                </div>

                {/* Direct Explorer Verification Links */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <a
                    href={`${ARKIV_CONFIG.explorerUrl}/tx/${broadcastSuccess.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[200px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <ExternalLink size={14} />
                    <span>View on Arkiv Explorer (TX) ↗</span>
                  </a>

                  <a
                    href={`${ARKIV_CONFIG.explorerUrl}/address/${broadcastSuccess.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Globe size={13} className="text-sky-600" />
                    <span>Facility Wallet ↗</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => onInspectProof(broadcastSuccess.beacon)}
                    className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <ShieldCheck size={14} className="text-sky-600" />
                    <span>Verify State Proof</span>
                  </button>
                </div>
              </div>
            )}

            {!isAuthorized && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 text-xs text-rose-800">
                <Lock size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Write Access Denied</strong>
                  <p className="text-rose-600 mt-0.5">
                    Wallet <code className="font-mono">{currentFacility.walletAddress.slice(0, 10)}...</code> is not in the authorized hospital registry. Switch to a verified desk above to test Arkiv broadcast.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Supply Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['BLOOD', 'ANTI_VENOM', 'RABIES_VACCINE', 'JAN_AUSHADHI'] as BeaconCategory[]).map(
                    (cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setFormCategory(cat)}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all ${
                          formCategory === cat
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        {cat === 'BLOOD' && '🩸 Blood Group'}
                        {cat === 'ANTI_VENOM' && '🐍 Anti-Venom'}
                        {cat === 'RABIES_VACCINE' && '💉 Rabies Vac'}
                        {cat === 'JAN_AUSHADHI' && '💊 Jan Aushadhi'}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Item Code */}
              <div className="space-y-1.5">
                <label htmlFor="form-item-code" className="text-xs font-extrabold text-slate-700">
                  Specific Item
                </label>
                <select
                  id="form-item-code"
                  value={formItemCode}
                  onChange={(e) => setFormItemCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  {AVAILABLE_ITEM_CODES.filter((i) => i.category === formCategory).map((i) => (
                    <option key={i.code} value={i.code}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Units & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Units Available with +1 / -1 Stepper and Backspace Fix */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="form-units" className="text-xs font-extrabold text-slate-700">
                      Units Available
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">1 - 500</span>
                  </div>

                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent transition-all">
                    <button
                      type="button"
                      onClick={() => setFormUnits((prev) => Math.max(1, (Number(prev) || 1) - 1))}
                      className="w-10 h-11 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 active:scale-95 transition-all font-bold text-lg border-r border-slate-200/80 shrink-0"
                      aria-label="Decrease units"
                    >
                      <Minus size={15} />
                    </button>

                    <input
                      id="form-units"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formUnits}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setFormUnits('');
                        } else {
                          const cleaned = val.replace(/[^0-9]/g, '');
                          setFormUnits(cleaned === '' ? '' : parseInt(cleaned, 10));
                        }
                      }}
                      onBlur={() => {
                        if (formUnits === '' || Number(formUnits) < 1) {
                          setFormUnits(1);
                        } else if (Number(formUnits) > 500) {
                          setFormUnits(500);
                        }
                      }}
                      className="w-full bg-transparent p-2.5 text-center text-sm font-black font-mono text-slate-900 focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => setFormUnits((prev) => Math.min(500, (Number(prev) || 0) + 1))}
                      className="w-10 h-11 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 active:scale-95 transition-all font-bold text-lg border-l border-slate-200/80 shrink-0"
                      aria-label="Increase units"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="form-price" className="text-xs font-extrabold text-slate-700">
                    Price (INR)
                  </label>
                  <input
                    id="form-price"
                    type="text"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-extrabold text-slate-800 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Category-Adaptive TTL Expiration Model */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700">
                    Protocol TTL Lifespan (Arkiv Auto-Purge)
                  </label>
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                    {formTtlHours >= 24 ? `${Math.round(formTtlHours / 24)} Days` : `${formTtlHours} Hours`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[
                    { label: '4h (Trauma)', hours: 4 },
                    { label: '8h (Shift)', hours: 8 },
                    { label: '24h (Daily)', hours: 24 },
                    { label: '48h (Antidote)', hours: 48 },
                    { label: '7 Days', hours: 168 },
                    { label: '14 Days (Quota)', hours: 336 },
                    { label: '30 Days', hours: 720 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormTtlHours(preset.hours)}
                      className={`p-2 rounded-xl text-[11px] font-bold transition-all ${
                        formTtlHours === preset.hours
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label htmlFor="form-notes" className="text-xs font-extrabold text-slate-700">
                  Desk Priority &amp; Instructions (No PHI)
                </label>
                <textarea
                  id="form-notes"
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none resize-none"
                />
              </div>

              {/* Protocol Expiry Notice */}
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 flex items-center gap-2.5 text-xs text-sky-800 font-semibold">
                <Clock size={16} className="text-sky-600 shrink-0" />
                <span>
                  Arkiv Protocol: Listing automatically vanishes in{' '}
                  <strong className="text-sky-950 font-bold">
                    {formTtlHours >= 24 ? `${Math.round(formTtlHours / 24)} Days` : `${formTtlHours} Hours`}
                  </strong>{' '}
                  unless actively extended by hospital desk.
                </span>
              </div>

              <button
                type="submit"
                disabled={isBroadcasting || !isAuthorized}
                className={`w-full font-extrabold text-xs py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg tracking-wider transition-all ${
                  !isAuthorized
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                }`}
              >
                {!isAuthorized ? (
                  <>
                    <Lock size={16} />
                    <span>Action Blocked — Whitelist Required</span>
                  </>
                ) : isBroadcasting ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>{useMetaMaskBroadcast ? 'Prompting MetaMask Signature...' : 'Signing Transaction on Arkiv...'}</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>{useMetaMaskBroadcast ? 'Broadcast via MetaMask Signature' : 'Broadcast Beacon to DB-Chain'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Active Beacons & Audit Log */}
        <div className="lg:col-span-7 space-y-8">
          {/* Active Beacons */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity size={20} className="text-rose-600" />
                <h3 className="font-extrabold text-lg text-slate-900">
                  Active Facility Beacons ({facilityBeacons.length})
                </h3>
              </div>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded">
                Live State
              </span>
            </div>

            {facilityBeacons.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-8 text-center space-y-2 border border-slate-100">
                <AlertCircle size={28} className="text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No active beacons registered for this desk.</p>
                <p className="text-[11px] text-slate-400">Use the broadcast form on the left to publish live stock.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {facilityBeacons.map((beacon) => {
                  const itemDef = AVAILABLE_ITEM_CODES.find((i) => i.code === beacon.attributes.itemCode);

                  return (
                    <div
                      key={beacon.key}
                      className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <strong className="block font-bold text-sm text-slate-900">
                          {itemDef ? itemDef.label : beacon.attributes.itemCode}
                        </strong>
                        <span className="block font-mono text-[10px] text-slate-400 truncate max-w-xs">
                          Key: {beacon.key}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xl font-black font-mono text-slate-900">
                            {beacon.attributes.unitsAvailable}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-bold">units left</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDispense(beacon)}
                            disabled={!isAuthorized || beacon.attributes.unitsAvailable <= 0}
                            className={`bg-white text-rose-600 border border-slate-200 font-extrabold text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-all ${
                              !isAuthorized || beacon.attributes.unitsAvailable <= 0
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:bg-rose-50'
                            }`}
                            title={!isAuthorized ? 'Whitelist required to dispense' : 'Dispense 1 Unit (-1 via patchEntity)'}
                          >
                            <MinusCircle size={14} />
                            <span>-1 Unit</span>
                          </button>

                          <button
                            onClick={() => handleExtend(beacon)}
                            disabled={!isAuthorized}
                            className={`bg-white text-slate-700 border border-slate-200 font-bold text-xs px-2.5 py-2 rounded-lg transition-all ${
                              !isAuthorized
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:bg-slate-100'
                            }`}
                            title={!isAuthorized ? 'Whitelist required to extend' : 'Extend TTL by 4 Hours (+4h via extendEntity)'}
                          >
                            <RefreshCw size={14} />
                          </button>

                          <button
                            onClick={() => handleDelete(beacon)}
                            disabled={!isAuthorized}
                            className={`bg-white text-slate-400 border border-slate-200 p-2 rounded-lg transition-all ${
                              !isAuthorized
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:bg-rose-50 hover:text-rose-600'
                            }`}
                            title={!isAuthorized ? 'Whitelist required to recall' : 'Recall / Purge'}
                          >
                            <Trash2 size={14} />
                          </button>

                          <button
                            onClick={() => onInspectProof(beacon)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs px-2.5 py-2 rounded-lg"
                          >
                            Proof
                          </button>

                          <a
                            href={`${ARKIV_CONFIG.explorerUrl}/tx/${beacon.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 font-bold text-xs px-2.5 py-2 rounded-lg flex items-center gap-1 transition-all"
                            title="View Transaction on Arkiv Tiramisu Explorer"
                          >
                            <ExternalLink size={12} />
                            <span>Explorer</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mutation Audit Stream */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <History size={20} className="text-slate-700" />
                <h3 className="font-extrabold text-lg text-slate-900">Arkiv DB-Chain Mutation Audit Stream</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-sky-600 bg-sky-50 px-2.5 py-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" /> Live Stream
              </span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {auditLogs.slice(0, 8).map((log) => {
                const dateStr = new Date(log.timestamp).toLocaleTimeString();
                return (
                  <div key={log.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200/60">
                        {log.action}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{dateStr}</span>
                    </div>
                    <p className="font-semibold text-slate-800">{log.summary}</p>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-0.5">
                      <a
                        href={`${ARKIV_CONFIG.explorerUrl}/tx/${log.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate max-w-[200px] text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-0.5 font-bold"
                        title="View transaction on Arkiv Explorer"
                      >
                        <span>TX: {log.txHash}</span>
                        <ExternalLink size={10} />
                      </a>
                      <span>Block #{log.blockNumber}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
