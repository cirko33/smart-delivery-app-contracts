import type { Account, Proposal, Vote, ProposalStatus } from '../types/dao';

const STORAGE_KEYS = {
  CURRENT_ACCOUNT: 'dao_current_account',
  ACCOUNTS: 'dao_accounts',
  PROPOSALS: 'dao_proposals',
  VOTES: 'dao_votes',
} as const;

export const dummyAccounts: Account[] = [
  {
    id: 'driver-001',
    type: 'Driver',
    name: 'Ahmed Hassan',
    points: 150,
    hasVotingRights: true,
  },
  {
    id: 'restaurant-001',
    type: 'Restaurant',
    name: 'Halal Kitchen Express',
    points: 280,
    hasVotingRights: true,
  },
  {
    id: 'customer-001',
    type: 'Customer',
    name: 'Sarah Abdullah',
    points: 95,
    hasVotingRights: false,
  },
];

export const initialProposals: Proposal[] = [
  {
    id: 'prop-001',
    title: 'Reduce Delivery Charges During Peak Hours',
    description: 'Proposal to reduce delivery charges by 15% during peak hours (6-8 PM) to increase customer satisfaction and order volume. This would help both customers and drivers by maintaining steady demand.',
    category: 'Delivery Charges',
    createdBy: 'customer-001',
    createdAt: new Date('2025-09-01T10:00:00Z'),
    deadline: new Date('2025-09-15T23:59:59Z'),
    status: 'Active' as ProposalStatus,
    votesFor: 8,
    votesAgainst: 3,
    quorumRequired: 15,
    files: [
      {
        name: 'peak-hours-analysis.pdf',
        url: '/docs/peak-hours-analysis.pdf',
        size: 245760,
      },
    ],
  },
  {
    id: 'prop-002',
    title: 'Add New Halal Certification Authority',
    description: 'Proposal to recognize and add the Islamic Food Council of America (IFCA) as an approved halal certification authority for restaurants on our platform. This would expand our certified restaurant network.',
    category: 'Halal Certification',
    createdBy: 'restaurant-001',
    createdAt: new Date('2025-08-25T14:30:00Z'),
    deadline: new Date('2025-09-10T23:59:59Z'),
    status: 'Active' as ProposalStatus,
    votesFor: 12,
    votesAgainst: 2,
    quorumRequired: 15,
    files: [
      {
        name: 'ifca-certification-standards.pdf',
        url: '/docs/ifca-standards.pdf',
        size: 512000,
      },
      {
        name: 'ifca-background-check.pdf',
        url: '/docs/ifca-background.pdf',
        size: 189440,
      },
    ],
  },
];

export const initialVotes: Vote[] = [
  { accountId: 'driver-001', proposalId: 'prop-001', vote: 'for', timestamp: new Date('2025-09-02T12:00:00Z') },
  { accountId: 'restaurant-001', proposalId: 'prop-001', vote: 'for', timestamp: new Date('2025-09-02T15:30:00Z') },
  { accountId: 'driver-002', proposalId: 'prop-001', vote: 'against', timestamp: new Date('2025-09-03T09:15:00Z') },
  { accountId: 'restaurant-002', proposalId: 'prop-002', vote: 'for', timestamp: new Date('2025-08-26T11:00:00Z') },
  { accountId: 'driver-001', proposalId: 'prop-002', vote: 'for', timestamp: new Date('2025-08-27T16:45:00Z') },
];

export function getCurrentAccount(): Account | null {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_ACCOUNT);
  if (!stored) return null;
  return JSON.parse(stored);
}

export function setCurrentAccount(account: Account): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_ACCOUNT, JSON.stringify(account));
}

export function getAccounts(): Account[] {
  const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(dummyAccounts));
    return dummyAccounts;
  }
  return JSON.parse(stored);
}

export function getProposals(): Proposal[] {
  const stored = localStorage.getItem(STORAGE_KEYS.PROPOSALS);
  if (!stored) {
    const proposalsWithDates = initialProposals.map(p => ({
      ...p,
      createdAt: new Date(p.createdAt),
      deadline: new Date(p.deadline),
    }));
    localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(proposalsWithDates));
    return proposalsWithDates;
  }
  return JSON.parse(stored).map((p: any) => ({
    ...p,
    createdAt: new Date(p.createdAt),
    deadline: new Date(p.deadline),
  }));
}

export function addProposal(proposal: Proposal): void {
  const proposals = getProposals();
  proposals.push(proposal);
  localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(proposals));
}

export function getVotes(): Vote[] {
  const stored = localStorage.getItem(STORAGE_KEYS.VOTES);
  if (!stored) {
    const votesWithDates = initialVotes.map(v => ({
      ...v,
      timestamp: new Date(v.timestamp),
    }));
    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(votesWithDates));
    return votesWithDates;
  }
  return JSON.parse(stored).map((v: any) => ({
    ...v,
    timestamp: new Date(v.timestamp),
  }));
}

export function addVote(vote: Vote): void {
  const votes = getVotes();
  const existingVoteIndex = votes.findIndex(v => 
    v.accountId === vote.accountId && v.proposalId === vote.proposalId
  );
  
  if (existingVoteIndex >= 0) {
    votes[existingVoteIndex] = vote;
  } else {
    votes.push(vote);
  }
  
  localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(votes));
  updateProposalVoteCounts(vote.proposalId);
}

function updateProposalVoteCounts(proposalId: string): void {
  const proposals = getProposals();
  const votes = getVotes();
  const proposalVotes = votes.filter(v => v.proposalId === proposalId);
  
  const proposalIndex = proposals.findIndex(p => p.id === proposalId);
  if (proposalIndex >= 0) {
    proposals[proposalIndex].votesFor = proposalVotes.filter(v => v.vote === 'for').length;
    proposals[proposalIndex].votesAgainst = proposalVotes.filter(v => v.vote === 'against').length;
    localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(proposals));
  }
}

export function hasUserVoted(accountId: string, proposalId: string): boolean {
  const votes = getVotes();
  return votes.some(v => v.accountId === accountId && v.proposalId === proposalId);
}

export function getUserVote(accountId: string, proposalId: string): Vote | null {
  const votes = getVotes();
  return votes.find(v => v.accountId === accountId && v.proposalId === proposalId) || null;
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_ACCOUNT);
  localStorage.removeItem(STORAGE_KEYS.PROPOSALS);
  localStorage.removeItem(STORAGE_KEYS.VOTES);
}

export function initializeDefaultAccount(): void {
  // Clear old data to ensure we use the updated accounts
  clearAllData();
  const currentAccount = getCurrentAccount();
  if (!currentAccount) {
    setCurrentAccount(dummyAccounts[0]);
  }
}