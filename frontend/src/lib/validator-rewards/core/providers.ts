import { getWsProvider } from "polkadot-api/ws-provider/web";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import SmWorker from "polkadot-api/smoldot/worker?worker";
import { getSmProvider } from "polkadot-api/sm-provider";
import { chainSpec } from "polkadot-api/chains/polkadot";
import { startFromWorker } from "polkadot-api/smoldot/from-worker";

export type ConnectionType = 'smoldot' | 'ws';

const WS_ENDPOINTS = [
  "wss://rpc.ibp.network/polkadot",
  "wss://polkadot.dotters.network", 
  "wss://polkadot-rpc.publicnode.com",
  "wss://polkadot-public-rpc.blockops.network/ws",
  "wss://polkadot-rpc.dwellir.com"
];

let smoldot = null;
let chain = null;

export function getProvider(type: ConnectionType) {
  if (type === 'ws') {
    return withPolkadotSdkCompat(getWsProvider(WS_ENDPOINTS));
  }
  
  if (!smoldot) {
    smoldot = startFromWorker(new SmWorker());
    chain = smoldot.addChain({ chainSpec });
  }
  return getSmProvider(chain);
}

