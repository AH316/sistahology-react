import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flower2, User, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '../stores/authStore';

const Navigation: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: force reload if logout fails
      window.location.href = '/';
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Define link arrays
  const publicLinks = [
    { to: '/blog', label: 'Weekly Blog' },
    { to: '/news', label: 'News & Events' },
    { to: '/contact', label: 'Contact' },
    { to: '/about', label: 'About' }
  ];

  const privateLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/calendar', label: 'Calendar' },
    { to: '/search', label: 'Search' }
  ];

  const isExploreActive = () => {
    return publicLinks.some(link => isActive(link.to));
  };

  // Handle Explore dropdown
  const toggleExplore = () => {
    setExploreOpen(!exploreOpen);
  };

  const handleExploreKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExplore();
    } else if (e.key === 'Escape') {
      setExploreOpen(false);
    }
  };

  // Handle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setExploreOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExploreOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <header className="glass sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg floating-flower">
              <Flower2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white drop-shadow-lg">sistahology.com</div>
              <p className="text-sm text-white/90 drop-shadow italic">A Unique Place for Women</p>
            </div>
          </Link>
          
          {/* Desktop Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link 
              to="/" 
              className={`text-white hover:text-pink-200 transition-colors duration-200 font-medium drop-shadow-lg ${isActive('/') ? 'text-pink-200' : ''}`}
            >
              Home
            </Link>
            
            {/* Public links: Explore dropdown when authenticated, inline when not */}
            {isAuthenticated ? (
              /* Explore Dropdown for authenticated users */
              <div className="relative" ref={exploreRef}>
                <button
                  onClick={toggleExplore}
                  onKeyDown={handleExploreKeyDown}
                  role="button"
                  aria-haspopup="menu"
                  aria-expanded={exploreOpen}
                  aria-controls="explore-menu"
                  className={`flex items-center space-x-1 text-white hover:text-pink-200 transition-colors duration-200 font-medium drop-shadow-lg ${isExploreActive() ? 'text-pink-200' : ''}`}
                >
                  <span>Explore</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${exploreOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {exploreOpen && (
                  <div 
                    id="explore-menu"
                    className="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 py-2 z-50"
                    role="menu"
                  >
                    {publicLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`block px-4 py-2 text-gray-800 hover:bg-pink-50 hover:text-pink-600 transition-colors duration-200 font-medium ${isActive(link.to) ? 'bg-pink-50 text-pink-600' : ''}`}
                        role="menuitem"
                        onClick={() => setExploreOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Inline public links for non-authenticated users */
              publicLinks.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className={`text-white hover:text-pink-200 transition-colors duration-200 font-medium drop-shadow-lg ${isActive(link.to) ? 'text-pink-200' : ''}`}
                >
                  {link.label}
                </Link>
              ))
            )}
            
            {/* Private app links (inline when authenticated) */}
            {isAuthenticated && (
              <div className="flex items-center space-x-6 lg:space-x-8 border-l border-white/20 pl-6 ml-2">
                {privateLinks.map((link) => (
                  <Link 
                    key={link.to}
                    to={link.to} 
                    className={`text-white hover:text-pink-200 transition-colors duration-200 font-medium drop-shadow-lg ${isActive(link.to) ? 'text-pink-200' : ''}`}
                  >
                    {link.label}
                  </Link>
                ))}
                
                {/* New Entry CTA button */}
                <Link 
                  to="/new-entry"
                  className={`bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 ${isActive('/new-entry') ? 'from-pink-600 to-pink-700' : ''}`}
                >
                  New Entry
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-white hover:text-pink-200 transition-colors duration-200"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              // Authenticated user menu
              <div className="flex items-center space-x-3">
                <Link
                  to="/profile"
                  className={`flex items-center space-x-2 text-white hover:text-pink-200 hover:bg-white/10 px-3 py-2 rounded-lg font-medium transition-all duration-200 drop-shadow-lg ${isActive('/profile') ? 'bg-white/10 text-pink-200' : ''}`}
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user?.name || 'Profile'}</span>
                  <span className="sm:hidden">Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-white hover:text-pink-200 hover:bg-white/10 px-3 py-2 rounded-lg font-medium transition-all duration-200 drop-shadow-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              // Public user menu
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className={`text-white hover:text-pink-200 hover:bg-white/10 px-4 py-2 rounded-lg font-medium transition-all duration-200 drop-shadow-lg ${isActive('/login') ? 'bg-white/10 text-pink-200' : ''}`}
                >
                  Log In
                </Link>
                <Link 
                  to="/register" 
                  className={`bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive('/register') ? 'from-pink-600 to-pink-700' : ''}`}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden glass border-t border-white/20"
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className={`text-white hover:text-pink-200 transition-colors duration-200 font-medium drop-shadow-lg ${isActive('/') ? 'text-pink-200' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              
              {/* Public links in mobile */}
              {publicLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-white hover:text-pink-200 transition-colors duration-200 font-medium drop-shadow-lg ${isActive(link.to) ? 'text-pink-200' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Private links in mobile when authenticated */}
              {isAuthenticated && (
                <>
                  <div className="border-t border-white/20 pt-4">
                    {privateLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`block py-2 text-white hover:text-pink-200 transition-colors duration-200 font-medium drop-shadow-lg ${isActive(link.to) ? 'text-pink-200' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Link
                      to="/profile"
                      className={`block py-2 text-white hover:text-pink-200 transition-colors duration-200 font-medium drop-shadow-lg ${isActive('/profile') ? 'text-pink-200' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/new-entry"
                      className={`inline-block mt-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive('/new-entry') ? 'from-pink-600 to-pink-700' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      New Entry
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default React.memo(Navigation);