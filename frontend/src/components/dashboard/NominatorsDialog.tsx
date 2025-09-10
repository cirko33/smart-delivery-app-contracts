import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { getAllStakersExposureToValidatorForEra, type AllStakersExposureResult } from '../../lib/validator-rewards';
import { plancksToDot } from '../../lib/papi-utils/convert';

interface NominatorsDialogProps {
  validatorId: string;
  era: number;
  children: React.ReactNode;
}

export function NominatorsDialog({ validatorId, era, children }: NominatorsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AllStakersExposureResult | null>(null);

  const handleLoadNominators = async () => {
    if (result) return; 

    setLoading(true);
    setError(null);

    try {
      const nominatorsData = await getAllStakersExposureToValidatorForEra(validatorId, era);
      setResult(nominatorsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load nominators data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !result && !loading) {
      handleLoadNominators();
    }
    if (!open) {
      // Reset state when closing
      setError(null);
      setResult(null);
    }
  };

  // Show full address instead of shortened
  const formatAddress = (address: string) => {
    return address;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Active Nominators - Era {era}</DialogTitle>
          <p className="text-sm text-gray-600 font-mono">
            {formatAddress(validatorId)}
          </p>
          <p className="text-xs text-gray-500">
            Showing only nominators who are actively earning rewards
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-8">
              <p className="text-sm">Loading nominators data...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <p className="text-sm text-red-700">Error: {error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLoadNominators}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-pink-50 border border-pink-200 p-3 rounded">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pink-700">{result.stakersCount}</p>
                    <p className="text-sm text-pink-600">Total Nominators</p>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 p-3 rounded">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-700">
                      {plancksToDot(result.totalStaked).toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600">Total Staked (DOT)</p>
                  </div>
                </div>
              </div>

              {/* Nominators List */}
              <div className="bg-white border border-pink/50 p-3 rounded">
                <h4 className="text-sm font-medium text-black/80 mb-3">
                  <strong>Active Nominators ({result.stakersCount})</strong>
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {result.allStakers.map((staker, index) => (
                    <div 
                      key={`${staker.who}-${index}`} 
                      className="flex justify-between items-center bg-pink-50 border border-pink-100 p-2 rounded hover:bg-pink-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-mono text-pink-700 break-all">
                          {formatAddress(staker.who)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-pink-600">
                          {plancksToDot(staker.value).toFixed(2)} DOT
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Nominators */}
              {result.allStakers.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                  <h4 className="text-sm font-medium text-black/80 mb-3">
                    <strong>Top 5 Nominators by Stake</strong>
                  </h4>
                  <div className="space-y-2">
                    {result.allStakers
                      .sort((a, b) => Number(b.value - a.value))
                      .slice(0, 5)
                      .map((staker, index) => (
                        <div 
                          key={`top-${staker.who}-${index}`} 
                          className="flex justify-between items-center bg-yellow-100 p-2 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-yellow-600">#{index + 1}</span>
                            <p className="text-xs font-mono text-yellow-700 break-all">
                              {formatAddress(staker.who)}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-yellow-600">
                            {plancksToDot(staker.value).toFixed(2)} DOT
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}