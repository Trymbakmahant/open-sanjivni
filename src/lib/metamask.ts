import { createWalletClient } from '@arkiv-network/sdk';
import { tiramisu } from '@arkiv-network/sdk/chains';
import { custom, formatEther, type Address } from 'viem';
import { ARKIV_CONFIG, publicClient } from './arkiv';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const TIRAMISU_CHAIN_ID_HEX = '0x761591'; // 7738577 in hex

export interface MetaMaskState {
  isInstalled: boolean;
  isConnected: boolean;
  account: Address | null;
  chainId: string | null;
  isCorrectNetwork: boolean;
  balanceGlm: string;
}

/**
 * Checks if MetaMask or an EIP-1193 compatible Web3 provider is present in the browser.
 */
export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
}

/**
 * Prompts MetaMask to switch to the Arkiv Tiramisu Testnet.
 * If the network has not been added to MetaMask yet, requests to add it.
 */
export async function switchToTiramisuNetwork(): Promise<boolean> {
  if (!isMetaMaskInstalled()) return false;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: TIRAMISU_CHAIN_ID_HEX }],
    });
    return true;
  } catch (switchError: any) {
    // Error code 4902 indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      try {
        await window.ethereum.request({
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
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask browser extension.');
  }

  const accounts: string[] = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  if (!accounts || accounts.length === 0) {
    throw new Error('No account authorized from MetaMask.');
  }

  const account = accounts[0] as Address;
  let chainId: string = await window.ethereum.request({ method: 'eth_chainId' });

  // Auto-switch to Arkiv Tiramisu if on another network
  if (chainId.toLowerCase() !== TIRAMISU_CHAIN_ID_HEX.toLowerCase()) {
    const switched = await switchToTiramisuNetwork();
    if (switched) {
      chainId = await window.ethereum.request({ method: 'eth_chainId' });
    }
  }

  const isCorrectNetwork = chainId.toLowerCase() === TIRAMISU_CHAIN_ID_HEX.toLowerCase();

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
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not available');
  }

  return createWalletClient({
    chain: tiramisu,
    transport: custom(window.ethereum),
    account,
  });
}
