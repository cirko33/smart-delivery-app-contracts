import { useState, useEffect, useRef } from 'react';
import { getValidatorDashboardData, type ValidatorDashboardData } from '../../lib/validator-rewards';
import { useConnection } from '../../hooks/useConnection';
import { switchConnection } from '../../lib/validator-rewards/core/connectors';

interface ValidatorDashboardProps {
  validatorId: string;
  onClose: () => void;
}

export function ValidatorDashboard({ validatorId, onClose }: ValidatorDashboardProps) {
  const [data, setData] = useState<ValidatorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { type } = useConnection();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getValidatorDashboardData(validatorId);
        setData(result);
      } catch (err) {
        console.error('Failed to load validator data:', err);
        setError('Failed to load validator data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [validatorId]);

  useEffect(() => {
    switchConnection(type);
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getValidatorDashboardData(validatorId);
        setData(result);
      } catch (err) {
        console.error('Failed to load validator data:', err);
        setError('Failed to load validator data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [type, validatorId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const formatDot = (amount: bigint) => {
    return (Number(amount) / 1e10).toFixed(2) + ' DOT';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <img 
            src="/logo.png" 
            alt="Loading" 
            className="h-64 w-64 mx-auto steak-loader"
          />
          <p className="mt-4 text-xl font-bold text-gray-800">Loading validator dashboard</p>
          <p className="mt-2 text-sm font-mono text-gray-600 break-all">{validatorId}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  
  const validApyHistory = data.eraApyHistory.filter(era => era.apy > 0);
  const avgApy = validApyHistory.length > 0 
    ? validApyHistory.reduce((sum, era) => sum + era.apy, 0) / validApyHistory.length 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-xl w-full text-left">
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Validator Details</h2>
      </div>

        <div className="p-6 space-y-6 text-left">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <h3 className="font-medium text-gray-900 text-left mr-4">Validator Address:</h3>
              <p className="font-mono text-sm text-gray-700 break-all select-all text-left">{data.validatorId}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-cardHover p-4 rounded-card">
              <div className="flex items-center">
                <span className="font-medium text-textPrimary mr-3">Total Rewards:</span>
                <span className="text-xl font-bold text-primary">
                  {data.accumulatedProfit.totalRewards.toFixed(2)} DOT
                </span>
              </div>
              <p className="text-xs text-textSecondary mt-1">
                Accumulated over the past {data.accumulatedProfit.erasProcessed} eras
              </p>
            </div>

            {validApyHistory.length > 0 && (
              <div className="bg-green-50 p-4 rounded-card">
                <div className="flex items-center">
                  <span className="font-medium text-textPrimary mr-3">Average APY:</span>
                  <span className="text-xl font-bold text-green-600">
                    {avgApy.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            {data.currentEraData && (
              <div className="bg-accent/20 p-4 rounded-card">
                <div className="flex items-center">
                  <span className="font-medium text-textPrimary mr-3">Current Status:</span>
                  <span className="text-lg font-semibold text-textPrimary mr-4">
                    {data.currentEraData.blocked ? 'Blocked' : 'Active'}
                  </span>
                  <span className="text-sm text-textSecondary">
                    {data.currentEraData.nominatorCount} nominators
                  </span>
                </div>
              </div>
            )}
          </div>

          {data.currentEraData && (
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <div className="flex items-center flex-wrap">
                <h3 className="font-medium text-gray-900 text-left mr-4">Current Era Details</h3>
                <div className="flex items-center mr-6">
                  <p className="text-sm text-gray-600 text-left mr-2">Commission Rate:</p>
                  <p className="font-semibold text-left">{(data.currentEraData.commission * 100).toFixed(2)}%</p>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray-600 text-left mr-2">Total Staked:</p>
                  <p className="font-semibold text-left">{formatDot(data.currentEraData.totalStaked)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="text-left">
            <h3 className="font-medium text-gray-900 mb-3 text-left">Recent Performance History</h3>
            {data.eraApyHistory.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Era</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">APY</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nominators</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staked</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.eraApyHistory.map((era) => (
                        <tr key={era.era} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{era.era}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className={era.apy > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                              {era.apy.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {(era.commission * 100).toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{era.nominatorCount}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatDot(era.totalStaked)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-600">
                  Showing {data.eraApyHistory.length} past eras
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No historical data available</p>
            )}
          </div>
        </div>
    </div>
  );
}