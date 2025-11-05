import React, { useEffect, useState } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { ToastContainer, useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';

interface Page {
  id: string;
  title: string;
  slug: string;
  content_html: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

const AdminPagesPage: React.FC = () => {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content_html: '',
    published: true,
  });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('title');

      if (error) throw error;

      setPages(data || []);
    } catch (error) {
      console.error('Failed to load pages:', error);
      showError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content_html: page.content_html,
      published: page.published,
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingPage(null);
    setFormData({
      title: '',
      slug: '',
      content_html: '',
      published: true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug) {
      showError('Title and slug are required');
      return;
    }

    try {
      setIsSaving(true);

      if (editingPage) {
        // Update existing page
        const { error } = await supabase
          .from('pages')
          .update({
            title: formData.title,
            slug: formData.slug,
            content_html: formData.content_html,
            published: formData.published,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPage.id);

        if (error) throw error;
        showSuccess('Page updated successfully');
      } else {
        // Create new page
        const { error } = await supabase
          .from('pages')
          .insert({
            title: formData.title,
            slug: formData.slug,
            content_html: formData.content_html,
            published: formData.published,
          });

        if (error) throw error;
        showSuccess('Page created successfully');
      }

      setIsModalOpen(false);
      loadPages();
    } catch (error) {
      console.error('Failed to save page:', error);
      showError('Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (page: Page) => {
    if (!window.confirm(`Are you sure you want to delete "${page.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', page.id);

      if (error) throw error;

      showSuccess('Page deleted successfully');
      loadPages();
    } catch (error) {
      console.error('Failed to delete page:', error);
      showError('Failed to delete page');
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title });
    // Auto-generate slug only when creating new page
    if (!editingPage) {
      setFormData({ ...formData, title, slug: generateSlug(title) });
    }
  };

  return (
    <AdminLayout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <main>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">Manage Pages</h1>
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Create Page</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="glass rounded-2xl border-2 border-white/40 backdrop-blur-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-sistah-pink to-sistah-rose text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Title</th>
                  <th className="px-6 py-4 text-left font-semibold">Slug</th>
                  <th className="px-6 py-4 text-left font-semibold">Published</th>
                  <th className="px-6 py-4 text-left font-semibold">Last Updated</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-white/80">
                      No pages found. Create your first page!
                    </td>
                  </tr>
                ) : (
                  pages.map((page) => (
                    <tr
                      key={page.id}
                      className="border-t border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-medium">{page.title}</td>
                      <td className="px-6 py-4 text-white/80 font-mono text-sm">{page.slug}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            page.published
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`}
                        >
                          {page.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/80 text-sm">
                        {new Date(page.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(page)}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                            title="Edit page"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(page)}
                            className="p-2 text-white/80 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                            title="Delete page"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit/Create Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingPage ? 'Edit Page' : 'Create Page'}
          size="lg"
        >
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Page title"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono text-sm"
                placeholder="page-slug"
              />
              <p className="mt-1 text-xs text-gray-600">
                URL-friendly identifier (e.g., "about" for /about page)
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Content (HTML)
              </label>
              <textarea
                value={formData.content_html}
                onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono text-sm"
                rows={12}
                placeholder="<p>Page content...</p>"
              />
            </div>

            {/* Published */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
              />
              <label htmlFor="published" className="ml-2 text-sm font-medium text-gray-800">
                Published
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </AdminLayout>
  );
};

export default AdminPagesPage;
