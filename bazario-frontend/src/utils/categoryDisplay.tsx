/**
 * Resolves a product/category slug to a display (label, icon, color) using the
 * categories fetched from the backend (`categoryApi.getAll()`), so every page
 * (Home, Catalogue, product dialog, stock/admin) shows the same persisted categories.
 */
import type { ReactNode } from 'react';
import CategoryIcon from '@mui/icons-material/Category';
import GridViewIcon from '@mui/icons-material/GridView';
import ElectricBolt from '@mui/icons-material/ElectricBolt';
import Computer from '@mui/icons-material/Computer';
import PhoneAndroid from '@mui/icons-material/PhoneAndroid';
import Checkroom from '@mui/icons-material/Checkroom';
import Man from '@mui/icons-material/Man';
import ChildCare from '@mui/icons-material/ChildCare';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import Kitchen from '@mui/icons-material/Kitchen';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import Spa from '@mui/icons-material/Spa';
import ShoppingBasket from '@mui/icons-material/ShoppingBasket';
import LibraryBooks from '@mui/icons-material/LibraryBooks';
import SmartToy from '@mui/icons-material/SmartToy';
import DirectionsCar from '@mui/icons-material/DirectionsCar';
import LocalFlorist from '@mui/icons-material/LocalFlorist';
import Pets from '@mui/icons-material/Pets';
import Handyman from '@mui/icons-material/Handyman';
import Luggage from '@mui/icons-material/Luggage';
import WorkOutline from '@mui/icons-material/WorkOutline';
import ElectricalServices from '@mui/icons-material/ElectricalServices';
import Cable from '@mui/icons-material/Cable';
import Power from '@mui/icons-material/Power';
import Dashboard from '@mui/icons-material/Dashboard';
import Lightbulb from '@mui/icons-material/Lightbulb';
import ElectricMeter from '@mui/icons-material/ElectricMeter';
import SettingsInputComponent from '@mui/icons-material/SettingsInputComponent';
import WbSunny from '@mui/icons-material/WbSunny';
import Router from '@mui/icons-material/Router';
import Shield from '@mui/icons-material/Shield';
import { ICON_REGISTRY } from './iconRegistry';
import type { Category } from '@/types';

// Fallback icons for known slugs when the category has no explicit `icon` set in DB.
export const SLUG_ICONS: Record<string, React.ElementType> = {
  'DISJONCTEUR': ElectricalServices,
  'CABLE':       Cable,
  'PRISE':       Power,
  'TABLEAU':     Dashboard,
  'ECLAIRAGE':   Lightbulb,
  'TRANSFO':     ElectricMeter,
  'MOTEUR':      SettingsInputComponent,
  'SOLAIRE':     WbSunny,
  'DOMOTIQUE':   Router,
  'OUTILLAGE':   Handyman,
  'SECURITE':    Shield,
  'AUTRE':       CategoryIcon,
  'electronique':     ElectricBolt,
  'informatique':     Computer,
  'telephonie':       PhoneAndroid,
  'mode-femme':       Checkroom,
  'mode-homme':       Man,
  'mode-enfant':      ChildCare,
  'chaussures':       Checkroom,
  'maison-deco':      HomeOutlined,
  'electromenager':   Kitchen,
  'sport-fitness':    FitnessCenter,
  'beaute-sante':     Spa,
  'alimentation':     ShoppingBasket,
  'livres-culture':   LibraryBooks,
  'jouets-jeux':      SmartToy,
  'auto-moto':        DirectionsCar,
  'jardin':           LocalFlorist,
  'animalerie':       Pets,
  'bricolage':        Handyman,
  'voyage-bagages':   Luggage,
  'bureau-papeterie': WorkOutline,
};

export const CAT_COLORS = [
  '#E8521A', '#3730A3', '#D97706', '#16A34A', '#DC2626',
  '#7C3AED', '#0369A1', '#BE185D', '#065F46', '#92400E',
  '#1D4ED8', '#B45309', '#15803D', '#6D28D9', '#9D174D',
  '#0F766E', '#C2410C', '#1E40AF', '#166534', '#7E22CE',
];

export interface CategoryDisplay {
  key: string;
  label: string;
  icon: ReactNode;
  color: string;
}

export const ALL_CATEGORY: CategoryDisplay = { key: 'all', label: 'Tous', icon: <GridViewIcon />, color: '#1A237E' };

/** Shown on products that have no category assigned. */
export const NO_CATEGORY: CategoryDisplay = { key: 'none', label: 'Sans catégorie', icon: <CategoryIcon />, color: '#757575' };

/** Builds a display (icon + color) list from the live categories fetched from the API. */
export function buildCategoryDisplays(categories: Category[]): CategoryDisplay[] {
  return categories.map((cat, idx) => {
    const Icon = (cat.icon ? ICON_REGISTRY[cat.icon] : null) ?? SLUG_ICONS[cat.slug] ?? CategoryIcon;
    const color = CAT_COLORS[idx % CAT_COLORS.length];
    return { key: cat.slug, label: cat.label, icon: <Icon />, color };
  });
}

/** Finds the display for a single category slug, falling back to a generic entry if unknown. */
export function findCategoryDisplay(displays: CategoryDisplay[], slug: string | null | undefined): CategoryDisplay {
  if (!slug || slug === 'all') return ALL_CATEGORY;
  return displays.find((c) => c.key === slug) ?? { key: slug, label: slug, icon: <CategoryIcon />, color: '#757575' };
}

/** Resolves a product's category slugs to their displays; returns [NO_CATEGORY] when the product has none. */
export function findCategoryDisplays(displays: CategoryDisplay[], slugs: string[] | null | undefined): CategoryDisplay[] {
  if (!slugs || slugs.length === 0) return [NO_CATEGORY];
  return slugs.map((slug) => displays.find((c) => c.key === slug) ?? { key: slug, label: slug, icon: <CategoryIcon />, color: '#757575' });
}

/** Plain-text summary of a product's categories for tables, e.g. "Électronique, Informatique" or "Sans catégorie". */
export function formatCategoryList(slugs: string[] | null | undefined, displays: CategoryDisplay[] = []): string {
  if (!slugs || slugs.length === 0) return NO_CATEGORY.label;
  return slugs.map((slug) => displays.find((c) => c.key === slug)?.label ?? slug).join(', ');
}
