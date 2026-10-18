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
    <div className="space-y-3 sm:space-y-4">
      {/* Dynamic Error Banner */}
      {portalError && (
        <div className="bg-white border-2 border-rose-400 rounded-2xl p-3 sm:p-4 flex items-start justify-between gap-3 text-slate-800 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block text-xs font-black text-rose-600">Action Required:</strong>
              <p className="text-xs text-slate-700 leading-relaxed break-words">{portalError}</p>
            </div>
          </div>
          <button
            onClick={() => setPortalError(null)}
            className="text-slate-400 hover:text-slate-700 text-sm leading-none p-1 rounded-lg hover:bg-slate-100"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dynamic Notice Banner */}
      {portalNotice && (
        <div className="bg-white border-2 border-sky-400 rounded-2xl p-3 sm:p-4 flex items-start justify-between gap-3 text-slate-800 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <Check size={20} className="text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block text-xs font-black text-sky-700">Notice:</strong>
              <p className="text-xs text-slate-700 leading-relaxed break-words">{portalNotice}</p>
            </div>
          </div>
          <button
            onClick={() => setPortalNotice(null)}
            className="text-slate-400 hover:text-slate-700 text-sm leading-none p-1 rounded-lg hover:bg-slate-100"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* UNIFIED COMMAND STRIP: Hospital Desk, Web3 MetaMask & Whitelist Access Hub */}
      <section className="bg-white rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-2.5 border border-slate-200/90 shadow-2xs flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
        {/* Left: Desk Title & Verified Facility Selector */}
        <div className="flex items-center gap-2.5 min-w-[260px]">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-2xs">
            <Hospital size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">Hospital &amp; Jan Aushadhi Desk</h2>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono hidden md:inline">
                Arkiv DB-Chain
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <label htmlFor="facility-dropdown" className="sr-only">Active Verified Desk</label>
              <select
                id="facility-dropdown"
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer max-w-[220px] sm:max-w-[250px] truncate"
              >
                {INDIAN_FACILITIES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.facilityName} ({f.districtCode})
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAuthorized ? 'bg-sky-500' : 'bg-rose-500 animate-ping'}`} />
                <span className="truncate max-w-[90px] sm:max-w-[120px]" title={useMetaMaskBroadcast && metaMaskState.account ? metaMaskState.account : currentFacility.walletAddress}>
                  {useMetaMaskBroadcast && metaMaskState.account ? metaMaskState.account : currentFacility.walletAddress}
                </span>
                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                  isAuthorized ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {isAuthorized ? 'Verified' : 'Blocked'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: MetaMask & Judge Simulator Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* MetaMask Web3 Control */}
          {!metaMaskState.isConnected ? (
            <button
              type="button"
              onClick={handleConnectMetaMask}
              disabled={isConnectingMetaMask}
              className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-extrabold text-xs px-2.5 py-1 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <span className="text-sm">🦊</span>
              <span>{isConnectingMetaMask ? 'Connecting...' : 'Connect MetaMask'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-orange-50/70 border border-orange-200/80 rounded-xl px-2 py-1 text-xs">
              <span className="text-sm">🦊</span>
              <span className="font-mono font-bold text-slate-800 text-[11px]" title={metaMaskState.account || ''}>
                {metaMaskState.account?.slice(0, 6)}...{metaMaskState.account?.slice(-4)}
              </span>
              <span className="text-[10px] text-slate-600 font-mono font-semibold pl-1.5 border-l border-orange-200">
                {metaMaskState.balanceGlm} GLM
              </span>

              {!metaMaskState.isCorrectNetwork ? (
                <button
                  type="button"
                  onClick={handleSwitchNetwork}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors ml-0.5"
                >
                  Switch Chain
                </button>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 ml-0.5" title="Connected to Arkiv Tiramisu (7738577)" />
              )}

              <a
                href="https://hub.arkiv.network/faucet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-slate-500 hover:text-slate-900 ml-1 underline decoration-slate-300"
                title="Claim free test GLM tokens for Arkiv gas"
              >
                Faucet ↗
              </a>

              <button
                type="button"
                onClick={() => setUseMetaMaskBroadcast((prev) => !prev)}
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded transition-all ml-1 ${
                  useMetaMaskBroadcast
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
                title="Toggle between MetaMask signing and Simulated Desk signing"
              >
                {useMetaMaskBroadcast ? 'MetaMask' : 'Simulated'}
              </button>
            </div>
          )}

          {/* Hackathon Judge Simulation Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/90 p-0.5 rounded-xl text-xs">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 px-1 hidden sm:inline">
              Test:
            </span>
            <button
              onClick={() => setSelectedFacilityId('aiims-raipur')}
              className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                selectedFacilityId === 'aiims-raipur'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AIIMS (Authorized)
            </button>
            <button
              onClick={() => setSelectedFacilityId('unauthorized-citizen')}
              className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                selectedFacilityId === 'unauthorized-citizen'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Blocked
            </button>
          </div>
        </div>
      </section>

      {/* Grid: Broadcast Form & Active Beacons (Single-Screen Cockpit) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
        {/* Left: Broadcast Form (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle size={16} className="text-rose-600" />
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">1-Click Broadcast Medical Beacon</h3>
              </div>
              <span className="bg-sky-50 text-sky-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded font-mono">
                createEntity()
              </span>
            </div>

            {/* Broadcast Success Box (Compact) */}
            {broadcastSuccess && (
              <div className="bg-sky-50/95 border border-sky-300 rounded-xl p-2.5 text-xs text-slate-800 space-y-2 shadow-xs animate-in fade-in">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-sky-600 text-white flex items-center justify-center shrink-0">
                      <Check size={12} />
                    </div>
                    <div>
                      <strong className="text-xs font-black text-sky-950">
                        Broadcast Confirmed On-Chain!
                      </strong>
                      <span className="text-[10px] font-mono text-sky-800 ml-1.5">
                        Block #{broadcastSuccess.blockNumber.toLocaleString()} • {broadcastSuccess.units} Units of {broadcastSuccess.itemLabel}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setBroadcastSuccess(null)}
                    className="text-slate-400 hover:text-slate-700 text-xs p-0.5 leading-none rounded hover:bg-sky-100"
                    aria-label="Dismiss banner"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                  <div className="bg-white/90 border border-sky-200 rounded-lg p-1.5 flex items-center justify-between">
                    <span className="truncate text-slate-700" title={broadcastSuccess.entityKey}>
                      Key: {broadcastSuccess.entityKey.slice(0, 10)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopySuccessField(broadcastSuccess.entityKey, 'entityKey')}
                      className="text-sky-700 hover:text-sky-900 font-bold shrink-0 ml-1"
                      title="Copy Entity Key"
                    >
                      {copiedSuccessField === 'entityKey' ? '✓' : <Copy size={11} />}
                    </button>
                  </div>
                  <div className="bg-white/90 border border-sky-200 rounded-lg p-1.5 flex items-center justify-between">
                    <span className="truncate text-slate-700" title={broadcastSuccess.txHash}>
                      TX: {broadcastSuccess.txHash.slice(0, 10)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopySuccessField(broadcastSuccess.txHash, 'txHash')}
                      className="text-sky-700 hover:text-sky-900 font-bold shrink-0 ml-1"
                      title="Copy Transaction Hash"
                    >
                      {copiedSuccessField === 'txHash' ? '✓' : <Copy size={11} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <a
                    href={`${ARKIV_CONFIG.explorerUrl}/tx/${broadcastSuccess.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-black text-[11px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink size={12} />
                    <span>View on Arkiv Explorer ↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => onInspectProof(broadcastSuccess.beacon)}
                    className="bg-white hover:bg-slate-50 text-sky-700 border border-sky-200 font-bold text-[11px] py-1.5 px-2 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <ShieldCheck size={12} className="text-sky-600" />
                    <span>State Proof</span>
                  </button>
                </div>
              </div>
            )}

            {/* Unauthorized Alert */}
            {!isAuthorized && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-2 flex items-center gap-2 text-xs text-rose-800">
                <Lock size={14} className="text-rose-600 shrink-0" />
                <span className="text-[11px]">
                  <strong>Write Blocked:</strong> Whitelist required. Switch to AIIMS Desk in header.
                </span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-2.5">
              {/* Category Segmented Pills */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700">Supply Category</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['BLOOD', 'ANTI_VENOM', 'RABIES_VACCINE', 'JAN_AUSHADHI'] as BeaconCategory[]).map(
                    (cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setFormCategory(cat)}
                        className={`py-1.5 px-0.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all text-center truncate ${
                          formCategory === cat
                            ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs font-black'
                            : 'bg-slate-50 text-slate-600 border border-slate-200/70 hover:bg-slate-100'
                        }`}
                      >
                        {cat === 'BLOOD' && '🩸 Blood'}
                        {cat === 'ANTI_VENOM' && '🐍 Venom'}
                        {cat === 'RABIES_VACCINE' && '💉 Rabies'}
                        {cat === 'JAN_AUSHADHI' && '💊 Pharmacy'}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Specific Item Select */}
              <div className="space-y-1">
                <label htmlFor="form-item-code" className="text-[11px] font-extrabold text-slate-700">
                  Specific Item
                </label>
                <select
                  id="form-item-code"
                  value={formItemCode}
                  onChange={(e) => setFormItemCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                >
                  {AVAILABLE_ITEM_CODES.filter((i) => i.category === formCategory).map((i) => (
                    <option key={i.code} value={i.code}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Units & Price in 1 row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Units with Stepper */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <label htmlFor="form-units" className="font-extrabold text-slate-700">
                      Units Available
                    </label>
                    <span className="text-[9px] text-slate-400 font-mono">1-500</span>
                  </div>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-rose-500 h-8 sm:h-8.5">
                    <button
                      type="button"
                      onClick={() => setFormUnits((prev) => Math.max(1, (Number(prev) || 1) - 1))}
                      className="w-7 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 active:scale-95 transition-all font-bold border-r border-slate-200/80 shrink-0"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      id="form-units"
                      type="text"
                      inputMode="numeric"
                      value={formUnits}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') setFormUnits('');
                        else setFormUnits(parseInt(val.replace(/[^0-9]/g, '') || '0', 10));
                      }}
                      onBlur={() => {
                        if (formUnits === '' || Number(formUnits) < 1) setFormUnits(1);
                        else if (Number(formUnits) > 500) setFormUnits(500);
                      }}
                      className="w-full bg-transparent text-center text-xs font-black font-mono text-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormUnits((prev) => Math.min(500, (Number(prev) || 0) + 1))}
                      className="w-7 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 active:scale-95 transition-all font-bold border-l border-slate-200/80 shrink-0"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Price (INR) */}
                <div className="space-y-1">
                  <label htmlFor="form-price" className="text-[11px] font-extrabold text-slate-700 block">
                    Price (INR)
                  </label>
                  <input
                    id="form-price"
                    type="text"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full h-8 sm:h-8.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 text-xs font-black font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Lifespan Presets */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="font-extrabold text-slate-700">
                    Lifespan TTL (Arkiv Auto-Purge)
                  </label>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded font-mono">
                    {formTtlHours >= 24 ? `${Math.round(formTtlHours / 24)} Days` : `${formTtlHours} Hours`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: '4h Trauma', hours: 4 },
                    { label: '8h Shift', hours: 8 },
                    { label: '24h Daily', hours: 24 },
                    { label: '48h Antidote', hours: 48 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormTtlHours(preset.hours)}
                      className={`py-1 rounded-lg text-[10px] font-bold transition-all text-center truncate ${
                        formTtlHours === preset.hours
                          ? 'bg-sky-600 text-white shadow-2xs font-black'
                          : 'bg-slate-50 text-slate-600 border border-slate-200/70 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Notes */}
              <div className="space-y-1">
                <label htmlFor="form-notes" className="text-[11px] font-extrabold text-slate-700 block">
                  Desk Priority Notes
                </label>
                <input
                  id="form-notes"
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Emergency ICU cases prioritized. Immediate crossmatch active."
                  className="w-full h-8 bg-slate-50 border border-slate-200 rounded-xl px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* Submit Broadcast Button */}
              <button
                type="submit"
                disabled={isBroadcasting || !isAuthorized}
                className={`w-full font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm tracking-wide transition-all ${
                  !isAuthorized
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-[0.99]'
                }`}
              >
                {!isAuthorized ? (
                  <>
                    <Lock size={14} />
                    <span>Action Blocked — Whitelist Required</span>
                  </>
                ) : isBroadcasting ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    <span>{useMetaMaskBroadcast ? 'Prompting MetaMask...' : 'Broadcasting on Arkiv...'}</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>{useMetaMaskBroadcast ? 'Broadcast via MetaMask' : 'Broadcast Beacon to DB-Chain ↗'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Active Beacons & Audit Log (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Active Beacons Card */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-rose-600" />
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                  Active Facility Beacons ({facilityBeacons.length})
                </h3>
              </div>
              <span className="text-[10px] font-extrabold uppercase bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.2 rounded">
                Live State
              </span>
            </div>

            {facilityBeacons.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-5 text-center space-y-1 border border-slate-100">
                <AlertCircle size={20} className="text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No active beacons registered for this desk.</p>
                <p className="text-[11px] text-slate-400">Use the form on the left to broadcast live stock.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[220px] sm:max-h-[240px] overflow-y-auto pr-1">
                {facilityBeacons.map((beacon) => {
                  const itemDef = AVAILABLE_ITEM_CODES.find((i) => i.code === beacon.attributes.itemCode);

                  return (
                    <div
                      key={beacon.key}
                      className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-xl p-2 sm:p-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 transition-colors"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <strong className="block font-bold text-xs text-slate-900 truncate">
                          {itemDef ? itemDef.label : beacon.attributes.itemCode}
                        </strong>
                        <span className="block font-mono text-[9px] text-slate-400 truncate max-w-[180px] sm:max-w-[240px]">
                          Key: {beacon.key}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 ml-auto sm:ml-0">
                        <div className="text-right">
                          <span className="text-sm sm:text-base font-black font-mono text-slate-900">
                            {beacon.attributes.unitsAvailable}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-bold leading-none">units</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDispense(beacon)}
                            disabled={!isAuthorized || beacon.attributes.unitsAvailable <= 0}
                            className={`bg-white text-rose-600 border border-slate-200 font-extrabold text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
                              !isAuthorized || beacon.attributes.unitsAvailable <= 0
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:bg-rose-50 shadow-2xs'
                            }`}
                            title={!isAuthorized ? 'Whitelist required' : 'Dispense 1 Unit'}
                          >
                            <MinusCircle size={12} />
                            <span>-1</span>
                          </button>

                          <button
                            onClick={() => handleExtend(beacon)}
                            disabled={!isAuthorized}
                            className={`bg-white text-slate-700 border border-slate-200 font-bold text-[10px] px-2 py-1 rounded-lg transition-all ${
                              !isAuthorized ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 shadow-2xs'
                            }`}
                            title="Extend TTL by 4h"
                          >
                            <RefreshCw size={11} />
                          </button>

                          <button
                            onClick={() => handleDelete(beacon)}
                            disabled={!isAuthorized}
                            className={`bg-white text-slate-400 border border-slate-200 p-1 rounded-lg transition-all ${
                              !isAuthorized ? 'opacity-40 cursor-not-allowed' : 'hover:bg-rose-50 hover:text-rose-600'
                            }`}
                            title="Recall / Purge"
                          >
                            <Trash2 size={12} />
                          </button>

                          <button
                            onClick={() => onInspectProof(beacon)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[10px] px-2 py-1 rounded-lg transition-colors"
                          >
                            Proof
                          </button>

                          <a
                            href={`${ARKIV_CONFIG.explorerUrl}/tx/${beacon.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 font-bold text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 transition-all"
                            title="View Transaction on Arkiv Explorer"
                          >
                            <ExternalLink size={10} />
                            <span className="hidden sm:inline">Explorer</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mutation Audit Stream Card */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={16} className="text-slate-700" />
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">Arkiv DB-Chain Mutation Stream</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-sky-700 bg-sky-50 px-2 py-0.2 rounded border border-sky-200">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" /> Live Stream
              </span>
            </div>

            <div className="space-y-1 max-h-[170px] sm:max-h-[190px] overflow-y-auto pr-1">
              {auditLogs.slice(0, 8).map((log) => {
                const dateStr = new Date(log.timestamp).toLocaleTimeString();
                return (
                  <div key={log.id} className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-2 text-xs space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-extrabold uppercase font-mono px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200">
                        {log.action}
                      </span>
                      <span className="font-mono text-slate-400">{dateStr}</span>
                    </div>
                    <p className="font-semibold text-slate-800 text-[11px] truncate">{log.summary}</p>
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-0.5">
                      <a
                        href={`${ARKIV_CONFIG.explorerUrl}/tx/${log.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate max-w-[200px] text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-0.5 font-bold"
                        title="View transaction on Arkiv Explorer"
                      >
                        <span>TX: {log.txHash.slice(0, 16)}...</span>
                        <ExternalLink size={9} />
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
