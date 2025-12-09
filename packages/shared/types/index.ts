// ===========================================
// SHARED TYPES - Used by both Mobile and Web
// ===========================================

// ============ USER TYPES ============
export interface User {
  id: string;
  email: string;
  displayName?: string;
  bio?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt?: Date;
}

export type UserRole = 'user' | 'admin';

// ============ BILL TYPES ============
export type BillType = 'electricity' | 'water' | 'gas' | 'naturalGas' | 'internet' | 'other';

export interface Bill {
  id: string;
  userId: string;
  type: BillType;
  usage: number;
  cost: number;
  date: Date;
  dueDate?: Date;
  description?: string;
  items?: string;
  imageUrl?: string;
  localImageUri?: string;
  isSynced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============ RECEIPT TYPES ============
export interface Receipt {
  id: string;
  userId: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  date: Date;
  merchant?: string;
  description?: string;
  imageUrl?: string;
  localImageUri?: string;
  tags?: string[];
  paymentMethod?: PaymentMethod;
  isSynced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'other';

// ============ CATEGORY TYPES ============
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// ============ LANGUAGE TYPES ============
export type Language = 'en' | 'tr';

// ============ OCR TYPES ============
export interface OCRResult {
  text: string;
  confidence: number;
  extractedData?: {
    amount?: number;
    date?: Date;
    merchant?: string;
  };
  billData?: {
    type?: BillType | string;
    usage?: number;
    cost?: number;
    items?: string;
    description?: string;
  };
}

// ============ STATS TYPES ============
export interface Stats {
  totalExpenses: number;
  monthlyExpenses: number;
  receiptCount: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

// ============ API RESPONSE TYPES ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// ============ PAGINATION ============
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============ FIREBASE COLLECTIONS ============
export const COLLECTIONS = {
  USERS: 'users',
  RECEIPTS: 'receipts',
  ELECTRICITY_BILLS: 'electricity_bills',
  WATER_BILLS: 'water_bills',
  GAS_BILLS: 'gas_bills',
  NATURAL_GAS_BILLS: 'naturalGas_bills',
  INTERNET_BILLS: 'internet_bills',
  OTHER_BILLS: 'other_bills',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
