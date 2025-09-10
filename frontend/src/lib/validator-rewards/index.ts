import {
  type SS58String
} from "polkadot-api";
import { getApi } from "./core/connection-manager";
import { plancksToDot, perbillToDecimal } from "../papi-utils/convert";
import { cache } from "./cache";
import type {
  ValidatorCommission,
  ValidatorStaking,
  ValidatorReward,
  ValidatorAPYResult,
  AccumulatedProfitResult,
  EraAPYResult,
  ValidatorDashboardData,
  EligibleForStakingRewards,
  AllStakersExposureResult,
  ListNode,
  ListBag,
  NominatorBagAnalysis,
  BagAnalysisResult
} from "./types";

export * from "./types";

const PERBILL_DENOMINATOR = 1_000_000_000n;
const DAYS_PER_YEAR = 365.25;
const PERCENTAGE_MULTIPLIER = 100;

// constants

// Number of eras that staked funds must remain bonded for.
export const getBondingDuration = async () => {
  return await cache.get('bonding-duration', async () => await getApi().constants.Staking.BondingDuration());
}

// Number of past eras data is stored for
export const getHistoryDepth = async () => {
  return await cache.get('history-depth', async () => await getApi().constants.Staking.HistoryDepth());
}

// Number of sessions per era
export const getSessionsPerEra = async () => {
  return await cache.get('sessions-per-era', async () => await getApi().constants.Staking.SessionsPerEra());
}

// Bag thresholds
export const getBagThresholds = async () => {
  return await cache.get('bag-thresholds', async () => await getApi().constants.VoterList.BagThresholds());
}


// Account

export const getAccountData = async (accAddr: SS58String) => {
  return await getApi().query.System.Account.getValue(accAddr);
}

export const getAccountBalance = async (accAddr: SS58String) => {
  const accBalance = await getApi().query.System.Account.getValue(accAddr)
  return plancksToDot(accBalance.data.free);
}

// Balances

// can be used to check the staking amount of an account
export const getAccountBalanceHolds = async (accAddr: SS58String) => {
  return await getApi().query.Balances.Holds.getValue(accAddr)
}

// session 

// gets the current set of validators
export const getActiveValidators = async () => {
  return await getApi().query.Session.Validators.getValue()
}

// Staking 

// validator’s commission rate expressed Perbill units
export const getValidatorCommission = async (validatorId: SS58String) => {
  return (await getApi().query.Staking.Validators.getValue(validatorId)).commission;
}

// returns {index: era, start: unixtime}
export const getCurrentEra = async () => {
  return await getApi().query.Staking.ActiveEra.getValue();
}

export const getNumberOfValidators = async () => {
  return await getApi().query.Staking.ValidatorCount.getValue();
}

// The minimum active nominator stake of the last successful election.
export const getMinimumActiveStake = async () => {
  return await getApi().query.Staking.MinimumActiveStake.getValue();
}

// The current minimum active bond to become and maintain the role of a nominator.
export const getMinimumNominatorBond = async () => {
  return await getApi().query.Staking.MinNominatorBond.getValue();
}

// Total number of validators
export const totalNumberOfValidators = async () => {
  return await getApi().query.Staking.CounterForValidators.getValue();
}

export const getStakingEraValidatorOverviewForValidatorsInEra = async (eraValidatorsArray: [number, SS58String][]): Promise<(ValidatorStaking | undefined)[]> => {
  return await getApi().query.Staking.ErasStakersOverview.getValues(eraValidatorsArray);
}

export const getStakingRewardPointsForValidatorsInEra = async (era: number) => {
  return await getApi().query.Staking.ErasRewardPoints.getValue(era);
}

export const getStakingRewardForValidatorsInEra = async (era: number) => {
  return await getApi().query.Staking.ErasValidatorReward.getValue(era);
}

export const nominatorsValidatorSelection = async (accAddr: SS58String) => {
  return await getApi().query.Staking.Nominators.getValue(accAddr)
}

export const getNominatorCount = async () => {
  return await getApi().query.Staking.CounterForNominators.getValue();
}

export const stakersExposureToValidatorForEra = async (validatorId: SS58String, era: number, page: number) => {
  return await getApi().query.Staking.ErasStakersPaged.getValue(era, validatorId, page)
}

export const getAllStakersExposureToValidatorForEra = async (validatorId: SS58String, era: number): Promise<AllStakersExposureResult> => {
  const allStakers: { who: SS58String; value: bigint; }[] = [];
  let totalStaked = 0n;
  let page = 0;
  
  while (true) {
    const pageResult = await stakersExposureToValidatorForEra(validatorId, era, page);
    
    if (!pageResult || !pageResult.others || pageResult.others.length === 0) {
      break;
    }
    
    allStakers.push(...pageResult.others);
    totalStaked += pageResult.page_total;
    
    page++;
  }
  
  return {
    allStakers,
    totalStaked,
    totalPages: page,
    stakersCount: allStakers.length
  };
}



// VoterList

export const getListNode = async (nominatorId: SS58String): Promise<ListNode | null> => {
  try {
    const result = await getApi().query.VoterList.ListNodes.getValue(nominatorId);
    if (!result) return null;
    return {
      id: result.id,
      prev: result.prev || null,
      next: result.next || null,
      bag_upper: result.bag_upper,
      score: result.score
    };
  } catch {
    return null;
  }
}

export const getListBag = async (bagUpper: bigint): Promise<ListBag | null> => {
  try {
    const result = await getApi().query.VoterList.ListBags.getValue(bagUpper);
    if (!result) return null;
    return {
      head: result.head || null,
      tail: result.tail || null
    };
  } catch {
    return null;
  }
}

export const getListNodeCount = async (): Promise<number> => {
  return await getApi().query.VoterList.CounterForListNodes.getValue();
}


const findCorrectBag = (score: bigint, thresholds: bigint[]): bigint => {
  for (const threshold of thresholds) {
    if (score <= threshold) {
      return threshold;
    }
  }
  return thresholds[thresholds.length - 1];
}

const getPositionInBag = async (nominatorId: SS58String, bagUpper: bigint): Promise<number | null> => {
  const bag = await getListBag(bagUpper);
  if (!bag?.head) return null;

  let position = 1;
  let current = bag.head;
  
  while (current && current !== nominatorId) {
    const node = await getListNode(current);
    if (!node?.next) break;
    current = node.next;
    position++;
  }
  
  return current === nominatorId ? position : null;
}

export const analyseNominatorBag = async (nominator: SS58String, score: bigint): Promise<NominatorBagAnalysis | null> => {
  const [node, thresholds] = await Promise.all([
    getListNode(nominator),
    getBagThresholds()
  ]);
  
  if (!node) return null;
  
  const correctBag = findCorrectBag(score, thresholds);
  const isMisplaced = node.bag_upper !== correctBag;
  
  let positionInBag: number | null = null;
  if (!isMisplaced) {
    positionInBag = await getPositionInBag(nominator, node.bag_upper);
  }
  
  return {
    nominator,
    currentBag: node.bag_upper,
    correctBag,
    score,
    isMisplaced,
    positionInBag,
    canRebag: isMisplaced,
    canPutInFront: positionInBag !== null && positionInBag > 1,
    needsMoreStake: !isMisplaced && positionInBag === 1
  };
}

export const checkNominatorStatus = async (nominatorId: SS58String): Promise<NominatorBagAnalysis | null> => {
  const node = await getListNode(nominatorId);
  if (!node) return null;
  
  return await analyseNominatorBag(nominatorId, node.score);
}

export const analyseValidatorNominators = async (validatorId: SS58String, era: number): Promise<BagAnalysisResult> => {
  const stakersData = await getAllStakersExposureToValidatorForEra(validatorId, era);
  
  const analyses: NominatorBagAnalysis[] = [];
  const misplaced: NominatorBagAnalysis[] = [];
  const inactive: NominatorBagAnalysis[] = [];
  
  for (const staker of stakersData.allStakers) {
    const analysis = await analyseNominatorBag(staker.who, staker.value);
    if (analysis) {
      analyses.push(analysis);
      
      if (analysis.isMisplaced) {
        misplaced.push(analysis);
      }
      
      if (analysis.canPutInFront || analysis.needsMoreStake) {
        inactive.push(analysis);
      }
    }
  }
  
  return {
    misplacedNominators: misplaced,
    inactiveNominators: inactive,
    totalAnalysed: analyses.length
  };
}



/////////////////////////////////////////////////////////////////////////////////


// Composites 

export const getSingleValidatorAccumulatedProfitability = async (validatorId: SS58String): Promise<AccumulatedProfitResult> => {
  const [validatorRewards, eraRewards] = await Promise.all([
    cache.get('eras-reward-points', () => getApi().query.Staking.ErasRewardPoints.getEntries({})),
    cache.get('eras-validator-reward', () => getApi().query.Staking.ErasValidatorReward.getEntries({}))
  ]);

  const eraRewardMap = new Map<number, bigint>();
  for (const { keyArgs, value } of eraRewards) {
    const era = keyArgs[0] as number;
    eraRewardMap.set(era, value as bigint);
  }

  let totalReward = BigInt(0);
  let erasProcessed = 0;

  for (const { keyArgs, value } of validatorRewards) {
    const era = keyArgs[0] as number;
    const eraReward = eraRewardMap.get(era);

    if (eraReward && value.individual) {
      const validatorReward = value.individual.find(([vId]: [SS58String, number]) => vId === validatorId);
      if (validatorReward) {
        const [, points] = validatorReward;
        const validatorShare = (eraReward * BigInt(points)) / BigInt(value.total);
        totalReward += validatorShare;
        erasProcessed++;
      }
    }
  }

  return {
    validatorId,
    totalRewards: plancksToDot(totalReward),
    totalRewardsPlancks: totalReward,
    erasProcessed
  };
};

export const getSingleValidatorAPYHistory = async (validatorId: SS58String, numberOfEras?: number): Promise<EraAPYResult[]> => {
  const currentEra = await getCurrentEra();
  if (!currentEra?.index) {
    throw new Error("No current era");
  }

  const historyDepth = numberOfEras || await getHistoryDepth();
  const startEra = currentEra.index - historyDepth;
  const eras = [];
  for (let era = currentEra.index - 1; era >= startEra; era--) {
    eras.push(era);
  }

  const eraPromises = eras.map(async (era) => {
    try {
      const eraValidators = [[era, validatorId]] as [number, SS58String][];
      
      const [commissionData, stakingData, rewardPoints, totalReward] = await Promise.all([
        getCommissionAndBlockedForValidatorsInEra(eraValidators),
        getStakingEraValidatorOverviewForValidatorsInEra(eraValidators),
        getStakingRewardPointsForValidatorsInEra(era),
        getStakingRewardForValidatorsInEra(era)
      ]);

      if (!rewardPoints || !totalReward || !commissionData[0] || !stakingData[0]) {
        return null;
      }

      const validatorReward = rewardPoints.individual.find(([vId]) => vId === validatorId);
      if (!validatorReward) {
        return null;
      }

      const [, points] = validatorReward;
      const validatorRewards = calculateRewardAvailableAfterValidatorCommissionsInEra(
        [[validatorId, BigInt(points)]],
        BigInt(rewardPoints.total),
        BigInt(totalReward)
      );

      if (validatorRewards.length === 0) {
        return null;
      }

      const apyResults = calculateRewardAfterValidatorCommissionWithAPY(
        validatorRewards,
        commissionData,
        stakingData
      );

      if (apyResults.length === 0) {
        return null;
      }

      const result = apyResults[0];
      return {
        era,
        apy: result.apy,
        commission: result.commissionRate,
        totalStaked: result.totalStaked,
        rewardAmount: result.rewardAfterCommission,
        nominatorCount: stakingData[0]?.nominator_count || 0
      };

    } catch (error) {
      console.error(error);
      return null;
    }
  });

  const results = await Promise.all(eraPromises);
  return results.filter((r): r is EraAPYResult => r !== null).sort((a, b) => b.era - a.era);
};

export const getValidatorDashboardData = async (validatorId: SS58String): Promise<ValidatorDashboardData> => {
  const [accumulatedProfit, apyHistory, currentEra] = await Promise.all([
    getSingleValidatorAccumulatedProfitability(validatorId),
    getSingleValidatorAPYHistory(validatorId),
    getCurrentEra()
  ]);

  let currentEraData = null;

  if (currentEra?.index) {
    try {
      const activeValidators = await getActiveValidators();
      if (activeValidators.includes(validatorId)) {
        const eraValidators = [[currentEra.index, validatorId]] as [number, SS58String][];
        
        const [commissionData, stakingData] = await Promise.all([
          getCommissionAndBlockedForValidatorsInEra(eraValidators),
          getStakingEraValidatorOverviewForValidatorsInEra(eraValidators)
        ]);

        if (commissionData[0] && stakingData[0]) {
          currentEraData = {
            apy: 0,
            commission: perbillToDecimal(commissionData[0].commission),
            totalStaked: stakingData[0].total,
            nominatorCount: stakingData[0].nominator_count,
            blocked: commissionData[0].blocked
          };
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
  
  return {
    validatorId,
    accumulatedProfit,
    eraApyHistory: apyHistory,
    currentEraData
  };
};


// ---------------

// returns an array of tuples [era, validator][]
// only includes the current set of validators
export const getErasValidatorsArray = async (era: number) => {
  const validators = await getActiveValidators();
  if (!validators) { throw new Error("Validators not found") }
  const validatorsArrayWithEra = validators.map((validator): [number, SS58String] => [
    era,
    validator
  ]);
  return validatorsArrayWithEra;
}

export const getCommissionAndBlockedForValidatorsInEra = async (eraValidatorsArray: [number, SS58String][]): Promise<ValidatorCommission[]> => {
  const commissionAndBlocked = await getApi().query.Staking.ErasValidatorPrefs.getValues(eraValidatorsArray);
  return eraValidatorsArray.map(([era, validatorId], index): ValidatorCommission => ({
    commission: commissionAndBlocked[index].commission,
    blocked: commissionAndBlocked[index].blocked,
    validatorId, 
    era
  }));
}



// totalPointsForEra: bigint
// totalRewardForEra: bigint
// validatorsPointsForEra: [[validatorId, points]]
export const calculateRewardAvailableAfterValidatorCommissionsInEra = (
  validatorsPointsForEra: [SS58String, bigint][], 
  totalPointsForEra: bigint, 
  totalRewardForEra: bigint, 
): ValidatorReward[] => {
  return validatorsPointsForEra.map(([validatorId, points]): ValidatorReward => {
    const validatorShare = (totalRewardForEra * points) / totalPointsForEra;
    return {
      validatorId,
      points,
      reward: validatorShare,
    };
  });
}

export const calculateRewardAfterValidatorCommissionWithAPY = (
  validatorRewards: ValidatorReward[],
  commissionData: ValidatorCommission[],
  stakingData: (ValidatorStaking | undefined)[]
): ValidatorAPYResult[] => {
  const commissionMap = new Map<SS58String, number>();
  commissionData.forEach(({ validatorId, commission }) => {
    commissionMap.set(validatorId, commission);
  });

  const stakingMap = new Map<SS58String, { total: bigint; own: bigint; nominator_count: number; page_count: number }>();
  commissionData.forEach(({ validatorId }, index) => {
    if (stakingData[index]) {
      stakingMap.set(validatorId, stakingData[index]);
    }
  });

  return validatorRewards.map(({ validatorId, points, reward }) => {
    const commission = commissionMap.get(validatorId) || 0;
    const commissionDecimal = perbillToDecimal(commission);
    const validatorCommission = (reward * BigInt(commission)) / PERBILL_DENOMINATOR;
    const rewardAfterCommission = reward - validatorCommission;
    
    const staking = stakingMap.get(validatorId);
    const totalStaked = staking ? staking.total : 0n;
    
    const dailyRewardInDot = plancksToDot(rewardAfterCommission);
    const totalStakedInDot = plancksToDot(totalStaked);
    
    const apy = totalStakedInDot > 0 
      ? (dailyRewardInDot / totalStakedInDot) * DAYS_PER_YEAR * PERCENTAGE_MULTIPLIER 
      : 0;
    
    return {
      validatorId,
      points,
      totalReward: reward,
      validatorCommission,
      rewardAfterCommission,
      commissionRate: commissionDecimal,
      totalStaked,
      apy,
    };
  });
}


export const getAvailableEras = async () => {
  const currentEra = await getCurrentEra();
  const currentEraNumber = currentEra?.index || 1919;
  
  const eras = [];
  for (let i = currentEraNumber; i >= 1; i--) {
    eras.push(i);
  }
  
  return eras;
}

export const getDashboardData = async (era: number) => {
  const currentEra = await getCurrentEra();
  const activeValidators = await getActiveValidators();
  const eraValidators = await getErasValidatorsArray(era);
  
  const [commissionData, stakingData, rewardPoints, totalReward] = await Promise.all([
    getCommissionAndBlockedForValidatorsInEra(eraValidators),
    getStakingEraValidatorOverviewForValidatorsInEra(eraValidators),
    getStakingRewardPointsForValidatorsInEra(era),
    getStakingRewardForValidatorsInEra(era)
  ]);
  
  let validatorsWithAPY = [];
  
  if (totalReward && rewardPoints) {
    const validatorRewards = calculateRewardAvailableAfterValidatorCommissionsInEra(
      rewardPoints.individual.map(([validatorId, points]) => [validatorId, BigInt(points)]),
      BigInt(rewardPoints.total),
      BigInt(totalReward)
    );
    
    validatorsWithAPY = calculateRewardAfterValidatorCommissionWithAPY(
      validatorRewards,
      commissionData,
      stakingData
    );
  } else {
    validatorsWithAPY = commissionData.map((validator, index) => {
      const staking = stakingData[index];
      const points = rewardPoints?.individual.find(([id]) => id === validator.validatorId)?.[1] || 0;
      
      return {
        validatorId: validator.validatorId,
        points: BigInt(points),
        totalReward: 0n,
        validatorCommission: 0n,
        rewardAfterCommission: 0n,
        commissionRate: perbillToDecimal(validator.commission),
        totalStaked: staking?.total || 0n,
        apy: 0,
        blocked: validator.blocked,
        nominatorCount: staking?.nominator_count || 0
      };
    });
  }
  
  const mappedValidators = validatorsWithAPY
    .map((validator, index) => {
      const commission = commissionData.find(c => c.validatorId === validator.validatorId);
      const staking = stakingData[index];
      
      return {
        validatorId: validator.validatorId,
        apy: validator.apy,
        commissionRate: validator.commissionRate,
        blocked: commission?.blocked || false,
        totalStaked: validator.totalStaked,
        totalPoints: validator.points,
        nominatorCount: staking?.nominator_count || 0
      };
    });

  const isCurrentEra = currentEra?.index === era;
  const sortedValidators = isCurrentEra 
    ? mappedValidators.sort((a, b) => Number(b.totalPoints) - Number(a.totalPoints))
    : mappedValidators.sort((a, b) => b.apy - a.apy);
  
  return {
    currentEra: currentEra?.index || era,
    totalActiveValidators: activeValidators.length,
    validators: sortedValidators,
    isCurrentEra
  };
}

// check if account is eligible for staking rewards
export const isEligibleForStakingRewards = async (accAddr: SS58String): Promise<EligibleForStakingRewards> => {
  const [holds, minimumNominatorBond] = await Promise.all([
    getAccountBalanceHolds(accAddr),
    getMinimumNominatorBond()
  ]);

  const stakingHold = holds.find(hold => hold.id?.type === "Staking");
  const hasStakingHold = !!stakingHold;
  const stakingAmount = stakingHold?.amount || 0n;

  // must have staking hold and stake amt >= minimum nominator bond
  const isEligible = hasStakingHold && stakingAmount >= minimumNominatorBond;

  return {
    isEligible,
    stakingAmount,
    minimumRequired: minimumNominatorBond,
    hasStakingHold
  };
}
