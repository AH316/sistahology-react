import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import Navigation from '../components/Navigation';
import { getPostBySlug, type Post } from '../services/posts';
import { sanitizeHtml } from '../utils/sanitize';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      getPostBySlug(slug).then((foundPost) => {
        setPost(foundPost);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="font-sans bg-gerbera-hero min-h-screen">
        <Navigation />
        <main className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass rounded-3xl p-12 shadow-2xl">
              <p className="text-white text-xl">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="font-sans bg-gerbera-hero min-h-screen">
        <Navigation />
        <main className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <Link to="/blog" className="inline-flex items-center space-x-2 text-white/90 hover:text-white mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>← Back to Weekly Blog</span>
            </Link>
            <div className="glass rounded-3xl p-12 shadow-2xl text-center">
              <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
              <p className="text-white/80 text-xl">The blog post you're looking for doesn't exist.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans bg-gerbera-hero min-h-screen">
      <Navigation />
      
      <main className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back to Blog */}
          <Link to="/blog" className="inline-flex items-center space-x-2 text-white/90 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Weekly Blog</span>
          </Link>

          {/* Blog Post */}
          <article className="glass rounded-3xl p-12 shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className="w-5 h-5 text-pink-400" />
              <time dateTime={post.datePublished} className="text-white/80 font-medium">
                {post.dateDisplay || new Date(post.datePublished).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </time>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
              {post.title}
            </h1>
            
            {post.contentHTML && (
              <div 
                className="prose prose-lg prose-invert max-w-none text-white/90"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.contentHTML) }}
              />
            )}
            
            {!post.contentHTML && post.contentMarkdown && (
              <div className="prose prose-lg prose-invert max-w-none">
                <p className="text-white/90 text-xl leading-relaxed">
                  {/* TODO: Add react-markdown when needed */}
                  {post.contentMarkdown}
                </p>
              </div>
            )}
          </article>
        </div>
      </main>
    </div>
  );
};

export default BlogPostPage;