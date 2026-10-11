import type { Product } from '@/types';

/**
 * Client-side only "recently viewed" tracking, stored in localStorage (not a cookie).
 * Used to power homepage recommendations for anonymous/new visitors without requiring
 * cookie-consent, since no identifying data is sent to a server or third party.
 */

const STORAGE_KEY = 'bazario_recently_viewed_v1';
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_ENTRIES = 50;

export interface RecentlyViewedEntry {
  productId: number;
  categories: string[];
  viewedAt: number; // epoch ms
}

function readRaw(): RecentlyViewedEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(entries: RecentlyViewedEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage unavailable (e.g. private mode) — fail silently, recommendations just won't persist
  }
}

/** Returns non-expired entries, most recently viewed first. */
export function getRecentlyViewed(): RecentlyViewedEntry[] {
  const now = Date.now();
  const fresh = readRaw().filter((e) => now - e.viewedAt < EXPIRY_MS);
  if (fresh.length !== readRaw().length) writeRaw(fresh);
  return fresh.sort((a, b) => b.viewedAt - a.viewedAt);
}

/** Records a product view, moving it to the front and pruning expired/overflow entries. */
export function recordProductView(product: Product) {
  const now = Date.now();
  const existing = readRaw().filter((e) => now - e.viewedAt < EXPIRY_MS && e.productId !== product.id);
  const updated: RecentlyViewedEntry[] = [
    { productId: product.id, categories: product.categories ?? [], viewedAt: now },
    ...existing,
  ].slice(0, MAX_ENTRIES);
  writeRaw(updated);
}

/** Most frequent recently-viewed category slugs, most relevant first. */
export function getTopRecentCategories(limit = 2): string[] {
  const counts = new Map<string, number>();
  for (const entry of getRecentlyViewed()) {
    for (const slug of entry.categories) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug]) => slug);
}

export function getRecentlyViewedProductIds(): number[] {
  return getRecentlyViewed().map((e) => e.productId);
}
