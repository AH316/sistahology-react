// HMR/StrictMode-safe singleton helpers
export function defineSingleton<T>(key: string, factory: () => T): T {
  const g = globalThis as Record<string, unknown>;
  if (!g[key]) g[key] = factory();
  return g[key] as T;
}