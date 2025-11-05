import React from 'react';
import { BookOpen } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';

const AdminBlogPage: React.FC = () => {
  return (
    <AdminLayout>
      <main>
        <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-8">Manage Blog</h1>

        <div className="glass rounded-2xl p-12 border-2 border-white/40 backdrop-blur-lg text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white drop-shadow-lg mb-4">
            Blog Management Coming Soon
          </h2>
          <p className="text-white/80 drop-shadow max-w-md mx-auto">
            Blog post management will be available in a future update. For now, focus on managing CMS pages.
          </p>
        </div>
      </main>
    </AdminLayout>
  );
};

export default AdminBlogPage;
