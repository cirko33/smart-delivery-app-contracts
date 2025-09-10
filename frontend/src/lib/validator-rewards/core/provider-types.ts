export type ProviderType = 'smoldot' | 'websocket';

export interface ProviderConfig {
  type: ProviderType;
  endpoints?: string[];
}

export const DEFAULT_WS_ENDPOINTS = [
  "wss://rpc.ibp.network/polkadot",
  "wss://polkadot.dotters.network",
  "wss://polkadot-rpc.publicnode.com",
  "wss://polkadot-public-rpc.blockops.network/ws",
  "wss://polkadot-rpc.dwellir.com"
];