import { supabase } from '../lib/supabase';
import type {
  ContactSubmission,
  ContactFormData,
  ContactSubmissionStatus,
  ApiResponse,
} from '../types';

/**
 * Submit a new contact form
 * Accessible by anonymous and authenticated users
 */
export async function submitContactForm(
  formData: ContactFormData
): Promise<ApiResponse<{ id: string }>> {
  try {
    // Validate form data
    if (!formData.name || formData.name.trim().length === 0) {
      return { success: false, error: 'Name is required' };
    }

    if (!formData.email || !isValidEmail(formData.email)) {
      return { success: false, error: 'Valid email is required' };
    }

    if (!formData.subject || formData.subject.trim().length === 0) {
      return { success: false, error: 'Subject is required' };
    }

    if (!formData.message || formData.message.trim().length < 5) {
      return { success: false, error: 'Message must be at least 5 characters' };
    }

    if (formData.message.length > 5000) {
      return { success: false, error: 'Message must be less than 5000 characters' };
    }

    // Insert submission into database
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error submitting contact form:', error);
      return {
        success: false,
        error: 'Failed to submit contact form. Please try again.',
      };
    }

    return {
      success: true,
      data: { id: data.id },
      message: 'Message sent successfully!',
    };
  } catch (error) {
    console.error('Unexpected error submitting contact form:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get all contact submissions (admin only)
 * Sorted by submission date (newest first)
 */
export async function getContactSubmissions(
  filters?: {
    status?: ContactSubmissionStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<ContactSubmission[]>> {
  try {
    let query = supabase
      .from('contact_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    // Apply status filter
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    // Apply date range filter
    if (filters?.startDate) {
      query = query.gte('submitted_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('submitted_at', filters.endDate);
    }

    // Apply search filter (searches name, email, subject, message)
    if (filters?.search && filters.search.trim().length > 0) {
      const searchTerm = `%${filters.search.trim()}%`;
      query = query.or(
        `name.ilike.${searchTerm},email.ilike.${searchTerm},subject.ilike.${searchTerm},message.ilike.${searchTerm}`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching contact submissions:', error);
      return {
        success: false,
        error: 'Failed to load contact submissions',
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Unexpected error fetching contact submissions:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get a single contact submission by ID (admin only)
 */
export async function getContactSubmission(
  id: string
): Promise<ApiResponse<ContactSubmission>> {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching contact submission:', error);
      return {
        success: false,
        error: 'Failed to load contact submission',
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Contact submission not found',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Unexpected error fetching contact submission:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Update submission status (admin only)
 */
export async function updateSubmissionStatus(
  id: string,
  status: ContactSubmissionStatus
): Promise<ApiResponse<ContactSubmission>> {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating submission status:', error);
      return {
        success: false,
        error: 'Failed to update submission status',
      };
    }

    return {
      success: true,
      data,
      message: `Submission marked as ${status}`,
    };
  } catch (error) {
    console.error('Unexpected error updating submission status:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Bulk update submission status (admin only)
 */
export async function bulkUpdateSubmissionStatus(
  ids: string[],
  status: ContactSubmissionStatus
): Promise<ApiResponse<{ count: number }>> {
  try {
    if (!ids || ids.length === 0) {
      return {
        success: false,
        error: 'No submissions selected',
      };
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .update({ status })
      .in('id', ids)
      .select('id');

    if (error) {
      console.error('Error bulk updating submission status:', error);
      return {
        success: false,
        error: 'Failed to update submissions',
      };
    }

    return {
      success: true,
      data: { count: data?.length || 0 },
      message: `${data?.length || 0} submissions marked as ${status}`,
    };
  } catch (error) {
    console.error('Unexpected error bulk updating submissions:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get submission statistics (admin only)
 */
export async function getSubmissionStats(): Promise<
  ApiResponse<{
    total: number;
    pending: number;
    read: number;
    replied: number;
    archived: number;
  }>
> {
  try {
    // Get counts for each status
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('status');

    if (error) {
      console.error('Error fetching submission stats:', error);
      return {
        success: false,
        error: 'Failed to load statistics',
      };
    }

    const stats = {
      total: data?.length || 0,
      pending: data?.filter((s) => s.status === 'pending').length || 0,
      read: data?.filter((s) => s.status === 'read').length || 0,
      replied: data?.filter((s) => s.status === 'replied').length || 0,
      archived: data?.filter((s) => s.status === 'archived').length || 0,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('Unexpected error fetching submission stats:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Email validation helper
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Export submissions to CSV format (for admin download)
 */
export function exportSubmissionsToCSV(submissions: ContactSubmission[]): string {
  if (!submissions || submissions.length === 0) {
    return '';
  }

  // CSV header
  const headers = ['Date', 'Name', 'Email', 'Subject', 'Message', 'Status'];
  const csvRows = [headers.join(',')];

  // CSV data rows
  submissions.forEach((submission) => {
    const row = [
      new Date(submission.submitted_at).toLocaleDateString(),
      escapeCSV(submission.name),
      escapeCSV(submission.email),
      escapeCSV(submission.subject),
      escapeCSV(submission.message),
      submission.status,
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Helper to escape CSV values
 */
function escapeCSV(value: string): string {
  if (!value) return '""';

  // If value contains comma, newline, or quotes, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
