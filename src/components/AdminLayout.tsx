import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, ArrowLeft, Flower2, Shield, Mail } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const contentItems = [
    { to: '/admin/pages', label: 'Homepage', icon: FileText },
    { to: '/admin/sections', label: 'Site Sections', icon: FileText },
    { to: '/admin/blog', label: 'Blog Posts', icon: BookOpen },
  ];

  const adminItems = [
    { to: '/admin/tokens', label: 'Admin Tokens', icon: Shield },
    { to: '/admin/contact-submissions', label: 'Contact Submissions', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gerbera-hero">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen glass border-r border-white/20 p-6">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-white drop-shadow-lg">Admin Panel</div>
              <p className="text-xs text-white/80 drop-shadow">sistahology.com</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.to)
                    ? 'bg-white/30 text-white shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Content Section */}
          <div className="mt-6">
            <div className="px-4 mb-3">
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Content</h3>
            </div>
            <nav className="space-y-2">
              {contentItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive(item.to)
                      ? 'bg-white/30 text-white shadow-md'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Admin Section */}
          <div className="mt-6">
            <div className="px-4 mb-3">
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Administration</h3>
            </div>
            <nav className="space-y-2">
              {adminItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive(item.to)
                      ? 'bg-white/30 text-white shadow-md'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Back to App */}
          <div className="mt-8 pt-8 border-t border-white/20">
            <Link
              to="/dashboard"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to App</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
