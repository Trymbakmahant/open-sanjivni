import { createPublicClient, createWalletClient, ExpirationTime } from '@arkiv-network/sdk';
import { tiramisu } from '@arkiv-network/sdk/chains';
import { http, custom, type Account } from 'viem';

export const ARKIV_CONFIG = {
  chainId: 7738577,
  chainName: 'Tiramisu Testnet',
  network: 'tiramisu',
  rpcUrl: 'https://rpc.tiramisu.db-chain.testnet.arkiv.network',
  wsUrl: 'wss://rpc.tiramisu.db-chain.testnet.arkiv.network',
  explorerUrl: 'https://tiramisu.explorer.arkiv.network',
  nativeCurrency: {
    name: 'Golem',
    symbol: 'GLM',
    decimals: 18,
  },
  blockTimeSeconds: 2,
  defaultExpirationHours: 4,
  maxPayloadBytes: 128 * 1024, // 128 KiB
} as const;

/**
 * Public client for citizen reads: serverless queries over JSON-RPC.
 * Does not require wallet connection or gas fees.
 */
export const publicClient = createPublicClient({
  chain: tiramisu,
  transport: http(ARKIV_CONFIG.rpcUrl, {
    timeout: 10_000,
    retryCount: 2,
  }),
});

/**
 * Creates a wallet client for verified hospital / pharmacy desks to sign beacon writes.
 */
export function getHospitalWalletClient(accountOrProvider: Account | any) {
  const isCustomProvider = 
    typeof accountOrProvider === 'object' && 
    accountOrProvider !== null && 
    'request' in accountOrProvider;

  const transport = isCustomProvider 
    ? custom(accountOrProvider) 
    : http(ARKIV_CONFIG.rpcUrl);

  return createWalletClient({
    chain: tiramisu,
    transport,
    account: isCustomProvider ? undefined : accountOrProvider,
  });
}

/**
 * Computes estimated block expiration height for a 4-hour medical beacon.
 */
export function getDefaultExpiration() {
  return ExpirationTime.fromHours(ARKIV_CONFIG.defaultExpirationHours);
}

/**
 * Helper to fetch latest block number and sync status.
 */
export async function getNetworkStatus() {
  try {
    const blockNumber = await publicClient.getBlockNumber();
    return {
      online: true,
      blockNumber: Number(blockNumber),
      chainId: ARKIV_CONFIG.chainId,
      chainName: ARKIV_CONFIG.chainName,
      rpc: ARKIV_CONFIG.rpcUrl,
    };
  } catch (error) {
    console.warn('[Arkiv] RPC ping check failed:', error);
    return {
      online: false,
      blockNumber: 700650,
      chainId: ARKIV_CONFIG.chainId,
      chainName: ARKIV_CONFIG.chainName,
      rpc: ARKIV_CONFIG.rpcUrl,
    };
  }
}
