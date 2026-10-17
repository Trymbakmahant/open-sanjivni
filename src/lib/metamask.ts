import { createWalletClient } from '@arkiv-network/sdk';
import { tiramisu } from '@arkiv-network/sdk/chains';
import { custom, formatEther, type Address } from 'viem';
import { ARKIV_CONFIG, publicClient } from './arkiv';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const TIRAMISU_CHAIN_ID = 7738577;
export const TIRAMISU_CHAIN_ID_HEX = '0x7614d1'; // Exact hex of 7738577

export function isTiramisuChain(chainId: string | number | null | undefined): boolean {
  if (!chainId) return false;
  if (typeof chainId === 'number') return chainId === TIRAMISU_CHAIN_ID;
  try {
    const clean = chainId.trim().toLowerCase();
    return (
      clean === TIRAMISU_CHAIN_ID_HEX.toLowerCase() ||
      parseInt(clean, 16) === TIRAMISU_CHAIN_ID ||
      parseInt(clean, 10) === TIRAMISU_CHAIN_ID
    );
  } catch {
    return false;
  }
}

export interface MetaMaskState {
  isInstalled: boolean;
  isConnected: boolean;
  account: Address | null;
  chainId: string | null;
  isCorrectNetwork: boolean;
  balanceGlm: string;
}

let discoveredMetaMaskProvider: any = null;

// EIP-6963: Multi-Injected Provider Discovery (Bypasses Coinbase Wallet interception)
if (typeof window !== 'undefined') {
  window.addEventListener('eip6963:announceProvider', (event: any) => {
    const detail = event?.detail;
    if (
      detail?.info?.rdns === 'io.metamask' ||
      detail?.info?.name?.toLowerCase().includes('metamask')
    ) {
      discoveredMetaMaskProvider = detail.provider;
    }
  });

  try {
    window.dispatchEvent(new Event('eip6963:requestProvider'));
  } catch {}
}

/**
 * Retrieves the genuine MetaMask provider, resolving multi-wallet extension collisions
 * (e.g. Chrome having Coinbase Wallet or Phantom competing for window.ethereum).
 */
export function getEthereumProvider(): any {
  if (typeof window === 'undefined') return undefined;

  // 1. Highest Priority: Direct EIP-6963 MetaMask Provider (Cannot be intercepted by Coinbase)
  if (discoveredMetaMaskProvider) {
    return discoveredMetaMaskProvider;
  }

  // Request again in case wallet initialized after page load
  try {
    window.dispatchEvent(new Event('eip6963:requestProvider'));
  } catch {}

  const anyWindow = window as any;
  if (!anyWindow.ethereum) return undefined;

  // 2. Check providerMap (Coinbase/MetaMask multi-wallet map)
  if (anyWindow.ethereum.providerMap?.get) {
    const mm = anyWindow.ethereum.providerMap.get('MetaMask');
    if (mm) return mm;
  }

  // 3. EIP-6963 / Multi-provider array
  if (Array.isArray(anyWindow.ethereum.providers) && anyWindow.ethereum.providers.length > 0) {
    const metaMask = anyWindow.ethereum.providers.find(
      (p: any) => p.isMetaMask && !p.isPhantom && !p.isCoinbaseWallet
    );
    if (metaMask) return metaMask;

    const nonCoinbase = anyWindow.ethereum.providers.find((p: any) => !p.isCoinbaseWallet);
    if (nonCoinbase) return nonCoinbase;

    return anyWindow.ethereum.providers[0];
  }

  return anyWindow.ethereum;
}

/**
 * Checks if MetaMask or an EIP-1193 compatible Web3 provider is present in the browser.
 */
export function isMetaMaskInstalled(): boolean {
  return Boolean(getEthereumProvider());
}

/**
 * Prompts MetaMask to switch to the Arkiv Tiramisu Testnet.
 * If the network has not been added to MetaMask yet, requests to add it.
 */
export async function switchToTiramisuNetwork(): Promise<boolean> {
  const provider = getEthereumProvider();
  if (!provider) return false;

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: TIRAMISU_CHAIN_ID_HEX }],
    });
    return true;
  } catch (switchError: any) {
    // Error code 4902 indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: TIRAMISU_CHAIN_ID_HEX,
              chainName: 'Arkiv Tiramisu Testnet',
              rpcUrls: [ARKIV_CONFIG.rpcUrl],
              nativeCurrency: {
                name: 'Golem',
                symbol: 'GLM',
                decimals: 18,
              },
              blockExplorerUrls: [ARKIV_CONFIG.explorerUrl],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('[MetaMask] Failed to add Arkiv Tiramisu network:', addError);
        return false;
      }
    }
    console.error('[MetaMask] Failed to switch to Arkiv Tiramisu network:', switchError);
    return false;
  }
}

/**
 * Requests wallet connection from MetaMask and verifies network compatibility.
 */
export async function connectMetaMask(): Promise<{
  account: Address;
  chainId: string;
  isCorrectNetwork: boolean;
  balanceGlm: string;
}> {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error(
      'MetaMask not detected in Chrome. If you just installed it, please refresh the page or check Chrome Extensions site access.'
    );
  }

  let accounts: string[] = [];
  try {
    accounts = await provider.request({
      method: 'eth_requestAccounts',
    });
  } catch (err: any) {
    if (err?.code === -32002) {
      throw new Error(
        'MetaMask connection request already pending! Look at your Chrome extensions bar and click the MetaMask fox icon to approve.'
      );
    }
    if (err?.code === 4001) {
      throw new Error('Connection request was rejected in MetaMask.');
    }
    throw new Error(err?.message || 'MetaMask request failed.');
  }

  if (!accounts || accounts.length === 0) {
    throw new Error('No account authorized from MetaMask.');
  }

  const account = accounts[0] as Address;
  let chainId: string = await provider.request({ method: 'eth_chainId' });

  // Auto-switch to Arkiv Tiramisu if on another network
  if (!isTiramisuChain(chainId)) {
    const switched = await switchToTiramisuNetwork();
    if (switched) {
      chainId = await provider.request({ method: 'eth_chainId' });
    }
  }

  const isCorrectNetwork = isTiramisuChain(chainId);

  let balanceGlm = '0.00';
  try {
    const rawBalance = await publicClient.getBalance({ address: account });
    balanceGlm = parseFloat(formatEther(rawBalance)).toFixed(4);
  } catch (err) {
    console.warn('[MetaMask] Failed to fetch GLM balance:', err);
  }

  return {
    account,
    chainId,
    isCorrectNetwork,
    balanceGlm,
  };
}

/**
 * Returns an Arkiv Wallet Client wired directly to the user's MetaMask provider.
 * When mutation methods (createEntity, patchEntity, extendEntity, deleteEntity) are called,
 * MetaMask will automatically prompt the user for cryptographic signature & broadcast.
 */
export function getMetaMaskArkivClient(account: Address) {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error('MetaMask is not available');
  }

  return createWalletClient({
    chain: tiramisu,
    transport: custom(provider),
    account,
  });
}
