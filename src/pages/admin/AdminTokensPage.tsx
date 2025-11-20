import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Shield, Clock, CheckCircle, XCircle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ToastContainer, useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import CreateAdminTokenModal from '../../components/admin/CreateAdminTokenModal';
import {
  listAdminTokens,
  createAdminToken,
  deleteAdminToken,
  type AdminToken,
} from '../../services/adminTokens';

const AdminTokensPage: React.FC = () => {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [tokens, setTokens] = useState<AdminToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<{ token: string; registrationUrl: string } | null>(null);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      setLoading(true);
      const result = await listAdminTokens();
      if (result.success && result.data) {
        setTokens(result.data);
      } else {
        showError(result.error || 'Failed to load tokens');
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
      showError('Failed to load admin tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async (email: string, days: number) => {
    try {
      const result = await createAdminToken(email, days);
      if (result.success && result.data) {
        setGeneratedToken(result.data);
        showSuccess('Admin token created successfully');
        await loadTokens();
      } else {
        showError(result.error || 'Failed to create token');
      }
    } catch (error) {
      console.error('Failed to create token:', error);
      showError('Failed to create admin token');
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    const confirmed = await confirm({
      title: 'Delete Token',
      message: 'Are you sure you want to delete this admin registration token? This action cannot be undone.',
      confirmText: 'Delete',
      isDangerous: true,
    });

    if (!confirmed) return;

    try {
      const result = await deleteAdminToken(tokenId);
      if (result.success) {
        showSuccess('Token deleted successfully');
        await loadTokens();
      } else {
        showError(result.error || 'Failed to delete token');
      }
    } catch (error) {
      console.error('Failed to delete token:', error);
      showError('Failed to delete admin token');
    }
  };

  const openCreateModal = () => {
    setGeneratedToken(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setGeneratedToken(null);
  };

  const getStatusBadge = (status: AdminToken['status']) => {
    switch (status) {
      case 'unused':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            <span>Active</span>
          </span>
        );
      case 'used':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            <span>Used</span>
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            <span>Expired</span>
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">Admin Registration Tokens</h1>
            <p className="text-white/90 mt-2 drop-shadow">
              Manage secure tokens for creating new admin accounts
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Create Token</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-6 rounded-lg border border-white/30">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Active Tokens</p>
                <p className="text-2xl font-bold text-white">
                  {tokens.filter((t) => t.status === 'unused').length}
                </p>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-white/30">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Used Tokens</p>
                <p className="text-2xl font-bold text-white">
                  {tokens.filter((t) => t.status === 'used').length}
                </p>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-white/30">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-gray-300" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Expired Tokens</p>
                <p className="text-2xl font-bold text-white">
                  {tokens.filter((t) => t.status === 'expired').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tokens Table */}
        <div className="glass rounded-lg border border-white/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-lg font-semibold text-white">All Tokens</h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white/90 mb-2">No Tokens Yet</h3>
              <p className="text-white/70 mb-4">
                Create your first admin registration token to invite new admins
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Token</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Used
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/90 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {tokens.map((token) => (
                    <tr key={token.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{token.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(token.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white/80">{formatDate(token.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white/80">{formatDate(token.expires_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white/80">
                          {token.used_at ? formatDate(token.used_at) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteToken(token.id)}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors"
                          aria-label="Delete token"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Token Modal */}
      <CreateAdminTokenModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleCreateToken}
        generatedToken={generatedToken}
      />
    </AdminLayout>
  );
};

export default AdminTokensPage;
