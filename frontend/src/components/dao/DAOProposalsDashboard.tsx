import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  getCurrentAccount, 
  setCurrentAccount, 
  getAccounts, 
  getProposals, 
  addVote,
  hasUserVoted,
  getUserVote,
  initializeDefaultAccount
} from '../../lib/dao-storage';
import type { Account, Proposal, ProposalStatus } from '../../types/dao';
import { Users, Clock, CheckCircle, XCircle, FileText, Plus } from 'lucide-react';
import { CreateProposalDialog } from './CreateProposalDialog';

export function DAOProposalsDashboard() {
  const [currentAccount, setCurrentAccountState] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    initializeDefaultAccount();
    loadData();
  }, []);

  const loadData = () => {
    setCurrentAccountState(getCurrentAccount());
    setAccounts(getAccounts());
    setProposals(getProposals());
  };

  const handleAccountSwitch = (account: Account) => {
    setCurrentAccount(account);
    setCurrentAccountState(account);
  };

  const handleVote = async (proposalId: string, vote: 'for' | 'against') => {
    if (!currentAccount) return;

    const newVote = {
      accountId: currentAccount.id,
      proposalId,
      vote,
      timestamp: new Date(),
    };

    addVote(newVote);
    loadData();
  };

  const getStatusColor = (status: ProposalStatus): string => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-800';
      case 'Passed': return 'bg-green-100 text-green-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors = {
      'Delivery Charges': 'bg-purple-100 text-purple-800',
      'Platform Commission': 'bg-orange-100 text-orange-800',
      'Restaurant Management': 'bg-green-100 text-green-800',
      'Halal Certification': 'bg-blue-100 text-blue-800',
      'Disciplinary Actions': 'bg-red-100 text-red-800',
      'Platform Governance': 'bg-indigo-100 text-indigo-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isDeadlinePassed = (deadline: Date): boolean => {
    return new Date() > deadline;
  };

  const getQuorumProgress = (votesFor: number, votesAgainst: number, quorumRequired: number): number => {
    const totalVotes = votesFor + votesAgainst;
    return (totalVotes / quorumRequired) * 100;
  };

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">DAO Governance Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Community-driven decisions for the Halal Food Delivery Platform
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Proposal
            </Button>
          </div>
        </div>
      </div>

      {/* Account Info & Switching */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-600" />
              <span className="text-sm font-medium text-gray-700">Connected:</span>
              <span className="text-sm text-pink-600 font-semibold">
                {currentAccount?.name} ({currentAccount?.type})
              </span>
            </div>
            <Badge variant={currentAccount?.hasVotingRights ? 'default' : 'secondary'} className="text-xs text-white bg-primary">
              {currentAccount?.points}pts • {currentAccount?.hasVotingRights ? 'Can Vote' : 'No Vote'}
            </Badge>
          </div>
          <div className="flex gap-2 flex-1 justify-end">
            {accounts.map((account) => (
              <Button
                key={account.id}
                variant={currentAccount?.id === account.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAccountSwitch(account)}
                className={`flex-1 ${currentAccount?.id === account.id ? 'bg-pink-200 hover:bg-pink-300 text-pink-800 border-pink-300' : ''}`}
              >
                {account.name} ({account.type})
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="grid gap-6">
        {proposals.map((proposal) => {
          const userVote = currentAccount ? getUserVote(currentAccount.id, proposal.id) : null;
          const hasVoted = currentAccount ? hasUserVoted(currentAccount.id, proposal.id) : false;
          const deadlinePassed = isDeadlinePassed(proposal.deadline);
          const quorumProgress = getQuorumProgress(proposal.votesFor, proposal.votesAgainst, proposal.quorumRequired);

          return (
            <Card key={proposal.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                {/* Main Content */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex-1 min-w-0">
                      {proposal.title}
                    </h3>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(proposal.status)}>
                        {proposal.status}
                      </Badge>
                      <Badge className={getCategoryColor(proposal.category)}>
                        {proposal.category}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {proposal.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Created {proposal.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className={deadlinePassed ? 'text-red-600 font-medium' : ''}>
                        Deadline: {proposal.deadline.toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Files */}
                  {proposal.files.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        Supporting Documents
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {proposal.files.map((file, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {file.name} ({formatFileSize(file.size)})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Voting Section */}
                <div className="lg:w-80 space-y-4">
                  {/* Vote Counts */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Voting Results</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          For
                        </span>
                        <span className="font-bold text-green-700">{proposal.votesFor}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1 text-red-700">
                          <XCircle className="w-4 h-4" />
                          Against
                        </span>
                        <span className="font-bold text-red-700">{proposal.votesAgainst}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Quorum Progress</span>
                        <span>{Math.min(100, Math.round(quorumProgress))}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, quorumProgress)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {proposal.votesFor + proposal.votesAgainst} / {proposal.quorumRequired} votes needed
                      </div>
                    </div>
                  </div>

                  {/* Voting Buttons */}
                  <div className="space-y-2">
                    {hasVoted ? (
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">
                          You voted: <strong>{userVote?.vote === 'for' ? 'For' : 'Against'}</strong>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Voted on {userVote?.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                    ) : currentAccount?.hasVotingRights && !deadlinePassed && proposal.status === 'Active' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleVote(proposal.id, 'for')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Vote For
                        </Button>
                        <Button
                          onClick={() => handleVote(proposal.id, 'against')}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Vote Against
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          {!currentAccount?.hasVotingRights 
                            ? 'Need 100+ points to vote' 
                            : deadlinePassed 
                            ? 'Voting period ended' 
                            : 'Proposal not active'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {proposals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No proposals found.</p>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            Create the First Proposal
          </Button>
        </div>
      )}

      <CreateProposalDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        currentAccount={currentAccount}
        onProposalCreated={loadData}
      />
    </div>
  );
}