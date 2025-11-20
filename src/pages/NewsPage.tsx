import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import Navigation from '../components/Navigation';
import { usePageTitle } from '../hooks/usePageTitle';
import { getActiveSections } from '../services/sections';
import type { SiteSection } from '../types/sections';
import type {
  AnniversaryEvent,
  BookLaunch,
  WellnessProducts,
  UpcomingEvents,
  CommunitySpotlight,
} from '../types/sections';
import { renderIcon } from '../utils/iconRenderer';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const NewsPage: React.FC = () => {
  usePageTitle('News');
  const [sections, setSections] = useState<SiteSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const result = await getActiveSections('news');
      if (result.success && result.data) {
        setSections(result.data);
      }
    } catch (error) {
      console.error('Failed to load news sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSectionByKey = (key: string): SiteSection | undefined => {
    return sections.find((s) => s.section_key === key);
  };

  const renderAnniversaryEvent = () => {
    const section = getSectionByKey('anniversary_event');
    if (!section) return null;

    const content = section.content_json as AnniversaryEvent;

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 floating-flower">
          {renderIcon(content.icon, 'w-10 h-10 text-white')}
        </div>
        <h3 className="text-2xl font-bold text-sistah-purple mb-4 text-center">
          {section.section_title}
        </h3>
        <div className="text-center">
          <p className="text-lg font-semibold text-pink-600 mb-2">{content.date}</p>
          <p className="text-gray-700 leading-relaxed">{content.description}</p>
          {content.cta_text && content.cta_link && (
            <a
              href={content.cta_link}
              className="inline-block mt-4 bg-gradient-to-r from-pink-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all"
            >
              {content.cta_text}
            </a>
          )}
        </div>
      </div>
    );
  };

  const renderBookLaunch = () => {
    const section = getSectionByKey('book_launch');
    if (!section) return null;

    const content = section.content_json as BookLaunch;

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 floating-flower">
          {renderIcon(content.icon, 'w-10 h-10 text-white')}
        </div>
        <h3 className="text-2xl font-bold text-sistah-purple mb-4 text-center">
          {section.section_title}
        </h3>
        <div className="text-center">
          <p className="text-lg font-semibold text-pink-600 mb-2">
            "{content.book_title}"
          </p>
          <p className="text-sm text-gray-600 mb-4">By {content.author}</p>
          <p className="text-gray-700 leading-relaxed mb-4">{content.description}</p>
          {content.cta_text && (
            <button className="bg-gradient-to-r from-pink-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all">
              {content.cta_text}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderWellnessProducts = () => {
    const section = getSectionByKey('wellness_products');
    if (!section) return null;

    const content = section.content_json as WellnessProducts;

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 floating-flower">
          {renderIcon(content.icon, 'w-10 h-10 text-white')}
        </div>
        <h3 className="text-2xl font-bold text-sistah-purple mb-4 text-center">
          {section.section_title}
        </h3>
        <div className="text-center">
          <p className="text-lg font-semibold text-pink-600 mb-2">
            {content.collection_name}
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">{content.description}</p>
          <p className="text-sm text-pink-600">
            {content.social_platform}: {content.social_handle}
          </p>
        </div>
      </div>
    );
  };

  const renderUpcomingEvents = () => {
    const section = getSectionByKey('upcoming_events');
    if (!section) return null;

    const content = section.content_json as UpcomingEvents;

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-pink-200/50 mb-12">
        <h2 className="text-3xl font-bold text-sistah-purple mb-8 text-center">
          {section.section_title}
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {content.events.map((event, index) => (
            <div key={index} className="border-l-4 border-pink-500 pl-6">
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="w-5 h-5 text-pink-500" />
                <span className="text-pink-600 font-semibold">{event.date}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
              <p className="text-gray-700">{event.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCommunitySpotlight = () => {
    const section = getSectionByKey('community_spotlight');
    if (!section) return null;

    const content = section.content_json as CommunitySpotlight;

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-pink-200/50">
        <h2 className="text-3xl font-bold text-sistah-purple mb-8 text-center">
          {section.section_title}
        </h2>

        <p className="text-center text-gray-700 text-lg mb-8">{content.intro}</p>

        <div className={`grid md:grid-cols-${Math.min(content.stats.length, 3)} gap-8`}>
          {content.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-4">
                {renderIcon(stat.icon, 'w-10 h-10 text-sistah-purple')}
              </div>
              <div className="text-4xl font-bold text-sistah-purple mb-2">
                {stat.value}
              </div>
              <p className="text-gray-700 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to={content.cta_link}
            className="bg-gradient-to-r from-pink-500 via-pink-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-full font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 inline-block"
          >
            {content.cta_text}
          </Link>
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
              News & Events
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Stay updated with the latest from our Sistahology community
            </p>
          </div>

          {/* News Grid - Top 3 sections */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {renderAnniversaryEvent()}
            {renderBookLaunch()}
            {renderWellnessProducts()}
          </div>

          {/* Upcoming Events */}
          {renderUpcomingEvents()}

          {/* Community Highlights */}
          {renderCommunitySpotlight()}

          {/* Newsletter Signup */}
          <div className="mt-12 glass rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Stay Updated</h3>
            <p className="text-white/90 mb-6">
              Get the latest news and event announcements delivered to your inbox
            </p>
            <div className="max-w-md mx-auto flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-full bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
              <button className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewsPage;
