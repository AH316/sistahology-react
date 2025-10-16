import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, BookOpen, Sparkles } from 'lucide-react';
import Navigation from '../components/Navigation';

const NewsPage: React.FC = () => {
  return (
    <div className="font-sans bg-gerbera-hero min-h-screen">
      {/* Shared Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-2xl">News & Events</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Stay updated with the latest from our Sistahology community
            </p>
          </div>

          {/* News Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Anniversary Milestone */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 floating-flower">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-sistah-purple mb-4 text-center">Anniversary Celebration</h3>
              <div className="text-center">
                <p className="text-lg font-semibold text-pink-600 mb-2">September 24th</p>
                <p className="text-gray-700 leading-relaxed">
                  Celebrating our community since 2009! Join us as we honor over a decade of supporting women's voices and journeys.
                </p>
              </div>
            </div>
            
            {/* Book Launch */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 floating-flower">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-sistah-purple mb-4 text-center">New Book Release</h3>
              <div className="text-center">
                <p className="text-lg font-semibold text-pink-600 mb-2">"Sistership: A Keep Sake Journal"</p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  By Andrea M. Guidry (Brooks) - A beautiful journal designed to share between friends and celebrate sisterhood.
                </p>
                <button className="bg-gradient-to-r from-pink-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all">
                  Available Online
                </button>
              </div>
            </div>
            
            {/* Product Launch */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 floating-flower">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-sistah-purple mb-4 text-center">Wellness Products</h3>
              <div className="text-center">
                <p className="text-lg font-semibold text-pink-600 mb-2">Ms. Damn Rona Collection</p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Luxury wellness candles & incense designed to bring joy and comfort to your journaling space.
                </p>
                <p className="text-sm text-pink-600">Instagram: @sistahrona.est2020</p>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-pink-200/50 mb-12">
            <h2 className="text-3xl font-bold text-sistah-purple mb-8 text-center">Upcoming Events</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border-l-4 border-pink-500 pl-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Calendar className="w-5 h-5 text-pink-500" />
                  <span className="text-pink-600 font-semibold">February 14, 2024</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Self-Love Writing Workshop</h3>
                <p className="text-gray-700">Join us for a special Valentine's Day workshop focused on writing love letters to yourself and practicing self-compassion through journaling.</p>
              </div>

              <div className="border-l-4 border-pink-500 pl-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Calendar className="w-5 h-5 text-pink-500" />
                  <span className="text-pink-600 font-semibold">March 8, 2024</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">International Women's Day Celebration</h3>
                <p className="text-gray-700">Celebrating women's stories and achievements. Share your journey and connect with inspiring women from our community.</p>
              </div>

              <div className="border-l-4 border-pink-500 pl-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Calendar className="w-5 h-5 text-pink-500" />
                  <span className="text-pink-600 font-semibold">April 15, 2024</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Spring Renewal Challenge</h3>
                <p className="text-gray-700">A 30-day journaling challenge to refresh your mindset, set new goals, and embrace the energy of spring.</p>
              </div>

              <div className="border-l-4 border-pink-500 pl-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Calendar className="w-5 h-5 text-pink-500" />
                  <span className="text-pink-600 font-semibold">May 12, 2024</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Mother's Day Reflection</h3>
                <p className="text-gray-700">Honor the mothers, mentors, and maternal figures in your life through guided journaling and gratitude practices.</p>
              </div>
            </div>
          </div>

          {/* Community Highlights */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-pink-200/50">
            <h2 className="text-3xl font-bold text-sistah-purple mb-8 text-center">Community Highlights</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-sistah-purple mb-2">15,000+</div>
                <p className="text-gray-700 font-medium">Active Members</p>
                <p className="text-gray-800 text-sm mt-1">Women journaling together</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-sistah-purple mb-2">2.5M+</div>
                <p className="text-gray-700 font-medium">Journal Entries</p>
                <p className="text-gray-800 text-sm mt-1">Stories shared and preserved</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-sistah-purple mb-2">500+</div>
                <p className="text-gray-700 font-medium">Writing Streaks</p>
                <p className="text-gray-800 text-sm mt-1">Days of consecutive journaling</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link 
                to="/register"
                className="bg-gradient-to-r from-pink-500 via-pink-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-full font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 inline-block"
              >
                Join Our Community
              </Link>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="mt-12 glass rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Stay Updated</h3>
            <p className="text-white/90 mb-6">Get the latest news and event announcements delivered to your inbox</p>
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