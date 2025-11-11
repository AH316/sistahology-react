// Global toast de-duplication system to prevent spam across all components
// This addresses the issue where rapid navigation between pages causes multiple error toasts

class ToastGuard {
  private shownToasts = new Set<string>();
  private cooldownTimers = new Map<string, number>();

  // Check if toast should be shown (not shown recently)
  canShow(toastKey: string, cooldownMs = 5000): boolean {
    const now = Date.now();
    
    // Clear expired cooldowns
    this.cooldownTimers.forEach((expiry, key) => {
      if (now > expiry) {
        this.cooldownTimers.delete(key);
        this.shownToasts.delete(key);
      }
    });

    // Check if toast is on cooldown
    if (this.shownToasts.has(toastKey)) {
      console.log('[TOAST_GUARD] Blocking duplicate toast:', toastKey);
      return false;
    }

    // Mark as shown and set cooldown
    this.shownToasts.add(toastKey);
    this.cooldownTimers.set(toastKey, now + cooldownMs);
    console.log('[TOAST_GUARD] Allowing toast:', toastKey, 'cooldown until:', new Date(now + cooldownMs).toISOString());
    
    return true;
  }

  // Clear a specific toast (when user takes corrective action)
  clear(toastKey: string): void {
    this.shownToasts.delete(toastKey);
    this.cooldownTimers.delete(toastKey);
  }

  // Clear all toasts (full reset)
  clearAll(): void {
    this.shownToasts.clear();
    this.cooldownTimers.clear();
  }
}

// Global instance
export const toastGuard = new ToastGuard();

// Predefined toast keys for common errors
export const TOAST_KEYS = {
  JOURNALS_LOAD_FAILED: 'journals_load_failed',
  ENTRIES_LOAD_FAILED: 'entries_load_failed',
  AUTH_FAILED: 'auth_failed',
} as const;