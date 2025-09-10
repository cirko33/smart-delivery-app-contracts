export type AccountType = 'Driver' | 'Restaurant' | 'Customer';

export type ProposalCategory = 
  | 'Delivery Charges'
  | 'Platform Commission'
  | 'Restaurant Management'
  | 'Halal Certification'
  | 'Disciplinary Actions'
  | 'Platform Governance';

export type ProposalStatus = 'Active' | 'Passed' | 'Failed' | 'Expired';

export interface Account {
  id: string;
  type: AccountType;
  name: string;
  points: number;
  hasVotingRights: boolean;
}

export interface Vote {
  accountId: string;
  proposalId: string;
  vote: 'for' | 'against';
  timestamp: Date;
}

export interface ProposalFile {
  name: string;
  url: string;
  size: number;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  category: ProposalCategory;
  createdBy: string;
  createdAt: Date;
  deadline: Date;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  quorumRequired: number;
  files: ProposalFile[];
}

export interface CreateProposalData {
  title: string;
  description: string;
  category: ProposalCategory;
  files?: File[];
}