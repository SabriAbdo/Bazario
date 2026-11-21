/**
 * Resolves a product's name/description to the currently active site language.
 * `libelle`/`description` are always the French (default) values; `libelleAr`/`descriptionAr`
 * are optional Arabic translations. Only Arabic has a dedicated translation today — any other
 * language (e.g. English) falls back to French, and Arabic falls back to French whenever the
 * seller didn't provide an Arabic translation.
 */
import { useTranslation } from 'react-i18next';
import type { Product } from '@/types';

export interface LocalizedProductText {
  libelle: string;
  description: string | null;
  /** True when the resolved text is Arabic — callers should render it right-to-left. */
  isRtl: boolean;
}

export function localizeProduct(product: Pick<Product, 'libelle' | 'libelleAr' | 'description' | 'descriptionAr'>, lang: string): LocalizedProductText {
  const isAr = lang === 'ar';
  const libelle = (isAr && product.libelleAr?.trim()) ? product.libelleAr : product.libelle;
  const description = (isAr && product.descriptionAr?.trim()) ? product.descriptionAr : (product.description ?? null);
  return { libelle, description, isRtl: isAr && libelle === product.libelleAr };
}

/** React hook variant of {@link localizeProduct}, reactive to the current i18n language. */
export function useLocalizedProduct(product: Pick<Product, 'libelle' | 'libelleAr' | 'description' | 'descriptionAr'>): LocalizedProductText {
  const { i18n } = useTranslation();
  return localizeProduct(product, i18n.language);
}
