import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import type { Account, CreateProposalData, ProposalCategory } from '../../types/dao';
import { addProposal } from '../../lib/dao-storage';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';

interface CreateProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAccount: Account | null;
  onProposalCreated: () => void;
}

const PROPOSAL_CATEGORIES: ProposalCategory[] = [
  'Delivery Charges',
  'Platform Commission',
  'Restaurant Management',
  'Halal Certification',
  'Disciplinary Actions',
  'Platform Governance',
];

export function CreateProposalDialog({ 
  open, 
  onOpenChange, 
  currentAccount, 
  onProposalCreated 
}: CreateProposalDialogProps) {
  const [formData, setFormData] = useState<CreateProposalData>({
    title: '',
    description: '',
    category: 'Platform Governance',
    files: [],
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    setFormData(prev => ({
      ...prev,
      files: [...(prev.files || []), ...files],
    }));
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setFormData(prev => ({
      ...prev,
      files: newFiles,
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentAccount || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const proposalFiles = selectedFiles.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file), // In a real app, you'd upload to a server
        size: file.size,
      }));

      const newProposal = {
        id: `prop-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        createdBy: currentAccount.id,
        createdAt: new Date(),
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'Active' as const,
        votesFor: 0,
        votesAgainst: 0,
        quorumRequired: 15,
        files: proposalFiles,
      };

      addProposal(newProposal);
      onProposalCreated();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'Platform Governance',
        files: [],
      });
      setSelectedFiles([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Failed to create proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreateProposal = currentAccount?.hasVotingRights;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Proposal</DialogTitle>
          <p className="text-gray-600 mt-1">
            Submit a proposal for community voting
          </p>
        </DialogHeader>

        {!canCreateProposal && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-orange-800 font-medium">Voting Rights Required</p>
              <p className="text-orange-700 text-sm mt-1">
                You need at least 100 points to create proposals. Current account has {currentAccount?.points || 0} points.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Title *
            </label>
            <input
              id="title"
              type="text"
              required
              disabled={!canCreateProposal}
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 disabled:bg-gray-100"
              placeholder="Enter a clear, descriptive title for your proposal"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              required
              disabled={!canCreateProposal}
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ProposalCategory }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 disabled:bg-gray-100"
            >
              {PROPOSAL_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              required
              disabled={!canCreateProposal}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 disabled:bg-gray-100"
              placeholder="Provide a detailed description of your proposal, including the rationale and expected impact..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supporting Documents (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload files
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      PDF, DOC, DOCX up to 10MB each
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    disabled={!canCreateProposal}
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  disabled={!canCreateProposal}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">{file.name}</span>
                      <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="p-1"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canCreateProposal || isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create Proposal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}