import React, { useState, useCallback } from 'react';
import type { ConnectionType } from '../lib/validator-rewards/core/providers';
import { ConnectionContext } from './context';

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [type, setType] = useState<ConnectionType>('ws');
  const [isConnecting, setIsConnecting] = useState(false);

  const switchTo = useCallback(async (newType: ConnectionType) => {
    if (newType === type) return;
    
    setIsConnecting(true);
    setType(newType);
    
    // Give the connection a moment to establish
    setTimeout(() => {
      setIsConnecting(false);
    }, 500);
  }, [type]);

  return (
    <ConnectionContext.Provider value={{ type, switchTo, isConnecting }}>
      {children}
    </ConnectionContext.Provider>
  );
}