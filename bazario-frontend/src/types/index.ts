// ─── Core domain types ───────────────────────────────────────────────────────

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page (0-based)
}

export interface ProductComment {
  id: number;
  productId: number;
  authorName: string;
  content: string;
  admin: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: number;
  libelle: string;
  prix: number;
  quantite: number;
  imageUrl?: string;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  userFullName: string;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'OPERATEUR' | 'STOCK_OPERATEUR';
  active: boolean;
  allowedCategories?: string | null;
}

export type UniteKey = 'PIECE' | 'METRE' | 'BOBINE' | 'LOT';
export type CategorieKey = string;

export type VariantType = 'SIZE' | 'COLOR' | 'STORAGE';

export interface ProductVariant {
  id: number;
  type: VariantType;
  valeur: string;        // "S", "Rouge", "128 Go"
  prixSupplement: number;
  stock: number;
}

export interface Category {
  id: number;
  slug: string;
  label: string;
  icon?: string;
  imageUrl?: string;
}

export interface Product {
  id: number;
  libelle: string;
  description: string | null;
  prix: number;
  prixActif: boolean;
  prixPromo: number | null;
  reference: string | null;
  marque: string | null;
  categorie: CategorieKey | null;
  unite: UniteKey;
  quantiteMin: number;
  createdById: number | null;
  createdByName: string | null;
  createdAt: string;
  images: string[];
  deleted?: boolean;
  variants?: ProductVariant[];
  approvedByAdmin?: boolean;
}

export type CommandStatus = 'EN_ATTENTE' | 'CONFIRMEE' | 'EN_PREPARATION' | 'EXPEDIEE' | 'LIVREE' | 'VALIDEE' | 'REFUSEE' | 'ANNULEE';
export type CommandType = 'COMMANDE' | 'DEMANDE_INFO';

export interface CommandItem {
  productId: number | null;
  libelleSnapshot: string;
  prixSnapshot: number;
  quantite: number;
}

export interface OrderStatusHistory {
  status: CommandStatus;
  changedAt: string;
  changedBy: string | null;
}

export interface Command {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  status: CommandStatus;
  type: CommandType;
  items: CommandItem[];
  treatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  history?: OrderStatusHistory[];
}

export interface ActivityLog {
  id: number;
  userId: number | null;
  userFullName: string;
  action: string;
  details: string | null;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalCommands: number;
  commandsEnAttente: number;
  commandsValidees: number;
  commandsRefusees: number;
  pendingApprovalProducts: number;
  bannedUsers: number;
}

// ─── Cart (client-side only) ─────────────────────────────────────────────────
export interface CartEntry {
  product: Product;
  quantite: number;
}
