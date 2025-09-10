import { dot } from "@polkadot-api/descriptors";
import { createClient, type PolkadotClient } from "polkadot-api";
import { getProvider, type ConnectionType } from './providers';

let connType: ConnectionType = 'ws';
let client: PolkadotClient | null = null;

export const connectToDot = () => {
  if (!client) {
    const provider = getProvider(connType);
    client = createClient(provider);
  }
  return client.getTypedApi(dot);
}

export const switchConnection = (type: ConnectionType) => {
  connType = type;
  client = null;
}
