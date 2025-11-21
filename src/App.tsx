import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import page components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import SearchPage from './pages/SearchPage';
import NewEntryPage from './pages/NewEntryPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import NewsPage from './pages/NewsPage';
import ProfilePage from './pages/ProfilePage';
import JournalsPage from './pages/JournalsPage';
import EditEntryPage from './pages/EditEntryPage';
import TrashBinPage from './pages/TrashBinPage';
import AllEntriesPage from './pages/AllEntriesPage';

// Import protected route component
import ProtectedRoute from './components/ProtectedRoute';
import AuthRedirect from './components/AuthRedirect';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminPagesPage from './pages/admin/AdminPagesPage';
import AdminBlogPage from './pages/admin/AdminBlogPage';
import AdminSectionsPage from './pages/admin/AdminSectionsPage';
import AdminTokensPage from './pages/admin/AdminTokensPage';
import ContactSubmissionsPage from './pages/admin/ContactSubmissionsPage';

function App() {
  // Auth initialization now handled by singleton in authStore.ts
  // No need for App-level loading state since auth is initialized on module import

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={
            <AuthRedirect>
              <LoginPage />
            </AuthRedirect>
          } />
          <Route path="/register" element={
            <AuthRedirect>
              <RegisterPage />
            </AuthRedirect>
          } />
          <Route path="/forgot-password" element={
            <AuthRedirect>
              <ForgotPasswordPage />
            </AuthRedirect>
          } />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/news" element={<NewsPage />} />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/search" 
            element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/new-entry" 
            element={
              <ProtectedRoute>
                <NewEntryPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journals"
            element={
              <ProtectedRoute>
                <JournalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/entries/:id/edit"
            element={
              <ProtectedRoute>
                <EditEntryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trash"
            element={
              <ProtectedRoute>
                <TrashBinPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/entries"
            element={
              <ProtectedRoute>
                <AllEntriesPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/pages"
            element={
              <AdminRoute>
                <AdminPagesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/blog"
            element={
              <AdminRoute>
                <AdminBlogPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/sections"
            element={
              <AdminRoute>
                <AdminSectionsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tokens"
            element={
              <AdminRoute>
                <AdminTokensPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/contact-submissions"
            element={
              <AdminRoute>
                <ContactSubmissionsPage />
              </AdminRoute>
            }
          />

          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;