// Custom error class for session expiry
export class SessionExpiredError extends Error {
  constructor(message = 'SESSION_EXPIRED') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

// Check if error is a session expiry error
export function isSessionExpired(error: unknown): boolean {
  return error instanceof SessionExpiredError ||
         (error instanceof Error && error.message === 'SESSION_EXPIRED');
}

// Require valid session before proceeding
export async function requireSession(): Promise<void> {
  const { supabase } = await import('./supabase');
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    throw new SessionExpiredError('SESSION_EXPIRED');
  }
}
