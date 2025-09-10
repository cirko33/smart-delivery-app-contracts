import { useState, useEffect, useCallback } from 'react';
import { getDashboardData, getCurrentEra, getHistoryDepth, getBondingDuration, getSessionsPerEra, getMinimumActiveStake, getMinimumNominatorBond, totalNumberOfValidators, getNominatorCount, type DashboardData } from '../../lib/validator-rewards';
import { plancksToDot } from '../../lib/papi-utils/convert';
import { useConnection } from '../../hooks/useConnection';
import { switchConnection } from '../../lib/validator-rewards/core/connectors';
import { ValidatorDashboard } from './ValidatorDashboard';
import { EligibilityDialog } from './EligibilityDialog';
import { NominatorsDialog } from './NominatorsDialog';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { getAccounts } from '../../lib/account-manager';

export function Dashboard() {
  const [selectedEra, setSelectedEra] = useState<number | null>(null);
  const [availableEras, setAvailableEras] = useState<number[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bondingDuration, setBondingDuration] = useState<number | null>(null);
  const [sessionsPerEra, setSessionsPerEra] = useState<number | null>(null);
  const [minimumActiveStake, setMinimumActiveStake] = useState<bigint | null>(null);
  const [minimumNominatorBond, setMinimumNominatorBond] = useState<bigint | null>(null);
  const [totalValidators, setTotalValidators] = useState<number | null>(null);
  const [nominatorCount, setNominatorCount] = useState<number | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [selectedValidator, setSelectedValidator] = useState<string | null>(null);
  const [showValidatorDetails, setShowValidatorDetails] = useState(false);
  const [persistentDialogState, setPersistentDialogState] = useState<{
    isOpen: boolean;
    addressInput: string;
    result: any;
    nominatedValidators: string[] | null;
    showInput: boolean;
  } | null>(null);

  const handleValidatorClick = useCallback((validatorId: string) => {
    setSelectedValidator(validatorId);
    setShowValidatorDetails(true);
  }, []);

  const handleBackToTable = useCallback(() => {
    setShowValidatorDetails(false);
    setSelectedValidator(null);
  }, []);
  const { type } = useConnection();

  useEffect(() => {
    async function loadEras() {
      try {
        const [currentEra, historyDepth, bondingDur, sessionsPer, minActiveStake, minNominatorBond, totalVals, nominatorCnt, accounts] = await Promise.all([
          getCurrentEra(),
          getHistoryDepth(),
          getBondingDuration(),
          getSessionsPerEra(),
          getMinimumActiveStake(),
          getMinimumNominatorBond(),
          totalNumberOfValidators(),
          getNominatorCount(),
          getAccounts().catch(() => [])
        ]);
        setBondingDuration(bondingDur);
        setSessionsPerEra(sessionsPer);
        setMinimumActiveStake(minActiveStake);
        setMinimumNominatorBond(minNominatorBond);
        setTotalValidators(totalVals);
        setNominatorCount(nominatorCnt);
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0].address);
        }
        const currentEraNumber = currentEra?.index || 1919;
        const startEra = currentEraNumber - historyDepth;
        const limitedEras = [];
        for (let i = currentEraNumber; i >= startEra; i--) {
          limitedEras.push(i);
        }
        setAvailableEras(limitedEras);
        if (limitedEras.length > 0) {
          setSelectedEra(limitedEras[0]);
        }
      } catch (err) {
        setError('Failed to load available eras');
        console.error('Error loading eras:', err);
        setLoading(false);
      }
    }
    loadEras();
  }, []);

  useEffect(() => {
    if (selectedEra !== null) {
      loadDashboardData(selectedEra);
    }
  }, [selectedEra]);

  useEffect(() => {
    switchConnection(type);
    if (selectedEra !== null) {
      loadDashboardData(selectedEra);
    }
  }, [type]);

  const loadDashboardData = async (era: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardData(era);
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatStaked = (staked: bigint) => {
    const dots = Number(staked) / 1e10;
    return `${dots.toFixed(2)} DOT`;
  };

  if (showValidatorDetails && selectedValidator) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{maxWidth: 'calc(100% - 100px)'}}>
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleBackToTable}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Validator Table
          </Button>
        </div>
        <ValidatorDashboard
          validatorId={selectedValidator}
          onClose={handleBackToTable}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{maxWidth: 'calc(100% - 100px)'}}>
      {availableEras.length > 0 && (
        <div className="mb-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-6 items-start">
            <div className="bg-white p-4 rounded shadow-sm border border-pink-200 shadow-pink-100/50 lg:col-span-2 h-full flex flex-col justify-between">
              <div className="text-center">
                <label htmlFor="era-select" className="block text-base font-semibold text-gray-600 mb-4 mt-1">
                  Select Era
                </label>
              </div>
              
              <div className="flex flex-col justify-center">
                <select
                  id="era-select"
                  value={selectedEra || ''}
                  onChange={(e) => setSelectedEra(Number(e.target.value))}
                  className="block w-full px-3 py-4 border border-pink-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 text-sm bg-white"
                >
                  {availableEras.map((era) => (
                    <option key={era} value={era}>
                      Era {era} {era === availableEras[0] ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  {availableEras.length} eras available
                </p>
                <div className="flex justify-center space-x-1 mt-1">
                  <div className="w-1 h-1 bg-primaryLighter rounded-full"></div>
                  <div className="w-1 h-1 bg-primaryLight rounded-full"></div>
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                </div>
              </div>
            </div>

          <div className="lg:col-span-2 space-y-6 h-full flex flex-col">
            {sessionsPerEra && (
              <div className="bg-pink-50 p-4 rounded shadow-sm border border-pink-200 flex-1">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-3">Sessions per Era:</span>
                  <span className="text-xl font-bold text-pink-600">
                    {sessionsPerEra}
                  </span>
                </div>
              </div>
            )}

            {dashboardData && totalValidators && (
              <div className="bg-pink-50 p-4 rounded shadow-sm border border-pink-200 flex-1">
                <div className="flex items-center mb-1">
                  <span className="text-sm text-gray-600 mr-3">Active Validators:</span>
                  <span className="text-xl font-bold text-pink-600">
                    {dashboardData.totalActiveValidators}
                  </span>
                </div>
                <div className="flex items-center mb-1">
                  <span className="text-sm text-gray-600 mr-3">Waiting Validators:</span>
                  <span className="text-xl font-bold text-pink-600">
                    {totalValidators - dashboardData.totalActiveValidators}
                  </span>
                </div>
                {nominatorCount && (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-3">Number of Nominators:</span>
                    <span className="text-xl font-bold text-pink-600">
                      {nominatorCount}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 h-full flex flex-col justify-center">
            {minimumNominatorBond && (
              <div className="bg-pink-100 p-4 rounded shadow-sm border border-pink-300 h-full flex flex-col justify-center">
                <div className="flex items-center mb-1">
                  <span className="text-sm text-gray-600 mr-3">Min Nominator Bond:</span>
                  <span className="text-xl font-bold text-pink-700">
                    {plancksToDot(minimumNominatorBond).toFixed(2)} DOT
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  The minimum active bond to become and maintain the role of a nominator
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6 h-full flex flex-col">
            {bondingDuration && (
              <div className="bg-pink-50 p-4 rounded shadow-sm border border-pink-200 flex-1">
                <div className="flex items-center mb-1">
                  <span className="text-sm text-gray-600 mr-3">Bonding Duration:</span>
                  <span className="text-xl font-bold text-pink-600">
                    {bondingDuration} eras
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Number of eras that staked funds must remain bonded for
                </p>
              </div>
            )}

            {minimumActiveStake && (
              <div className="bg-pink-50 p-4 rounded shadow-sm border border-pink-200 flex-1">
                <div className="flex items-center mb-1">
                  <span className="text-sm text-gray-600 mr-3">Min Active Stake:</span>
                  <span className="text-xl font-bold text-pink-600">
                    {plancksToDot(minimumActiveStake).toFixed(2)} DOT
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  The minimum active nominator stake of the last successful election
                </p>
              </div>
            )}
          </div>
          </div>
          
          
          <div className="lg:col-span-2">
            <EligibilityDialog 
              connectedAddress={connectedAddress || undefined} 
              onValidatorClick={handleValidatorClick}
              persistentState={persistentDialogState}
              onStateChange={setPersistentDialogState}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <img 
            src="/logo.png" 
            alt="Loading" 
            className="h-64 w-64 mx-auto steak-loader"
          />
          <p className="mt-4 text-xl font-bold text-gray-800">Loading dashboard</p>
        </div>
      )}

      {dashboardData && !loading && (
        <div>

          <div className="bg-white rounded-lg shadow overflow-hidden" style={{height: '50vh'}}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Active Validators ({dashboardData.isCurrentEra ? 'Sorted by Points - See past eras for APY %' : 'Sorted by APY'})
              </h3>
            </div>
            <div className="overflow-auto" style={{height: 'calc(100% - 5rem)'}}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Validator ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      APY
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Staked
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nominators
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.validators.map((validator, index) => (
                    <tr 
                      key={validator.validatorId} 
                      className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-pink-50 cursor-pointer transition-colors`}
                      onClick={() => handleValidatorClick(validator.validatorId)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 text-left">
                        {validator.validatorId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                        <span className={`font-semibold ${validator.apy > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                          {validator.apy.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                        {(validator.commissionRate * 100).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          validator.blocked 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {validator.blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                        {formatStaked(validator.totalStaked)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                        {validator.totalPoints.toString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                        {validator.nominatorCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                        <NominatorsDialog 
                          validatorId={validator.validatorId} 
                          era={selectedEra || 0}
                        >
                          <button
                            className="px-3 py-1 text-xs bg-pink-100 text-pink-700 rounded hover:bg-pink-200 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                            }}
                          >
                            Explore Nominators
                          </button>
                        </NominatorsDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}