import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, BookOpen, Sparkles, Flower2 } from 'lucide-react';
import Navigation from '../components/Navigation';
import { homeHero } from '../content/pages';
import { getPage } from '../services/pages';
import { sanitizeHtml } from '../utils/sanitize';
import SupabaseIntegrationTest from '../test-integration';

const HomePage: React.FC = () => {
  const [page, setPage] = useState<{slug: string; title: string; content_html: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    // Guard against double execution in React Strict Mode
    if (loadedRef.current) return;
    loadedRef.current = true;

    async function loadPageContent() {
      try {
        // Fetch page from DB
        const pageData = await getPage('home');
        setPage(pageData);
      } catch (error) {
        console.error('Error loading page content:', error);
        // On error, page remains null and fallback will be used
      } finally {
        setIsLoading(false);
      }
    }

    loadPageContent();
  }, []);

  return (
    <div className="font-sans bg-gerbera-hero">
      {/* Shared Navigation */}
      <Navigation />

      {/* Main Content Area */}
      <main>
        {/* Hero Section - Original visual style */}
        <section id="home" className="relative min-h-screen flex items-center justify-center">
        {/* Content matching original design */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-20">
          {/* Decorative Hero Elements
              The "WELCOME" text and floating flowers above the card are purely decorative brand visuals (aria-hidden).
              The semantic h1 heading lives inside the glass card below (from DB content or fallback). */}
          
          {/* BIG decorative "WELCOME" with centered flower divider line */}
          <div aria-hidden="true" className="mb-8 sm:mb-10 md:mb-12" data-testid="hero-decor">
            <div className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white drop-shadow-2xl tracking-tight">
              WELCOME
            </div>
            <div className="mt-2 sm:mt-3 md:mt-4 flex items-center justify-center gap-2 sm:gap-3 opacity-80">
              <span className="h-px w-12 sm:w-16 md:w-20 lg:w-24 bg-white/50" />
              <Flower2 className="w-4 h-4 sm:w-5 sm:h-5 text-pink-200/80" />
              <span className="h-px w-12 sm:w-16 md:w-20 lg:w-24 bg-white/50" />
            </div>
          </div>
          
          {/* Main Content Box - Original glass style */}
          <div className="glass rounded-2xl sm:rounded-3xl bg-white/20 backdrop-blur-md ring-1 ring-white/20 shadow-xl p-5 sm:p-6 md:p-8 lg:p-10 xl:p-12 max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto" data-testid="hero-card">
            {isLoading ? (
              // Loading state
              <div className="text-white text-center">
                <div className="animate-pulse space-y-3">
                <div className="h-8 bg-white/30 rounded-lg w-3/4 mx-auto"></div>
                <div className="h-4 bg-white/20 rounded w-full"></div>
                <div className="h-4 bg-white/20 rounded w-5/6 mx-auto"></div>
              </div>
              </div>
            ) : page?.content_html ? (
              // Render DB content with prose styling
              // Note: DB content is expected to have its own h1, so we don't add another heading
              <div 
                className="prose prose-base sm:prose-lg prose-invert max-w-none
                  prose-headings:text-white prose-headings:drop-shadow-2xl
                  prose-h1:text-2xl prose-h1:sm:text-3xl prose-h1:md:text-4xl prose-h1:lg:text-5xl prose-h1:xl:text-6xl prose-h1:font-extrabold prose-h1:mb-4 prose-h1:sm:mb-6 prose-h1:tracking-tight
                  prose-p:text-white/90 prose-p:leading-relaxed prose-p:text-sm prose-p:sm:text-base prose-p:md:text-lg
                  prose-a:text-pink-300 prose-a:underline prose-a:decoration-pink-400/50 hover:prose-a:text-pink-200
                  prose-strong:text-white prose-strong:font-bold
                  prose-em:text-white/95"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content_html) }} 
              />
            ) : (
              // Fallback: render static JSX when no DB content available
              <>
                <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight drop-shadow-lg">
                  Your Sacred Space for Digital Journaling
                </h1>

                <div className="hero-content text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-white/90 space-y-3 sm:space-y-4 md:space-y-5">
                  {homeHero.paragraphs.map((paragraph, index) => (
                    <p key={index} dangerouslySetInnerHTML={{ __html: sanitizeHtml(paragraph) }} />
                  ))}
                </div>

                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20 text-xs sm:text-sm text-white/80 text-center italic">
                  <p>— {homeHero.signature.name}, {homeHero.signature.title}</p>
                </div>

                <div className="mt-8 sm:mt-10 md:mt-12">
                  <Link 
                    to={homeHero.cta.href}
                    className="inline-block bg-gradient-to-r from-pink-600 via-pink-600 to-pink-700 hover:from-pink-700 hover:via-rose-700 hover:to-pink-800 text-white px-6 py-2.5 sm:px-8 sm:py-3 md:px-10 md:py-4 text-base sm:text-lg md:text-xl rounded-full font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    {homeHero.cta.label}
                  </Link>
                  <p className="text-white/80 mt-3 sm:mt-4 text-sm sm:text-base md:text-lg">Join thousands of women in this unique space</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Dev-only Supabase Integration Test */}
      {import.meta.env.DEV && (
        <section className="py-10 px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <SupabaseIntegrationTest />
          </div>
        </section>
      )}

      {/* Quick Links Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-sistah-purple mb-6">Explore Sistahology</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">Discover all the ways you can connect, grow, and flourish in our community</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Quick Link 1 */}
            <Link 
              to="/news" 
              className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 block h-full focus:outline-none focus:ring-4 focus:ring-pink-300/50"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 floating-flower group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-sistah-purple mb-4 text-center leading-tight">News & Events</h3>
              <p className="text-gray-700 leading-relaxed text-center">
                Stay updated with community celebrations, book launches, and special events happening in our sisterhood.
              </p>
            </Link>
            
            {/* Quick Link 2 */}
            <Link 
              to="/blog" 
              className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 block h-full focus:outline-none focus:ring-4 focus:ring-pink-300/50"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 floating-flower group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-sistah-purple mb-4 text-center leading-tight">Weekly Blog</h3>
              <p className="text-gray-700 leading-relaxed text-center">
                Read inspiring stories, journaling tips, and insights from our community of women writers and creators.
              </p>
            </Link>
            
            {/* Quick Link 3 */}
            <Link 
              to="/register" 
              className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 block h-full focus:outline-none focus:ring-4 focus:ring-pink-300/50"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 floating-flower group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-sistah-purple mb-4 text-center leading-tight">Start Journaling</h3>
              <p className="text-gray-700 leading-relaxed text-center">
                Begin your digital journaling journey today in our secure, private, and beautifully designed platform.
              </p>
            </Link>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
};

export default HomePage;