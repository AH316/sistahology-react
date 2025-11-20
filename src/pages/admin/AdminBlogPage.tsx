import React, { useEffect, useState } from 'react';
import { Edit, Plus, Trash2, Calendar } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import RichTextEditor from '../../components/RichTextEditor';
import { ToastContainer, useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import {
  listBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  generateSlug,
  isSlugAvailable,
  type BlogPost
} from '../../services/posts';

const AdminBlogPage: React.FC = () => {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content_html: '',
    status: 'draft' as 'draft' | 'published',
    published_at: ''
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await listBlogPosts(true); // Include drafts for admin
      setPosts(data);
    } catch (error) {
      console.error('Failed to load posts:', error);
      showError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content_html: post.content_html,
      status: post.status,
      published_at: post.published_at
        ? new Date(post.published_at).toISOString().slice(0, 16)
        : ''
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content_html: '',
      status: 'draft',
      published_at: ''
    });
    setIsModalOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title });
    // Auto-generate slug only when creating new post
    if (!editingPost) {
      const newSlug = generateSlug(title);
      setFormData({ ...formData, title, slug: newSlug });
    }
  };

  const handleSlugChange = async (slug: string) => {
    setFormData({ ...formData, slug });
  };

  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      showError('Title is required');
      return;
    }

    if (!formData.slug.trim()) {
      showError('Slug is required');
      return;
    }

    if (!formData.content_html.trim()) {
      showError('Content is required');
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      showError('Slug must contain only lowercase letters, numbers, and hyphens');
      return;
    }

    // Check if status is published but no published_at date
    if (formData.status === 'published' && !formData.published_at) {
      showError('Published date is required for published posts');
      return;
    }

    try {
      setIsSaving(true);

      // Check slug availability
      const slugIsAvailable = await isSlugAvailable(
        formData.slug,
        editingPost?.id
      );

      if (!slugIsAvailable) {
        showError(`Slug "${formData.slug}" is already in use`);
        return;
      }

      if (editingPost) {
        // Update existing post
        const updates: any = {
          title: formData.title,
          slug: formData.slug,
          content_html: formData.content_html,
          status: formData.status
        };

        if (formData.excerpt) {
          updates.excerpt = formData.excerpt;
        }

        if (formData.published_at) {
          updates.published_at = new Date(formData.published_at).toISOString();
        } else {
          updates.published_at = null;
        }

        await updateBlogPost(editingPost.id, updates);
        showSuccess('Blog post updated successfully');
      } else {
        // Create new post
        const createData: any = {
          title: formData.title,
          content_html: formData.content_html,
          status: formData.status
        };

        if (formData.excerpt) {
          createData.excerpt = formData.excerpt;
        }

        if (formData.published_at) {
          createData.published_at = new Date(formData.published_at).toISOString();
        }

        await createBlogPost(createData);
        showSuccess('Blog post created successfully');
      }

      setIsModalOpen(false);
      loadPosts();
    } catch (error: any) {
      console.error('Failed to save post:', error);
      showError(error.message || 'Failed to save blog post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    const confirmed = await confirm({
      title: 'Delete Blog Post',
      message: `Are you sure you want to delete "${post.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      await deleteBlogPost(post.id);
      showSuccess('Blog post deleted successfully');
      loadPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
      showError('Failed to delete blog post');
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    const isPublishing = post.status === 'draft';

    const confirmed = await confirm({
      title: isPublishing ? 'Publish Blog Post' : 'Unpublish Blog Post',
      message: isPublishing
        ? `Publish "${post.title}"? It will be visible to all users on the blog page.`
        : `Unpublish "${post.title}"? It will be hidden from public view and moved to draft status.`,
      confirmText: isPublishing ? 'Publish' : 'Unpublish',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    const newStatus = isPublishing ? 'published' : 'draft';
    const newPublishedAt =
      newStatus === 'published' && !post.published_at
        ? new Date().toISOString()
        : post.published_at;

    try {
      await updateBlogPost(post.id, {
        status: newStatus,
        published_at: newPublishedAt
      });
      showSuccess(
        newStatus === 'published'
          ? 'Post published successfully'
          : 'Post unpublished successfully'
      );
      loadPosts();
    } catch (error) {
      console.error('Failed to update post status:', error);
      showError('Failed to update post status');
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Draft';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog />
      <main>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            Manage Blog Posts
          </h1>
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Post</span>
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
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-left font-semibold">
                    Published
                  </th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-white/80"
                    >
                      No blog posts found. Create your first post!
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr
                      key={post.id}
                      className="border-t border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">
                            {post.title}
                          </div>
                          <div className="text-white/60 text-xs font-mono mt-1">
                            /{post.slug}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleTogglePublish(post)}
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            post.status === 'published'
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30'
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30'
                          }`}
                        >
                          {post.status === 'published' ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-white/80 text-sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(post.published_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(post)}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                            title="Edit post"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(post)}
                            className="p-2 text-white/80 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                            title="Delete post"
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
          title={editingPost ? 'Edit Blog Post' : 'Create Blog Post'}
          size="xl"
        >
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Enter post title"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono text-sm"
                placeholder="url-friendly-slug"
              />
              <p className="mt-1 text-xs text-black">
                URL: /blog/{formData.slug || 'your-slug'}
              </p>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Excerpt (Optional)
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                rows={3}
                maxLength={200}
                placeholder="Brief summary for blog list preview"
              />
              <p className="mt-1 text-xs text-black">
                {formData.excerpt.length}/200 characters
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Content
              </label>
              <RichTextEditor
                value={formData.content_html}
                onChange={(content) =>
                  setFormData({ ...formData, content_html: content })
                }
                placeholder="Write your blog post content here..."
              />
            </div>

            {/* Status and Published Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={formData.status === 'draft'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'draft' | 'published'
                        })
                      }
                      className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                    />
                    <span className="ml-2 text-sm text-black">Draft</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="published"
                      checked={formData.status === 'published'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'draft' | 'published'
                        })
                      }
                      className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                    />
                    <span className="ml-2 text-sm text-black">
                      Published
                    </span>
                  </label>
                </div>
              </div>

              {/* Published Date - only show when Published is selected */}
              {formData.status === 'published' && (
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Published Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.published_at}
                    onChange={(e) =>
                      setFormData({ ...formData, published_at: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              )}
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

export default AdminBlogPage;
