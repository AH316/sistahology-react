import React, { useEffect, useState } from 'react';
import { Edit, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { ToastContainer, useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import SectionEditor from '../../components/admin/SectionEditor';
import {
  getSections,
  upsertSection,
  toggleSectionVisibility,
} from '../../services/sections';
import type { SiteSection } from '../../types/sections';

type PageFilter = 'all' | 'about' | 'contact' | 'news';

const AdminSectionsPage: React.FC = () => {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [sections, setSections] = useState<SiteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<SiteSection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pageFilter, setPageFilter] = useState<PageFilter>('all');

  useEffect(() => {
    loadSections();
  }, [pageFilter]);

  const loadSections = async () => {
    try {
      setLoading(true);

      if (pageFilter === 'all') {
        // Load all sections from all pages
        const [aboutRes, contactRes, newsRes] = await Promise.all([
          getSections('about'),
          getSections('contact'),
          getSections('news'),
        ]);

        const allSections = [
          ...(aboutRes.success && aboutRes.data ? aboutRes.data : []),
          ...(contactRes.success && contactRes.data ? contactRes.data : []),
          ...(newsRes.success && newsRes.data ? newsRes.data : []),
        ];

        setSections(allSections);
      } else {
        // Load sections for specific page
        const result = await getSections(pageFilter);
        if (result.success && result.data) {
          setSections(result.data);
        } else {
          showError(result.error || 'Failed to load sections');
        }
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
      showError('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section: SiteSection) => {
    setEditingSection(section);
    setIsModalOpen(true);
  };

  const handleSave = async (updatedSection: Partial<SiteSection>) => {
    try {
      setIsSaving(true);

      const result = await upsertSection({
        id: updatedSection.id,
        page_slug: updatedSection.page_slug!,
        section_key: updatedSection.section_key!,
        section_title: updatedSection.section_title!,
        content_json: updatedSection.content_json!,
        display_order: updatedSection.display_order!,
        is_active: updatedSection.is_active !== false,
      });

      if (result.success) {
        showSuccess('Section updated successfully');
        setIsModalOpen(false);
        setEditingSection(null);
        loadSections();
      } else {
        showError(result.error || 'Failed to save section');
      }
    } catch (error: any) {
      console.error('Failed to save section:', error);
      showError(error.message || 'Failed to save section');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async (section: SiteSection) => {
    const newStatus = !section.is_active;

    const confirmed = await confirm({
      title: newStatus ? 'Activate Section' : 'Deactivate Section',
      message: newStatus
        ? `Make "${section.section_title}" visible to public?`
        : `Hide "${section.section_title}" from public view?`,
      confirmText: newStatus ? 'Activate' : 'Deactivate',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    try {
      const result = await toggleSectionVisibility(section.id, newStatus);

      if (result.success) {
        showSuccess(
          newStatus
            ? 'Section activated successfully'
            : 'Section deactivated successfully'
        );
        loadSections();
      } else {
        showError(result.error || 'Failed to update section visibility');
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      showError('Failed to update section visibility');
    }
  };

  const getPageBadgeColor = (pageSlug: string) => {
    switch (pageSlug) {
      case 'about':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'contact':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'news':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const filteredSections = sections.sort((a, b) => {
    // Sort by page_slug first, then by display_order
    if (a.page_slug !== b.page_slug) {
      return a.page_slug.localeCompare(b.page_slug);
    }
    return a.display_order - b.display_order;
  });

  return (
    <AdminLayout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog />
      <main>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-4">
            Manage Site Sections
          </h1>
          <p className="text-white/80 text-lg">
            Edit content sections for About, Contact, and News pages
          </p>
        </div>

        {/* Page Filter */}
        <div className="flex items-center space-x-2 mb-6">
          <span className="text-white/80 text-sm font-medium">Filter by page:</span>
          {(['all', 'about', 'contact', 'news'] as PageFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setPageFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                pageFilter === filter
                  ? 'bg-white/30 text-white shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
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
                  <th className="px-6 py-4 text-left font-semibold">Section</th>
                  <th className="px-6 py-4 text-left font-semibold">Page</th>
                  <th className="px-6 py-4 text-left font-semibold">Order</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSections.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-white/80"
                    >
                      No sections found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredSections.map((section) => (
                    <tr
                      key={section.id}
                      className="border-t border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">
                            {section.section_title}
                          </div>
                          <div className="text-white/60 text-xs font-mono mt-1">
                            {section.section_key}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getPageBadgeColor(
                            section.page_slug
                          )}`}
                        >
                          {section.page_slug}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/80 text-sm">
                          {section.display_order}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleVisibility(section)}
                          className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                            section.is_active
                              ? 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30'
                              : 'bg-gray-500/20 text-gray-300 border-gray-500/30 hover:bg-gray-500/30'
                          }`}
                        >
                          {section.is_active ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(section)}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                            title="Edit section"
                          >
                            <Edit className="w-5 h-5" />
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

        {/* Edit Modal */}
        {editingSection && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingSection(null);
            }}
            title={`Edit: ${editingSection.section_title}`}
            size="xl"
          >
            <SectionEditor
              section={editingSection}
              onSave={handleSave}
              onCancel={() => {
                setIsModalOpen(false);
                setEditingSection(null);
              }}
              isSaving={isSaving}
            />
          </Modal>
        )}
      </main>
    </AdminLayout>
  );
};

export default AdminSectionsPage;
