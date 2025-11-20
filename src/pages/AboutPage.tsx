import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { usePageTitle } from '../hooks/usePageTitle';
import { getActiveSections } from '../services/sections';
import type { SiteSection } from '../types/sections';
import type {
  FounderBio,
  MissionValues,
  PlatformFeatures,
  CommunityStats,
} from '../types/sections';
import { renderIcon, renderIconFilled } from '../utils/iconRenderer';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const AboutPage: React.FC = () => {
  usePageTitle('About');
  const [sections, setSections] = useState<SiteSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const result = await getActiveSections('about');
      if (result.success && result.data) {
        setSections(result.data);
      }
    } catch (error) {
      console.error('Failed to load about sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSectionByKey = (key: string): SiteSection | undefined => {
    return sections.find((s) => s.section_key === key);
  };

  const renderFounderBio = () => {
    const section = getSectionByKey('founder_bio');
    if (!section) return null;

    const content = section.content_json as FounderBio;

    return (
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
              About Sistahology
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              A unique place for women's digital journaling, created by women, for women
            </p>
          </div>

          {/* Founder Section */}
          <div className="glass rounded-3xl p-12 mb-16">
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center shadow-2xl floating-flower">
                {renderIconFilled(content.icon, 'w-16 h-16 text-white')}
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-6">{content.name}</h2>
            <p className="text-lg text-white/95 leading-relaxed mb-6">{content.title}</p>

            <div className="text-left text-white/90 space-y-4 max-w-3xl mx-auto">
              <p className="leading-relaxed">"{content.quote_1}"</p>
              <p className="leading-relaxed">"{content.quote_2}"</p>
              <p className="leading-relaxed italic">"{content.quote_3}"</p>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderMissionValues = () => {
    const section = getSectionByKey('mission_values');
    if (!section) return null;

    const content = section.content_json as MissionValues;

    return (
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6 drop-shadow-2xl">
              {section.section_title}
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              {content.intro}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {content.values.map((value, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 text-center hover:scale-105 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 floating-flower">
                  {renderIcon(value.icon, 'w-8 h-8 text-white')}
                </div>
                <h3 className="text-2xl font-bold text-sistah-purple mb-4">
                  {value.title}
                </h3>
                <p className="text-pink-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderPlatformFeatures = () => {
    const section = getSectionByKey('platform_features');
    if (!section) return null;

    const content = section.content_json as PlatformFeatures;

    return (
      <section className="py-16 px-6 bg-white/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-sistah-purple mb-6">
              {section.section_title}
            </h2>
            <p className="text-xl text-pink-600 max-w-3xl mx-auto">
              More than just a journaling platform—it's your personal sanctuary for growth and reflection
            </p>
          </div>

          <div className={`grid md:grid-cols-2 lg:grid-cols-${Math.min(content.features.length, 4)} gap-8`}>
            {content.features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 floating-flower">
                  {renderIcon(feature.icon, 'w-8 h-8 text-white')}
                </div>
                <h3 className="text-lg font-bold text-sistah-purple mb-2">
                  {feature.title}
                </h3>
                <p className="text-pink-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderCommunityStats = () => {
    const section = getSectionByKey('community_stats');
    if (!section) return null;

    const content = section.content_json as CommunityStats;

    return (
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-8">
              {section.section_title}
            </h2>

            <div className={`grid md:grid-cols-${Math.min(content.stats.length, 3)} gap-8`}>
              {content.stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <p className="text-white/80">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                to="/register"
                className="bg-gradient-to-r from-pink-500 via-pink-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-full font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 inline-block"
              >
                Join Our Sisterhood Today
              </Link>
            </div>
          </div>
        </div>
      </section>
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
      <main>
        {renderFounderBio()}
        {renderMissionValues()}
        {renderPlatformFeatures()}
        {renderCommunityStats()}
      </main>
    </div>
  );
};

export default AboutPage;
