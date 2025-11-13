import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Calendar } from 'lucide-react';
import Navigation from '../components/Navigation';
import { listPosts, type Post } from '../services/posts';
import { usePageTitle } from '../hooks/usePageTitle';

const BlogPage: React.FC = () => {
  usePageTitle('Blog');
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    listPosts().then(setPosts);
  }, []);

  return (
    <div className="font-sans bg-gerbera-hero min-h-screen">
      {/* Shared Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-2xl">Weekly Blog</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              Inspiration, insights, and stories from our vibrant community of women
            </p>
          </div>

          {/* Featured Quote */}
          <div className="glass rounded-3xl p-8 mb-12 text-center">
            <div className="mb-6">
              <Heart className="w-12 h-12 text-pink-400 mx-auto mb-4 floating-flower" />
            </div>
            <blockquote className="text-2xl md:text-3xl font-light text-white mb-6 italic leading-relaxed">
              "The journey of a thousand miles begins with a single step, and your journey begins with a single word."
            </blockquote>
            <cite className="text-white/80 text-lg">— Andrea Brooks, Founder</cite>
          </div>

          {/* Blog Posts Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {posts.map((post) => (
              <article key={post.id} className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className="w-5 h-5 text-pink-500" />
                  <time dateTime={post.datePublished} className="text-pink-600 font-medium">
                    {post.dateDisplay || post.datePublished}
                  </time>
                </div>
                <h2 className="text-2xl font-bold text-sistah-purple mb-4">{post.title}</h2>
                <p className="text-pink-600 leading-relaxed mb-6">
                  {post.excerpt}
                </p>
                <Link to={`/blog/${post.slug}`} className="inline-block bg-gradient-to-r from-pink-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all">
                  Read More
                </Link>
              </article>
            ))}
          </div>

          {/* Newsletter Signup */}
          <div className="glass rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Stay Inspired</h3>
            <p className="text-white/90 mb-6">Get weekly inspiration and journaling tips delivered to your inbox</p>
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

export default BlogPage;