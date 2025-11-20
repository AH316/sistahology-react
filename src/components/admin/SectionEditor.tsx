import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { SiteSection, SectionContent } from '../../types/sections';
import LucideIconPicker from './LucideIconPicker';

interface SectionEditorProps {
  section: Partial<SiteSection>;
  onSave: (section: Partial<SiteSection>) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  onSave,
  onCancel,
  isSaving,
}) => {
  const [formData, setFormData] = useState<Partial<SiteSection>>(section);

  const handleContentChange = (newContent: SectionContent) => {
    setFormData({ ...formData, content_json: newContent });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const renderContentFields = () => {
    const sectionKey = formData.section_key;
    const content = formData.content_json || {};

    switch (sectionKey) {
      // ABOUT PAGE SECTIONS
      case 'founder_bio':
        return <FounderBioFields content={content} onChange={handleContentChange} />;
      case 'mission_values':
        return <MissionValuesFields content={content} onChange={handleContentChange} />;
      case 'platform_features':
        return <PlatformFeaturesFields content={content} onChange={handleContentChange} />;
      case 'community_stats':
        return <CommunityStatsFields content={content} onChange={handleContentChange} />;

      // CONTACT PAGE SECTIONS
      case 'contact_info':
        return <ContactInfoFields content={content} onChange={handleContentChange} />;
      case 'social_media':
        return <SocialMediaFields content={content} onChange={handleContentChange} />;
      case 'faq_links':
        return <FAQLinksFields content={content} onChange={handleContentChange} />;

      // NEWS PAGE SECTIONS
      case 'anniversary_event':
        return <AnniversaryEventFields content={content} onChange={handleContentChange} />;
      case 'book_launch':
        return <BookLaunchFields content={content} onChange={handleContentChange} />;
      case 'wellness_products':
        return <WellnessProductsFields content={content} onChange={handleContentChange} />;
      case 'upcoming_events':
        return <UpcomingEventsFields content={content} onChange={handleContentChange} />;
      case 'community_spotlight':
        return <CommunitySpotlightFields content={content} onChange={handleContentChange} />;

      default:
        return (
          <div className="text-gray-500 text-sm">
            Select a section type to edit its content
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Section Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Section Title
          </label>
          <input
            type="text"
            value={formData.section_title || ''}
            onChange={(e) =>
              setFormData({ ...formData, section_title: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Display title for this section"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Display Order
          </label>
          <input
            type="number"
            value={formData.display_order || 1}
            onChange={(e) =>
              setFormData({
                ...formData,
                display_order: parseInt(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            min="1"
            required
          />
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active !== false}
          onChange={(e) =>
            setFormData({ ...formData, is_active: e.target.checked })
          }
          className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
        />
        <label htmlFor="is_active" className="ml-2 text-sm text-black">
          Active (visible to public)
        </label>
      </div>

      {/* Content Fields (dynamic based on section_key) */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-black mb-4">
          Section Content
        </h3>
        {renderContentFields()}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Section'}
        </button>
      </div>
    </form>
  );
};

// =====================================================
// FIELD COMPONENTS FOR EACH SECTION TYPE
// =====================================================

// ABOUT PAGE: Founder Bio
const FounderBioFields: React.FC<{
  content: any;
  onChange: (content: any) => void;
}> = ({ content, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-black mb-2">Name</label>
        <input
          type="text"
          value={content.name || ''}
          onChange={(e) => onChange({ ...content, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Founder name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">Title</label>
        <input
          type="text"
          value={content.title || ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Founder title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">Quote 1</label>
        <textarea
          value={content.quote_1 || ''}
          onChange={(e) => onChange({ ...content, quote_1: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
          placeholder="First quote paragraph"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">Quote 2</label>
        <textarea
          value={content.quote_2 || ''}
          onChange={(e) => onChange({ ...content, quote_2: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
          placeholder="Second quote paragraph"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">Quote 3</label>
        <textarea
          value={content.quote_3 || ''}
          onChange={(e) => onChange({ ...content, quote_3: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
          placeholder="Third quote paragraph"
        />
      </div>
      <LucideIconPicker
        selectedIcon={content.icon || 'Heart'}
        onIconChange={(icon) => onChange({ ...content, icon })}
      />
    </div>
  );
};

// ABOUT PAGE: Mission & Values
const MissionValuesFields: React.FC<{
  content: any;
  onChange: (content: any) => void;
}> = ({ content, onChange }) => {
  const values = content.values || [];

  const addValue = () => {
    onChange({
      ...content,
      values: [...values, { title: '', icon: 'Heart', description: '' }],
    });
  };

  const removeValue = (index: number) => {
    onChange({
      ...content,
      values: values.filter((_: any, i: number) => i !== index),
    });
  };

  const updateValue = (index: number, field: string, value: string) => {
    const updated = [...values];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...content, values: updated });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-black mb-2">Intro Text</label>
        <textarea
          value={content.intro || ''}
          onChange={(e) => onChange({ ...content, intro: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={2}
          placeholder="Introductory text"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-black">Values</label>
          <button
            type="button"
            onClick={addValue}
            className="flex items-center space-x-1 text-pink-600 hover:text-pink-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Value</span>
          </button>
        </div>

        {values.map((value: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-500">Value #{index + 1}</span>
              <button
                type="button"
                onClick={() => removeValue(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={value.title || ''}
              onChange={(e) => updateValue(index, 'title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Value title"
            />
            <textarea
              value={value.description || ''}
              onChange={(e) => updateValue(index, 'description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              rows={2}
              placeholder="Value description"
            />
            <LucideIconPicker
              selectedIcon={value.icon || 'Heart'}
              onIconChange={(icon) => updateValue(index, 'icon', icon)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ABOUT PAGE: Platform Features
const PlatformFeaturesFields: React.FC<{
  content: any;
  onChange: (content: any) => void;
}> = ({ content, onChange }) => {
  const features = content.features || [];

  const addFeature = () => {
    onChange({
      ...content,
      features: [...features, { title: '', icon: 'Sparkles', description: '' }],
    });
  };

  const removeFeature = (index: number) => {
    onChange({
      ...content,
      features: features.filter((_: any, i: number) => i !== index),
    });
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...content, features: updated });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-medium text-black">Features</label>
        <button
          type="button"
          onClick={addFeature}
          className="flex items-center space-x-1 text-pink-600 hover:text-pink-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Feature</span>
        </button>
      </div>

      {features.map((feature: any, index: number) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500">Feature #{index + 1}</span>
            <button
              type="button"
              onClick={() => removeFeature(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={feature.title || ''}
            onChange={(e) => updateFeature(index, 'title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="Feature title"
          />
          <textarea
            value={feature.description || ''}
            onChange={(e) => updateFeature(index, 'description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            rows={2}
            placeholder="Feature description"
          />
          <LucideIconPicker
            selectedIcon={feature.icon || 'Sparkles'}
            onIconChange={(icon) => updateFeature(index, 'icon', icon)}
          />
        </div>
      ))}
    </div>
  );
};

// ABOUT PAGE: Community Stats
const CommunityStatsFields: React.FC<{
  content: any;
  onChange: (content: any) => void;
}> = ({ content, onChange }) => {
  const stats = content.stats || [];

  const addStat = () => {
    onChange({
      ...content,
      stats: [...stats, { value: '', label: '' }],
    });
  };

  const removeStat = (index: number) => {
    onChange({
      ...content,
      stats: stats.filter((_: any, i: number) => i !== index),
    });
  };

  const updateStat = (index: number, field: string, value: string) => {
    const updated = [...stats];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...content, stats: updated });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-medium text-black">Statistics</label>
        <button
          type="button"
          onClick={addStat}
          className="flex items-center space-x-1 text-pink-600 hover:text-pink-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stat</span>
        </button>
      </div>

      {stats.map((stat: any, index: number) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500">Stat #{index + 1}</span>
            <button
              type="button"
              onClick={() => removeStat(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={stat.value || ''}
            onChange={(e) => updateStat(index, 'value', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="Stat value (e.g., 15,000+)"
          />
          <input
            type="text"
            value={stat.label || ''}
            onChange={(e) => updateStat(index, 'label', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="Stat label"
          />
        </div>
      ))}
    </div>
  );
};

// CONTACT PAGE: Contact Info
const ContactInfoFields: React.FC<{
  content: any;
  onChange: (content: any) => void;
}> = ({ content, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-black mb-2">Email</label>
        <input
          type="email"
          value={content.email || ''}
          onChange={(e) => onChange({ ...content, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="hello@sistahology.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">Phone</label>
        <input
          type="text"
          value={content.phone || ''}
          onChange={(e) => onChange({ ...content, phone: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="(555) 123-4567"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">Address</label>
        <input
          type="text"
          value={content.address || ''}
          onChange={(e) => onChange({ ...content, address: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="123 Main St, City, State ZIP"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">Hours</label>
        <input
          type="text"
          value={content.hours || ''}
          onChange={(e) => onChange({ ...content, hours: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Monday - Friday: 9am - 5pm PST"
        />
      </div>
    </div>
  );
};

// CONTACT PAGE: Social Media
const SocialMediaFields: React.FC<{
  content: any;
  onChange: (content: any) => void;
}> = ({ content, onChange }) => {
  const platforms = content.platforms || [];

  const addPlatform = () => {
    onChange({
      ...content,
      platforms: [...platforms, { name: '', handle: '', url: '' }],
    });
  };

  const removePlatform = (index: number) => {
    onChange({
      ...content,
      platforms: platforms.filter((_: any, i: number) => i !== index),
    });
  };

  const updatePlatform = (index: number, field: string, value: string) => {
    const updated = [...platforms];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...content, platforms: updated });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-medium text-black">Social Platforms</label>
        <button
          type="button"
          onClick={addPlatform}
          className="flex items-center space-x-1 text-pink-600 hover:text-pink-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Platform</span>
        </button>
      </div>

      {platforms.map((platform: any, index: number) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500">Platform #{index + 1}</span>
            <button
              type="button"
              onClick={() => removePlatform(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={platform.name || ''}
            onChange={(e) => updatePlatform(index, 'name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="Platform name (e.g., Instagram)"
          />
          <input
            type="text"
            value={platform.handle || ''}
            onChange={(e) => updatePlatform(index, 'handle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="Handle (e.g., @sistahology)"
          />
          <input
            type="url"
            value={platform.url || ''}
            onChange={(e) => updatePlatform(index, 'url', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="URL (e.g., https://instagram.com/sistahology)"
          />
        </div>
      ))}
    </div>
  );
};

// CONTACT PAGE: FAQ Links
const FAQLinksFields: React.FC<{
  content: any;
  onChange: (content: any) => void;
}> = ({ content, onChange }) => {
  const questions = content.questions || [];

  const addQuestion = () => {
    onChange({
      ...content,
      questions: [...questions, { question: '', answer: '' }],
    });
  };

  const removeQuestion = (index: number) => {
    onChange({
      ...content,
      questions: questions.filter((_: any, i: number) => i !== index),
    });
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...content, questions: updated });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-medium text-black">FAQ Items</label>
        <button
          type="button"
          onClick={addQuestion}
          className="flex items-center space-x-1 text-pink-600 hover:text-pink-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </div>

      {questions.map((item: any, index: number) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500">FAQ #{index + 1}</span>
            <button
              type="button"
              onClick={() => removeQuestion(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={item.question || ''}
            onChange={(e) => updateQuestion(index, 'question', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="Question"
          />
          <textarea
            value={item.answer || ''}
            onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            rows={3}
            placeholder="Answer"
          />
        </div>
      ))}
    </div>
  );
};

// NEWS PAGE: Anniversary Event
const AnniversaryEventFields: React.FC<{
  content: any;
  onChange: (content: any) => void;
}> = ({ content, onChange }) => {
  return (
    <div className="space-y-4">
      <LucideIconPicker
        selectedIcon={content.icon || 'Calendar'}
        onIconChange={(icon) => onChange({ ...content, icon })}
      />
      <div>
        <label className="block text-sm font-medium text-black mb-2">Date</label>
        <input
          type="text"
          value={content.date || ''}
          onChange={(e) => onChange({ ...content, date: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="September 24th"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">Description</label>
        <textarea
          value={content.description || ''}
          onChange={(e) => onChange({ ...content, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
          placeholder="Event description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">CTA Text (Optional)</label>
        <input
          type="text"
          value={content.cta_text || ''}
          onChange={(e) => onChange({ ...content, cta_text: e.target.value || null })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Learn More"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">CTA Link (Optional)</label>
        <input
          type="url"
          value={content.cta_link || ''}
          onChange={(e) => onChange({ ...content, cta_link: e.target.value || null })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="https://..."
        />
      </div>
    </div>
  );
};

// NEWS PAGE: Book Launch
const BookLaunchFields: React.FC<{
  content: any;
  onChange: (content: any) => void;
}> = ({ content, onChange }) => {
  return (
    <div className="space-y-4">
      <LucideIconPicker
        selectedIcon={content.icon || 'BookOpen'}
        onIconChange={(icon) => onChange({ ...content, icon })}
      />
      <div>
        <label className="block text-sm font-medium text-black mb-2">Book Title</label>
        <input
          type="text"
          value={content.book_title || ''}
          onChange={(e) => onChange({ ...content, book_title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Book title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">Author</label>
        <input
          type="text"
          value={content.author || ''}
          onChange={(e) => onChange({ ...content, author: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Author name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">Description</label>
        <textarea
          value={content.description || ''}
          onChange={(e) => onChange({ ...content, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
          placeholder="Book description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">CTA Text (Optional)</label>
        <input
          type="text"
          value={content.cta_text || ''}
          onChange={(e) => onChange({ ...content, cta_text: e.target.value || null })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Buy Now"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">CTA Link (Optional)</label>
        <input
          type="url"
          value={content.cta_link || ''}
          onChange={(e) => onChange({ ...content, cta_link: e.target.value || null })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="https://..."
        />
      </div>
    </div>
  );
};

// NEWS PAGE: Wellness Products
const WellnessProductsFields: React.FC<{
  content: any;
  onChange: (content: any) => void;
}> = ({ content, onChange }) => {
  return (
    <div className="space-y-4">
      <LucideIconPicker
        selectedIcon={content.icon || 'Sparkles'}
        onIconChange={(icon) => onChange({ ...content, icon })}
      />
      <div>
        <label className="block text-sm font-medium text-black mb-2">Collection Name</label>
        <input
          type="text"
          value={content.collection_name || ''}
          onChange={(e) => onChange({ ...content, collection_name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Product collection name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">Description</label>
        <textarea
          value={content.description || ''}
          onChange={(e) => onChange({ ...content, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
          placeholder="Collection description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">Social Handle</label>
        <input
          type="text"
          value={content.social_handle || ''}
          onChange={(e) => onChange({ ...content, social_handle: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="@handle"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">Social Platform</label>
        <input
          type="text"
          value={content.social_platform || ''}
          onChange={(e) => onChange({ ...content, social_platform: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Instagram"
        />
      </div>
    </div>
  );
};

// NEWS PAGE: Upcoming Events
const UpcomingEventsFields: React.FC<{
  content: any;
  onChange: (content: any) => void;
}> = ({ content, onChange }) => {
  const events = content.events || [];

  const addEvent = () => {
    onChange({
      ...content,
      events: [...events, { date: '', title: '', description: '' }],
    });
  };

  const removeEvent = (index: number) => {
    onChange({
      ...content,
      events: events.filter((_: any, i: number) => i !== index),
    });
  };

  const updateEvent = (index: number, field: string, value: string) => {
    const updated = [...events];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...content, events: updated });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-medium text-black">Events</label>
        <button
          type="button"
          onClick={addEvent}
          className="flex items-center space-x-1 text-pink-600 hover:text-pink-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      </div>

      {events.map((event: any, index: number) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500">Event #{index + 1}</span>
            <button
              type="button"
              onClick={() => removeEvent(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={event.date || ''}
            onChange={(e) => updateEvent(index, 'date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="February 14, 2024"
          />
          <input
            type="text"
            value={event.title || ''}
            onChange={(e) => updateEvent(index, 'title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="Event title"
          />
          <textarea
            value={event.description || ''}
            onChange={(e) => updateEvent(index, 'description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            rows={2}
            placeholder="Event description"
          />
        </div>
      ))}
    </div>
  );
};

// NEWS PAGE: Community Spotlight
const CommunitySpotlightFields: React.FC<{
  content: any;
  onChange: (content: any) => void;
}> = ({ content, onChange }) => {
  const stats = content.stats || [];

  const addStat = () => {
    onChange({
      ...content,
      stats: [...stats, { icon: 'Users', value: '', label: '' }],
    });
  };

  const removeStat = (index: number) => {
    onChange({
      ...content,
      stats: stats.filter((_: any, i: number) => i !== index),
    });
  };

  const updateStat = (index: number, field: string, value: string) => {
    const updated = [...stats];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...content, stats: updated });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-black mb-2">Intro Text</label>
        <textarea
          value={content.intro || ''}
          onChange={(e) => onChange({ ...content, intro: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={2}
          placeholder="Introductory text"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-black">Statistics</label>
          <button
            type="button"
            onClick={addStat}
            className="flex items-center space-x-1 text-pink-600 hover:text-pink-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stat</span>
          </button>
        </div>

        {stats.map((stat: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-500">Stat #{index + 1}</span>
              <button
                type="button"
                onClick={() => removeStat(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <LucideIconPicker
              selectedIcon={stat.icon || 'Users'}
              onIconChange={(icon) => updateStat(index, 'icon', icon)}
            />
            <input
              type="text"
              value={stat.value || ''}
              onChange={(e) => updateStat(index, 'value', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Stat value (e.g., 15,000+)"
            />
            <input
              type="text"
              value={stat.label || ''}
              onChange={(e) => updateStat(index, 'label', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Stat label"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">CTA Text</label>
        <input
          type="text"
          value={content.cta_text || ''}
          onChange={(e) => onChange({ ...content, cta_text: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Join Our Community"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">CTA Link</label>
        <input
          type="text"
          value={content.cta_link || ''}
          onChange={(e) => onChange({ ...content, cta_link: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="/register"
        />
      </div>
    </div>
  );
};

export default SectionEditor;
