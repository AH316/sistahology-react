// User types
export interface User {
  id: string;
  name: string;
  email: string;
  journalId: string;
  createdAt: string;
  theme?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Journal types
export interface Journal {
  id: string;
  userId: string;
  journalName: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Entry {
  id: string;
  journalId: string;
  content: string;
  entryDate: string; // YYYY-MM-DD format
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
}

export interface JournalState {
  journals: Journal[];
  currentJournal: Journal | null;
  entries: Entry[];
  isLoading: boolean;
  error: string | null;
}

// Dashboard types
export interface DashboardStats {
  totalEntries: number;
  archivedEntries: number;
  writingStreak: number;
  lastEntryDate: string | null;
  recentEntries: Entry[];
  currentJournal: Journal | null;
}

// Search types
export interface SearchFilters {
  query: string;
  journalId?: string;
  startDate?: string;
  endDate?: string;
  includeArchived: boolean;
  sortBy: 'date-desc' | 'date-asc' | 'relevance' | 'length-desc' | 'length-asc';
}

export interface SearchResult {
  entries: Entry[];
  totalCount: number;
  query: string;
}

// Calendar types
export interface CalendarEntry {
  date: string;
  entries: Entry[];
  hasEntry: boolean;
}

export interface CalendarStats {
  monthEntries: number;
  currentStreak: number;
  monthGoal: number;
  monthProgress: number;
}

// UI types
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form validation types
export interface ValidationRule<T = any> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => boolean;
  message?: string;
}

export interface FormErrors {
  [key: string]: string;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  hover?: boolean;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Route types
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  protected?: boolean;
  title?: string;
}