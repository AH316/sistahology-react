export async function initAuth() {
  if (import.meta.env.DEV) {
    const { initAuthDev } = await import('./authListener'); // existing dev singleton runtime
    return initAuthDev();
  } else {
    const { initAuthProd } = await import('./authRuntime.prod');
    return initAuthProd();
  }
}