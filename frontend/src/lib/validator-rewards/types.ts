import { type SS58String } from "polkadot-api";

export interface ValidatorData {
  validatorId: string;
  apy: number;
  commissionRate: number;
  blocked: boolean;
  totalStaked: bigint;
  totalPoints: bigint;
  nominatorCount: number;
}

export interface DashboardData {
  currentEra: number;
  totalActiveValidators: number;
  validators: ValidatorData[];
  isCurrentEra: boolean;
}


export interface ValidatorCommission {
  commission: number;
  blocked: boolean;
  validatorId: SS58String;
  era: number;
}

export interface ValidatorStaking {
  total: bigint;
  own: bigint;
  nominator_count: number;
  page_count: number;
}

export interface ValidatorReward {
  validatorId: SS58String;
  points: bigint;
  reward: bigint;
}

export interface ValidatorAPYResult {
  validatorId: SS58String;
  points: bigint;
  totalReward: bigint;
  validatorCommission: bigint;
  rewardAfterCommission: bigint;
  commissionRate: number;
  totalStaked: bigint;
  apy: number;
}

export interface AccumulatedProfitResult {
  validatorId: SS58String;
  totalRewards: number;
  totalRewardsPlancks: bigint;
  erasProcessed: number;
}

export interface EraAPYResult {
  era: number;
  apy: number;
  commission: number;
  totalStaked: bigint;
  rewardAmount: bigint;
  nominatorCount: number;
}

export interface ValidatorDashboardData {
  validatorId: SS58String;
  accumulatedProfit: AccumulatedProfitResult;
  eraApyHistory: EraAPYResult[];
  currentEraData: {
    apy: number;
    commission: number;
    totalStaked: bigint;
    nominatorCount: number;
    blocked: boolean;
  } | null;
}

export interface EligibleForStakingRewards {
  isEligible: boolean;
  stakingAmount: bigint;
  minimumRequired: bigint;
  hasStakingHold: boolean;
}

export interface AllStakersExposureResult {
  allStakers: { who: SS58String; value: bigint; }[];
  totalStaked: bigint;
  totalPages: number;
  stakersCount: number;
}

export interface ListNode {
  id: SS58String;
  prev: SS58String | null;
  next: SS58String | null;
  bag_upper: bigint;
  score: bigint;
}

export interface ListBag {
  head: SS58String | null;
  tail: SS58String | null;
}

export interface NominatorBagAnalysis {
  nominator: SS58String;
  currentBag: bigint;
  correctBag: bigint;
  score: bigint;
  isMisplaced: boolean;
  positionInBag: number | null;
  canRebag: boolean;
  canPutInFront: boolean;
  needsMoreStake: boolean;
}

export interface BagAnalysisResult {
  misplacedNominators: NominatorBagAnalysis[];
  inactiveNominators: NominatorBagAnalysis[];
  totalAnalysed: number;
}