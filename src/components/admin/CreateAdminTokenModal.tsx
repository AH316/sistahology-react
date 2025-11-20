import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import Modal from '../ui/Modal';

interface CreateAdminTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, days: number) => Promise<void>;
  generatedToken?: { token: string; registrationUrl: string } | null;
}

const CreateAdminTokenModal: React.FC<CreateAdminTokenModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  generatedToken,
}) => {
  const [email, setEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSaving(true);
    try {
      await onSubmit(email.trim(), expiresInDays);
      // Don't close or reset - show generated token
    } catch (error) {
      console.error('Failed to create token:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setExpiresInDays(7);
    setCopiedUrl(false);
    setCopiedToken(false);
    onClose();
  };

  const handleCopyUrl = async () => {
    if (!generatedToken) return;
    await navigator.clipboard.writeText(generatedToken.registrationUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyToken = async () => {
    if (!generatedToken) return;
    await navigator.clipboard.writeText(generatedToken.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Admin Registration Token">
      {!generatedToken ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="token-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink focus:border-transparent"
              placeholder="admin@example.com"
              required
              aria-required="true"
            />
            <p className="mt-1 text-xs text-gray-500">
              The new admin must register with this exact email address
            </p>
          </div>

          <div>
            <label htmlFor="token-expiry" className="block text-sm font-medium text-gray-700 mb-2">
              Token Expiration
            </label>
            <select
              id="token-expiry"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink focus:border-transparent"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days (default)</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !email.trim()}
              className="px-4 py-2 bg-gradient-to-r from-sistah-pink to-sistah-rose text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Generating...' : 'Generate Token'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-semibold mb-2">Token Created Successfully</h3>
            <p className="text-green-700 text-sm">
              Share the registration link with <strong>{email}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={generatedToken.registrationUrl}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-1"
                aria-label="Copy registration URL"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token (for reference)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={generatedToken.token}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
              />
              <button
                type="button"
                onClick={handleCopyToken}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-1"
                aria-label="Copy token"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Important:</strong> This link will only be shown once. Make sure to copy it before closing this dialog.
              The token expires in {expiresInDays} {expiresInDays === 1 ? 'day' : 'days'}.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gradient-to-r from-sistah-pink to-sistah-rose text-white rounded-lg hover:shadow-lg transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreateAdminTokenModal;
