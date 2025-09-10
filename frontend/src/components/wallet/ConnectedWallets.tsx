import { useState, useEffect } from 'react';
import { getAccounts } from '../../lib/account-manager';
import { getAccountBalance } from '../../lib/validator-rewards';

export function ConnectedWallets() {
  const [account, setAccount] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    async function loadWallet() {
      const accounts = await getAccounts();
      if (accounts.length > 0) {
        const firstAccount = accounts[0];
        setAccount(firstAccount);
        
        try {
          const bal = await getAccountBalance(firstAccount.address);
          setBalance(bal);
        } catch (error) {
          console.error('Failed to load balance:', error);
        }
      }
    }
    
    loadWallet();
  }, []);

  if (!account) {
    return <div className="text-sm text-white/60">No wallet connected</div>;
  }

  const shortAddress = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;

  return (
    <div className="flex items-center justify-between space-x-8 text-sm whitespace-nowrap w-[300px]">
      <span className="font-medium text-white">{account.name}</span>
      <span className="font-mono text-white/70">{shortAddress}</span>
      <span className="font-semibold text-white">
        {balance !== null ? `${balance.toFixed(2)} DOT` : 'Loading...'}
      </span>
    </div>
  );
}