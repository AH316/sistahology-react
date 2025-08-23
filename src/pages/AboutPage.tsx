import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Users, BookOpen, Sparkles } from 'lucide-react';
import Navigation from '../components/Navigation';

const AboutPage: React.FC = () => {
  return (
    <div className="font-sans bg-gerbera-hero min-h-screen">
      {/* Shared Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">About Sistahology</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              A unique place for women's digital journaling, created by women, for women
            </p>
          </div>

          {/* Founder Section */}
          <div className="glass rounded-3xl p-12 mb-16">
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center shadow-2xl floating-flower">
                <Heart className="w-16 h-16 text-white" fill="currentColor" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-6">Meet Andrea Brooks</h2>
            <p className="text-lg text-white/95 leading-relaxed mb-6">
              Founder & Visionary of Sistahology.com
            </p>
            
            <div className="text-left text-white/90 space-y-4 max-w-3xl mx-auto">
              <p className="leading-relaxed">
                "My journey with journaling began during a difficult period in my life when I needed a safe space to process my thoughts and emotions. 
                I discovered that writing wasn't just therapeutic—it was transformative. It gave me permission to be patient with myself, 
                to slow down and reflect on lessons learned and unlearned."
              </p>
              
              <p className="leading-relaxed">
                "I created Sistahology.com because I believe every woman deserves a space where she can be authentically herself. 
                A place where we can empty our thoughts, speak our truth, and say things we'd dare not say in public. 
                Digital journaling gives us the freedom to simply enjoy the journey."
              </p>
              
              <p className="leading-relaxed italic">
                "My goal is that women are allowed to just <strong>BE</strong>. To create, express, explore, and exercise our right to write, 
                draw, paint, design—to do whatever it takes to be healthy and whole."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6 drop-shadow-2xl">Our Mission & Values</h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Creating a supportive digital sanctuary for women's voices, stories, and growth
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Community */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 text-center hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 floating-flower">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-sistah-purple mb-4">Community</h3>
              <p className="text-pink-600 leading-relaxed">
                Building a supportive sisterhood where women can connect, share experiences, and grow together 
                in a judgment-free environment.
              </p>
            </div>

            {/* Authenticity */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 text-center hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 floating-flower">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-sistah-purple mb-4">Authenticity</h3>
              <p className="text-pink-600 leading-relaxed">
                Encouraging women to embrace their true selves, express their authentic voice, 
                and honor their unique journey without fear or judgment.
              </p>
            </div>

            {/* Growth */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 text-center hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 floating-flower">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-sistah-purple mb-4">Growth</h3>
              <p className="text-pink-600 leading-relaxed">
                Providing tools and inspiration for personal development, self-reflection, 
                and transformation through the powerful practice of journaling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 px-6 bg-white/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-sistah-purple mb-6">Why Sistahology?</h2>
            <p className="text-xl text-pink-600 max-w-3xl mx-auto">
              More than just a journaling platform—it's your personal sanctuary for growth and reflection
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 floating-flower">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-sistah-purple mb-2">Multiple Journals</h3>
              <p className="text-pink-600 text-sm">Create themed journals for different aspects of your life</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 floating-flower">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-sistah-purple mb-2">Private & Secure</h3>
              <p className="text-pink-600 text-sm">Your thoughts are safe in your personal digital sanctuary</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 floating-flower">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-sistah-purple mb-2">Writing Streaks</h3>
              <p className="text-pink-600 text-sm">Track your progress and build healthy journaling habits</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 floating-flower">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-sistah-purple mb-2">Beautiful Design</h3>
              <p className="text-pink-600 text-sm">Enjoy writing in a space designed specifically for women</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-8">Our Growing Community</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold text-white mb-2">15K+</div>
                <p className="text-white/80">Women Writers</p>
              </div>
              
              <div>
                <div className="text-4xl font-bold text-white mb-2">2M+</div>
                <p className="text-white/80">Journal Entries</p>
              </div>
              
              <div>
                <div className="text-4xl font-bold text-white mb-2">15+</div>
                <p className="text-white/80">Years of Sisterhood</p>
              </div>
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
    </div>
  );
};

export default AboutPage;