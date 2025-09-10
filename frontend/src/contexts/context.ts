import { createContext } from 'react';
import type { ConnectionType } from '../lib/validator-rewards/core/providers';

export interface ConnState {
  type: ConnectionType;
  switchTo: (type: ConnectionType) => void;
  isConnecting: boolean;
}

export const ConnectionContext = createContext<ConnState | null>(null);
