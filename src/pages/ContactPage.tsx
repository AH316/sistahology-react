import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import {
  FaFacebook,
  FaInstagram,
  FaXTwitter,
  FaTiktok,
  FaLinkedin,
  FaYoutube,
  FaPinterest,
  FaSnapchat
} from 'react-icons/fa6';
import Navigation from '../components/Navigation';
import { usePageTitle } from '../hooks/usePageTitle';
import { getActiveSections } from '../services/sections';
import { submitContactForm } from '../services/contactSubmissions';
import type { SiteSection } from '../types/sections';
import type { ContactInfo, SocialMedia, FAQLinks } from '../types/sections';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ContactPage: React.FC = () => {
  usePageTitle('Contact');
  const [sections, setSections] = useState<SiteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const result = await getActiveSections('contact');
      if (result.success && result.data) {
        setSections(result.data);
      }
    } catch (error) {
      console.error('Failed to load contact sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSectionByKey = (key: string): SiteSection | undefined => {
    return sections.find((s) => s.section_key === key);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset status
    setSubmitStatus(null);
    setSubmitting(true);

    try {
      const result = await submitContactForm(formData);

      if (result.success) {
        // Success - clear form and show success message
        setFormData({ name: '', email: '', subject: '', message: '' });
        setSubmitStatus({
          type: 'success',
          message: "Thank you for your message! We'll get back to you soon.",
        });

        // Clear success message after 5 seconds
        setTimeout(() => setSubmitStatus(null), 5000);
      } else {
        // Error from service
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Failed to send message. Please try again.',
        });
      }
    } catch (error) {
      // Unexpected error
      console.error('Error submitting contact form:', error);
      setSubmitStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Helper function to check if a contact field should be displayed
  const shouldShowField = (value: string | undefined): boolean => {
    return !!value && !value.toLowerCase().includes('coming soon');
  };

  // Helper function to map platform names to Font Awesome icons
  const getSocialIcon = (platformName: string) => {
    const name = platformName.toLowerCase();

    switch (name) {
      case 'facebook':
        return FaFacebook;
      case 'instagram':
        return FaInstagram;
      case 'twitter':
      case 'x':
        return FaXTwitter;
      case 'tiktok':
        return FaTiktok;
      case 'linkedin':
        return FaLinkedin;
      case 'youtube':
        return FaYoutube;
      case 'pinterest':
        return FaPinterest;
      case 'snapchat':
        return FaSnapchat;
      default:
        return null; // Return null for unknown platforms (will show fallback initials)
    }
  };

  const renderContactInfo = () => {
    const section = getSectionByKey('contact_info');
    if (!section) return null;

    const content = section.content_json as ContactInfo;

    return (
      <div className="glass rounded-3xl p-8">
        <h2 className="text-3xl font-bold text-white mb-6">
          {section.section_title}
        </h2>

        <div className="space-y-6">
          {shouldShowField(content.email) && (
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center floating-flower">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Email Us</h3>
                <p className="text-white/80">{content.email}</p>
              </div>
            </div>
          )}

          {shouldShowField(content.phone) && (
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center floating-flower">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Call Us</h3>
                <p className="text-white/80">{content.phone}</p>
                {shouldShowField(content.hours) && (
                  <p className="text-white/90 text-sm">{content.hours}</p>
                )}
              </div>
            </div>
          )}

          {shouldShowField(content.address) && (
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center floating-flower">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Find Us</h3>
                <p className="text-white/80">{content.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFAQLinks = () => {
    const section = getSectionByKey('faq_links');
    if (!section) return null;

    const content = section.content_json as FAQLinks;

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50">
        <h3 className="text-2xl font-bold text-sistah-purple mb-6">
          {section.section_title}
        </h3>

        <div className="space-y-4">
          {content.questions.map((item, index) => (
            <div key={index}>
              <h4 className="font-semibold text-pink-600 mb-2">{item.question}</h4>
              <p className="text-pink-600/80 text-sm">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSocialMedia = () => {
    const section = getSectionByKey('social_media');
    if (!section) return null;

    const content = section.content_json as SocialMedia;

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 text-center">
        <h3 className="text-2xl font-bold text-sistah-purple mb-4">
          {section.section_title}
        </h3>
        <p className="text-pink-600 mb-6">Stay connected with our community on social media</p>

        <div className="flex justify-center space-x-4">
          {content.platforms.map((platform, index) => {
            const IconComponent = getSocialIcon(platform.name);

            return (
              <a
                key={index}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                title={`${platform.name}: ${platform.handle}`}
              >
                {IconComponent ? (
                  <IconComponent className="w-6 h-6 text-white" />
                ) : (
                  // Fallback to initials for unknown platforms
                  <span className="text-white font-bold text-sm">
                    {platform.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="font-sans bg-gerbera-hero min-h-screen">
        <Navigation />
        <main className="py-20 px-6 flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans bg-gerbera-hero min-h-screen">
      <Navigation />

      <main className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-2xl">
              Contact Us
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              We'd love to hear from you! Reach out with questions, suggestions, or just to say hello
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50">
              <h2 className="text-3xl font-bold text-sistah-purple mb-6">
                Send us a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-pink-600 font-medium mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/50 border border-pink-200 text-gray-800 placeholder-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-pink-600 font-medium mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/50 border border-pink-200 text-gray-800 placeholder-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-pink-600 font-medium mb-2"
                  >
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/50 border border-pink-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="feedback">Feedback & Suggestions</option>
                    <option value="partnership">Partnership Opportunities</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-pink-600 font-medium mb-2"
                  >
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg bg-white/50 border border-pink-200 text-gray-800 placeholder-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                {/* Status Message */}
                {submitStatus && (
                  <div
                    className={`p-4 rounded-lg ${
                      submitStatus.type === 'success'
                        ? 'bg-green-100 border border-green-300 text-green-800'
                        : 'bg-red-100 border border-red-300 text-red-800'
                    }`}
                  >
                    {submitStatus.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 ${
                    submitting
                      ? 'opacity-70 cursor-not-allowed'
                      : 'hover:from-pink-600 hover:to-pink-700 transform hover:scale-105'
                  }`}
                >
                  <Send className="w-5 h-5" />
                  <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {renderContactInfo()}
              {renderFAQLinks()}
              {renderSocialMedia()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
