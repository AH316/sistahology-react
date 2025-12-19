import React, { useEffect, useState } from 'react';
import { Mail, Search, Download, Eye, Clock, MessageCircle, Archive } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { ToastContainer, useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import {
  getContactSubmissions,
  getSubmissionStats,
  updateSubmissionStatus,
  bulkUpdateSubmissionStatus,
  exportSubmissionsToCSV,
  downloadCSV,
} from '../../services/contactSubmissions';
import type { ContactSubmission, ContactSubmissionStatus } from '../../types';

interface SubmissionStats {
  total: number;
  pending: number;
  read: number;
  replied: number;
  archived: number;
}

interface Filters {
  statusFilter: ContactSubmissionStatus | '';
  searchQuery: string;
  startDate: string;
  endDate: string;
}

const ContactSubmissionsPage: React.FC = () => {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { ConfirmDialog } = useConfirm();

  // State management
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<ContactSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats>({
    total: 0,
    pending: 0,
    read: 0,
    replied: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filters>({
    statusFilter: '',
    searchQuery: '',
    startDate: '',
    endDate: '',
  });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Apply filters whenever submissions or filters change
  useEffect(() => {
    applyFilters();
  }, [submissions, filters]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load submissions
      const submissionsResult = await getContactSubmissions();
      if (submissionsResult.success && submissionsResult.data) {
        setSubmissions(submissionsResult.data);
      } else {
        showError(submissionsResult.error || 'Failed to load submissions');
      }

      // Load stats
      const statsResult = await getSubmissionStats();
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Status badge renderer
  const renderStatusBadge = (status: ContactSubmissionStatus) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      read: { color: 'bg-blue-100 text-blue-800', icon: Eye, label: 'Read' },
      replied: { color: 'bg-green-100 text-green-800', icon: MessageCircle, label: 'Replied' },
      archived: { color: 'bg-gray-100 text-gray-800', icon: Archive, label: 'Archived' },
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center space-x-1 px-2 py-1 ${badge.color} text-xs font-medium rounded-full`}
      >
        <Icon className="w-3 h-3" />
        <span>{badge.label}</span>
      </span>
    );
  };

  // Filter submissions based on filters state
  const applyFilters = () => {
    let result = submissions;

    // Status filter
    if (filters.statusFilter) {
      result = result.filter((s) => s.status === filters.statusFilter);
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.subject.toLowerCase().includes(query) ||
          s.message.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (filters.startDate) {
      result = result.filter((s) => new Date(s.submitted_at) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter((s) => new Date(s.submitted_at) <= endOfDay);
    }

    setFilteredSubmissions(result);
  };

  // Handle status change for single submission
  const handleStatusChange = async (id: string, status: ContactSubmissionStatus) => {
    try {
      const result = await updateSubmissionStatus(id, status);
      if (result.success) {
        showSuccess(result.message || 'Status updated');
        loadData(); // Reload to update table and stats
      } else {
        showError(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showError('An unexpected error occurred');
    }
  };

  // Handle bulk status change
  const handleBulkStatusChange = async (status: ContactSubmissionStatus) => {
    try {
      const ids = Array.from(selectedIds);
      const result = await bulkUpdateSubmissionStatus(ids, status);
      if (result.success) {
        showSuccess(result.message || `${ids.length} submissions updated`);
        setSelectedIds(new Set());
        loadData();
      } else {
        showError(result.error || 'Failed to update submissions');
      }
    } catch (error) {
      console.error('Error bulk updating:', error);
      showError('An unexpected error occurred');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const csvContent = exportSubmissionsToCSV(filteredSubmissions);
      const filename = `contact-submissions-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
      showSuccess('Submissions exported successfully');
    } catch (error) {
      console.error('Error exporting:', error);
      showError('Failed to export submissions');
    }
  };

  // View details
  const handleViewDetails = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setViewModalOpen(true);

    // Automatically mark as read if pending
    if (submission.status === 'pending') {
      handleStatusChange(submission.id, 'read');
    }
  };

  // Quick status change from modal
  const handleQuickStatusChange = async (status: ContactSubmissionStatus) => {
    if (!selectedSubmission) return;
    await handleStatusChange(selectedSubmission.id, status);
    setViewModalOpen(false);
    setSelectedSubmission(null);
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredSubmissions.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Filter change handlers
  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog />

      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">Contact Submissions</h1>
            <p className="text-white/90 mt-2 drop-shadow">Manage inquiries from the contact form</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all shadow-lg"
            disabled={filteredSubmissions.length === 0}
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Total */}
          <div className="glass p-6 rounded-lg border border-white/30">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-pink-300" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="glass p-6 rounded-lg border border-white/30">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
              </div>
            </div>
          </div>

          {/* Read */}
          <div className="glass p-6 rounded-lg border border-white/30">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Read</p>
                <p className="text-2xl font-bold text-white">{stats.read}</p>
              </div>
            </div>
          </div>

          {/* Replied */}
          <div className="glass p-6 rounded-lg border border-white/30">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Replied</p>
                <p className="text-2xl font-bold text-white">{stats.replied}</p>
              </div>
            </div>
          </div>

          {/* Archived */}
          <div className="glass p-6 rounded-lg border border-white/30">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center">
                <Archive className="w-6 h-6 text-gray-300" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Archived</p>
                <p className="text-2xl font-bold text-white">{stats.archived}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="glass p-6 rounded-lg border border-white/30">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status filter dropdown */}
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-white/90 mb-2">
                Status
              </label>
              <select
                id="statusFilter"
                name="statusFilter"
                value={filters.statusFilter}
                onChange={(e) =>
                  handleFilterChange('statusFilter', e.target.value as ContactSubmissionStatus | '')
                }
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Search input */}
            <div>
              <label htmlFor="searchQuery" className="block text-sm font-medium text-white/90 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  id="searchQuery"
                  type="text"
                  placeholder="Search name, email, subject..."
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Start date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-white/90 mb-2">
                From Date
              </label>
              <input
                id="startDate"
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* End date */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-white/90 mb-2">
                To Date
              </label>
              <input
                id="endDate"
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar (show when selectedIds.size > 0) */}
        {selectedIds.size > 0 && (
          <div className="glass p-4 rounded-lg border border-white/30 flex items-center justify-between">
            <span className="text-white font-medium">
              {selectedIds.size} submission{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkStatusChange('read')}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Mark as Read</span>
              </button>
              <button
                onClick={() => handleBulkStatusChange('replied')}
                className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Mark as Replied</span>
              </button>
              <button
                onClick={() => handleBulkStatusChange('archived')}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition-colors"
              >
                <Archive className="w-4 h-4" />
                <span>Archive</span>
              </button>
            </div>
          </div>
        )}

        {/* Submissions Table */}
        <div className="glass rounded-lg border border-white/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-lg font-semibold text-white">
              {filteredSubmissions.length === submissions.length
                ? 'All Submissions'
                : `Filtered Results (${filteredSubmissions.length})`}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner color="white" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <p className="text-white/80 text-lg">
                {submissions.length === 0 ? 'No submissions yet' : 'No submissions match your filters'}
              </p>
              {submissions.length > 0 && (
                <button
                  onClick={() =>
                    setFilters({ statusFilter: '', searchQuery: '', startDate: '', endDate: '' })
                  }
                  className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-white/30 text-pink-500 focus:ring-pink-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/90 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(submission.id)}
                          onChange={() => handleToggleSelect(submission.id)}
                          className="rounded border-white/30 text-pink-500 focus:ring-pink-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white/80">{formatDate(submission.submitted_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{submission.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white/80">{submission.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white/80 max-w-xs truncate">{submission.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(submission.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(submission)}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg transition-colors"
                            aria-label="View details"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">View</span>
                          </button>
                          <select
                            value={submission.status}
                            onChange={(e) =>
                              handleStatusChange(submission.id, e.target.value as ContactSubmissionStatus)
                            }
                            className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="pending">Pending</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedSubmission(null);
        }}
        title="Submission Details"
        size="lg"
      >
        {selectedSubmission && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-pink-700 font-semibold text-sm block mb-1">From:</label>
                <p className="text-gray-900">{selectedSubmission.name}</p>
              </div>
              <div>
                <label className="text-pink-700 font-semibold text-sm block mb-1">Email:</label>
                <p className="text-gray-900">
                  <a
                    href={`mailto:${selectedSubmission.email}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {selectedSubmission.email}
                  </a>
                </p>
              </div>
            </div>

            <div>
              <label className="text-pink-700 font-semibold text-sm block mb-1">Subject:</label>
              <p className="text-gray-900">{selectedSubmission.subject}</p>
            </div>

            <div>
              <label className="text-pink-700 font-semibold text-sm block mb-1">Submitted:</label>
              <p className="text-gray-900">{formatDateTime(selectedSubmission.submitted_at)}</p>
            </div>

            <div>
              <label className="text-pink-700 font-semibold text-sm block mb-1">Current Status:</label>
              <div>{renderStatusBadge(selectedSubmission.status)}</div>
            </div>

            <div>
              <label className="text-pink-700 font-semibold text-sm block mb-2">Message:</label>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap text-gray-900 max-h-96 overflow-y-auto">
                {selectedSubmission.message}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleQuickStatusChange('read')}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all shadow-md"
                disabled={selectedSubmission.status === 'read'}
              >
                <Eye className="w-4 h-4" />
                <span>Mark as Read</span>
              </button>
              <button
                onClick={() => handleQuickStatusChange('replied')}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all shadow-md"
                disabled={selectedSubmission.status === 'replied'}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Mark as Replied</span>
              </button>
              <button
                onClick={() => handleQuickStatusChange('archived')}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg transition-all shadow-md"
                disabled={selectedSubmission.status === 'archived'}
              >
                <Archive className="w-4 h-4" />
                <span>Archive</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default ContactSubmissionsPage;
