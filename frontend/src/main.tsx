import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import {stakersExposureToValidatorForEra, getAccountBalanceHolds, getBondingDuration, getHistoryDepth, getSessionsPerEra, isEligibleForStakingRewards } from './lib/validator-rewards';
import { getApi } from './lib/validator-rewards/core/connection-manager.ts';
import { plancksToDot } from './lib/papi-utils/convert.ts';


// getAccountBalanceHolds("15zj2gKaQJwsKm6M16o5x6WBjw19qKAu8FSPKgvMxaHxiARW").then(r => {console.log({accountbalanceholds: r})});
// isEligibleForStakingRewards("15zj2gKaQJwsKm6M16o5x6WBjw19qKAu8FSPKgvMxaHxiARW").then(r => {console.log({isEligibleForStakingRewards: r})});
stakersExposureToValidatorForEra("12iawP6HW33wj95sc3g7bVun8YkYnzP4FGkdmjnkpJowzUKf", 1916, 0).then(r => {console.log({stakersExposureToValidatorForEra: r})});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
