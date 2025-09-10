import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { isEligibleForStakingRewards, nominatorsValidatorSelection, checkNominatorStatus, getBagThresholds, type EligibleForStakingRewards, type NominatorBagAnalysis } from '../../lib/validator-rewards';
import { plancksToDot } from '../../lib/papi-utils/convert';

function BagInfo({ bagAnalysis }: { bagAnalysis: NominatorBagAnalysis }) {
  const [totalBags, setTotalBags] = useState<number | null>(null);
  const [currentBagNumber, setCurrentBagNumber] = useState<number | null>(null);
  const [correctBagNumber, setCorrectBagNumber] = useState<number | null>(null);

  useEffect(() => {
    const calculateBagNumbers = async () => {
      try {
        const thresholds = await getBagThresholds();
        const totalBagsCount = thresholds.length;
        
        const currentIndex = thresholds.findIndex(threshold => threshold === bagAnalysis.currentBag);
        const correctIndex = thresholds.findIndex(threshold => threshold === bagAnalysis.correctBag);
        
        setTotalBags(totalBagsCount);
        setCurrentBagNumber(currentIndex + 1); 
        setCorrectBagNumber(correctIndex + 1); 
      } catch (error) {
        console.log('failed to get bag numbers:', error);
      }
    };

    calculateBagNumbers();
  }, [bagAnalysis]);

  return (
    <div className="mt-2 text-xs text-gray-500">
      <div>
        Current bag: {currentBagNumber && totalBags ? `${currentBagNumber}/${totalBags} ` : 'Loading...'} 
        ({plancksToDot(bagAnalysis.currentBag).toFixed(0)} DOT threshold)
      </div>
      {bagAnalysis.isMisplaced && bagAnalysis.correctBag && (
        <div>
          Should be bag: {correctBagNumber && totalBags ? `${correctBagNumber}/${totalBags} ` : 'Loading...'}
          ({plancksToDot(bagAnalysis.correctBag).toFixed(0)} DOT threshold)
        </div>
      )}
    </div>
  );
}

interface EligibilityDialogProps {
  connectedAddress?: string;
  onValidatorClick?: (validatorId: string) => void;
  persistentState?: {
    isOpen: boolean;
    addressInput: string;
    result: any;
    nominatedValidators: string[] | null;
    showInput: boolean;
  } | null;
  onStateChange?: (state: any) => void;
}

export function EligibilityDialog({ connectedAddress, onValidatorClick, persistentState, onStateChange }: EligibilityDialogProps) {
  const [isOpen, setIsOpen] = useState(persistentState?.isOpen || false);
  const [addressInput, setAddressInput] = useState(persistentState?.addressInput || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EligibleForStakingRewards | null>(persistentState?.result || null);
  const [nominatedValidators, setNominatedValidators] = useState<string[] | null>(persistentState?.nominatedValidators || null);
  const [showInput, setShowInput] = useState(persistentState?.showInput ?? true);
  const [bagAnalysis, setBagAnalysis] = useState<NominatorBagAnalysis | null>(null);

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        isOpen,
        addressInput,
        result,
        nominatedValidators,
        showInput
      });
    }
  }, [isOpen, addressInput, result, nominatedValidators, showInput, onStateChange]);

  const handleCheckEligibility = async (address: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setNominatedValidators(null);
    setBagAnalysis(null);

    try {
      const [eligibilityResult, nominations] = await Promise.all([
        isEligibleForStakingRewards(address),
        nominatorsValidatorSelection(address).catch(() => null)
      ]);
      
      setResult(eligibilityResult);
      if (nominations && nominations.targets) {
        setNominatedValidators(nominations.targets);
      }
      
      // Add bag analysis if they have staking hold and meet min bond requirement
      if (eligibilityResult.hasStakingHold && eligibilityResult.stakingAmount >= eligibilityResult.minimumRequired) {
        try {
          const bagResult = await checkNominatorStatus(address);
          setBagAnalysis(bagResult);
        } catch (bagErr) {
          console.log('bag analysis failed:', bagErr);
        }
      }
      
      setShowInput(false);
    } catch (err: any) {
      setError(err?.message || 'failed to check eligibility');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAddress = () => {
    if (!addressInput.trim()) {
      setError('please enter an address');
      return;
    }
    handleCheckEligibility(addressInput.trim());
  };

  const handleCheckMyAddress = () => {
    if (connectedAddress) {
      handleCheckEligibility(connectedAddress);
    }
  };

  const resetDialog = () => {
    setAddressInput('');
    setError(null);
    setResult(null);
    setNominatedValidators(null);
    setBagAnalysis(null);
    setShowInput(true);
    setLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetDialog();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full bg-primary text-white hover:bg-primary/90">
          Check Account Reward Eligibility
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Staking Reward Eligibility Checker</DialogTitle>
          {result && bagAnalysis && (
            <p className="text-xs text-gray-500 font-mono break-all text-center">
              {bagAnalysis.nominator}
            </p>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          {showInput && !loading && (
            <>
              {connectedAddress && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">connected account:</p>
                  <p className="text-xs font-mono bg-gray-50 p-2 rounded">{connectedAddress}</p>
                  <Button 
                    variant="outline"
                    onClick={handleCheckMyAddress}
                    className="w-full"
                    disabled={loading}
                  >
                    Am I Eligible for Rewards?
                  </Button>
                  <div className="text-center text-sm text-gray-500">or</div>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Enter Address to Check:
                </label>
                <input
                  id="address"
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                  disabled={loading}
                />
                <Button 
                  onClick={handleSubmitAddress}
                  className="w-full text-white"
                  disabled={loading || !addressInput.trim()}
                >
                  Check Eligibility
                </Button>
              </div>
            </>
          )}

          {loading && (
            <div className="text-center py-4">
              <p className="text-sm">checking eligibility...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <p className="text-sm text-red-700">error: {error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setError(null)}
                className="mt-2"
              >
                try again
              </Button>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-3">
              <div className={`p-4 rounded border ${
                result.isEligible 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="text-center mb-3">
                  <span className={`text-lg font-bold ${
                    result.isEligible ? 'text-green-700' : 'text-orange-700'
                  }`}>
                    {result.isEligible ? 'Eligible' : 'Not Eligible'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">has staking hold:</span>
                    <span className={result.hasStakingHold ? 'text-green-600' : 'text-red-600'}>
                      {result.hasStakingHold ? 'yes' : 'no'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">staking amount:</span>
                    <span className="font-mono">
                      {plancksToDot(result.stakingAmount).toFixed(2)} DOT
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">minimum required:</span>
                    <span className="font-mono">
                      {plancksToDot(result.minimumRequired).toFixed(2)} DOT
                    </span>
                  </div>

                  {result.stakingAmount > 0n && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">above minimum:</span>
                      <span className={`font-mono ${
                        result.stakingAmount >= result.minimumRequired 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {result.stakingAmount >= result.minimumRequired ? 'yes' : 'no'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {nominatedValidators && nominatedValidators.length > 0 && (
                <div className="bg-white border border-primary/50 p-3 rounded">
                  <h4 className="text-center text-sm font-medium text-black/80 mb-2">
                    <strong>Currently Nominated Validators ({nominatedValidators.length})</strong>
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {nominatedValidators.map((validator, index) => (
                      <div 
                        key={index} 
                        className="text-xs font-mono bg-primary/10 text-primary p-1 rounded cursor-pointer hover:bg-primary hover:text-white transition-colors"
                        onClick={() => {
                          if (onValidatorClick) {
                            onValidatorClick(validator);
                          }
                        }}
                      >
                        {validator}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {nominatedValidators && nominatedValidators.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 p-3 rounded">
                  <p className="text-sm text-gray-600">
                    No validators currently nominated
                  </p>
                </div>
              )}

              {bagAnalysis && (
                <div className="bg-white border border-primary p-3 rounded">
                  <h4 className="text-sm font-medium text-black text-center mb-2">
                    Bag Position Analysis
                  </h4>
                  
                  {bagAnalysis.canRebag && (
                    <p className="text-sm text-primary mb-2">
                      Call rebag() - in the wrong bag for stake amount
                    </p>
                  )}
                  
                  {bagAnalysis.canPutInFront && (
                    <p className="text-sm text-primary mb-2">
                      Call putInFrontOf() - improve queue position (currently #{bagAnalysis.positionInBag})
                    </p>
                  )}
                  
                  {bagAnalysis.needsMoreStake && (
                    <p className="text-sm text-primary mb-2">
                      Should bond more DOT - at front but may need higher stake
                    </p>
                  )}
                  
                  {!bagAnalysis.canRebag && !bagAnalysis.canPutInFront && !bagAnalysis.needsMoreStake && (
                    <p className="text-sm text-primary mb-2">
                      Bag position looks good
                    </p>
                  )}
                  
                  <BagInfo bagAnalysis={bagAnalysis} />
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={resetDialog}
                className="w-full"
              >
                Check Another Address
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}