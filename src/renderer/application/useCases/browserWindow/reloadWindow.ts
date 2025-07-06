/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

export interface ReloadWindowDeps {
  // No dependencies needed for simple reload
}

export function createReloadWindowUseCase(_deps: ReloadWindowDeps) {
  return async function reloadWindowUseCase(): Promise<void> {
    // Clear any cached data that might cause rendering issues
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch (err) {
        console.error('Failed to clear caches:', err);
      }
    }

    // Give a small delay to ensure any pending operations complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Force reload, bypassing cache
    window.location.reload();
  };
}

export type ReloadWindowUseCase = ReturnType<typeof createReloadWindowUseCase>; 