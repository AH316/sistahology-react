import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, FileText, FileEdit } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalUsers: number;
  totalJournals: number;
  totalEntries: number;
  totalPages: number;
}

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalJournals: 0,
    totalEntries: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all stats in parallel
      const [usersResult, journalsResult, entriesResult, pagesResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('journal').select('id', { count: 'exact', head: true }),
        supabase.from('entry').select('id', { count: 'exact', head: true }),
        supabase.from('pages').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalJournals: journalsResult.count || 0,
        totalEntries: entriesResult.count || 0,
        totalPages: pagesResult.count || 0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-pink-500 to-pink-600' },
    { label: 'Total Journals', value: stats.totalJournals, icon: BookOpen, color: 'from-purple-500 to-purple-600' },
    { label: 'Total Entries', value: stats.totalEntries, icon: FileEdit, color: 'from-rose-500 to-rose-600' },
    { label: 'CMS Pages', value: stats.totalPages, icon: FileText, color: 'from-pink-400 to-pink-500' },
  ];

  const quickActions = [
    { to: '/admin/pages', label: 'Manage Pages', description: 'Edit CMS content', icon: FileText },
    { to: '/admin/blog', label: 'Manage Blog', description: 'Create and edit blog posts', icon: BookOpen },
  ];

  return (
    <AdminLayout>
      <main>
        <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-8">Admin Dashboard</h1>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="glass rounded-2xl p-6 border-2 border-red-400/40 bg-red-50/10">
            <p className="text-white text-center">{error}</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat) => (
                <div key={stat.label} className="glass rounded-2xl p-6 border-2 border-white/40 backdrop-blur-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-white drop-shadow-lg mb-2">
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="text-white/90 drop-shadow">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-2xl font-bold text-white drop-shadow-lg mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickActions.map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="glass rounded-2xl p-6 border-2 border-white/40 backdrop-blur-lg hover:bg-white/20 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <action.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white drop-shadow-lg">{action.label}</h3>
                        <p className="text-white/80 drop-shadow">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
