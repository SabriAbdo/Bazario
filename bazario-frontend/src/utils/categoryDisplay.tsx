/**
 * Resolves a product/category slug to a display (label, picture, color) using the
 * categories fetched from the backend (`categoryApi.getAll()`), so every page
 * (Home, Catalogue, product dialog, stock/admin) shows the same persisted categories.
 * Categories are shown with their picture only — no icons.
 */
import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import type { Category } from '@/types';

// Empty in dev (Vite proxy) and same-origin prod; set VITE_API_BASE_URL for cross-origin deploys
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export const CAT_COLORS = [
  '#E8521A', '#3730A3', '#D97706', '#16A34A', '#DC2626',
  '#7C3AED', '#0369A1', '#BE185D', '#065F46', '#92400E',
  '#1D4ED8', '#B45309', '#15803D', '#6D28D9', '#9D174D',
  '#0F766E', '#C2410C', '#1E40AF', '#166534', '#7E22CE',
];

export interface CategoryDisplay {
  key: string;
  label: string;
  /** The category's picture, or a generic placeholder when it has none set. */
  icon: ReactNode;
  color: string;
}

export const ALL_CATEGORY: CategoryDisplay = { key: 'all', label: 'Tous', icon: <GridViewIcon />, color: '#1A237E' };

/** Shown on products that have no category assigned. */
export const NO_CATEGORY: CategoryDisplay = { key: 'none', label: 'Sans catégorie', icon: <ImageNotSupportedIcon />, color: '#757575' };

const FALLBACK: ReactNode = <ImageNotSupportedIcon />;

/** Renders a category's picture (fills its container), falling back to a generic placeholder. */
function categoryPicture(cat: Category): ReactNode {
  if (!cat.imageUrl) return FALLBACK;
  return (
    <Box component="img" src={`${API_BASE}${cat.imageUrl}`} alt={cat.label}
      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
  );
}

/** Builds a display (picture + color) list from the live categories fetched from the API. */
export function buildCategoryDisplays(categories: Category[]): CategoryDisplay[] {
  return categories.map((cat, idx) => {
    const color = CAT_COLORS[idx % CAT_COLORS.length];
    return { key: cat.slug, label: cat.label, icon: categoryPicture(cat), color };
  });
}

/** Finds the display for a single category slug, falling back to a generic entry if unknown. */
export function findCategoryDisplay(displays: CategoryDisplay[], slug: string | null | undefined): CategoryDisplay {
  if (!slug || slug === 'all') return ALL_CATEGORY;
  return displays.find((c) => c.key === slug) ?? { key: slug, label: slug, icon: FALLBACK, color: '#757575' };
}

/** Resolves a product's category slugs to their displays; returns [NO_CATEGORY] when the product has none. */
export function findCategoryDisplays(displays: CategoryDisplay[], slugs: string[] | null | undefined): CategoryDisplay[] {
  if (!slugs || slugs.length === 0) return [NO_CATEGORY];
  return slugs.map((slug) => displays.find((c) => c.key === slug) ?? { key: slug, label: slug, icon: FALLBACK, color: '#757575' });
}

/** Plain-text summary of a product's categories for tables, e.g. "Électronique, Informatique" or "Sans catégorie". */
export function formatCategoryList(slugs: string[] | null | undefined, displays: CategoryDisplay[] = []): string {
  if (!slugs || slugs.length === 0) return NO_CATEGORY.label;
  return slugs.map((slug) => displays.find((c) => c.key === slug)?.label ?? slug).join(', ');
}
