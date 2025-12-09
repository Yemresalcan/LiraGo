// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  bio?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

// Receipt types
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
  localImageUri?: string; // For offline support
  tags?: string[];
  paymentMethod?: 'cash' | 'credit_card' | 'debit_card' | 'other';
  isSynced: boolean; // For offline support
  createdAt: Date;
  updatedAt: Date;
}

// Category types
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// Language types
export type Language = 'en' | 'tr';

// Sort configuration
export type SortConfig = {
  key: keyof Receipt;
  direction: 'ascending' | 'descending';
} | null;

import { NavigatorScreenParams } from '@react-navigation/native';

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  AddReceipt: undefined;
  MonthlyDashboard: undefined;
  BillHistory: { initialCategory?: BillType } | undefined;
  BillUpload: { imageUri?: string } | undefined;
  Settings: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  ReceiptDetail: { receiptId: string };
  Profile: undefined;
  BillUpload: { imageUri?: string } | undefined;
  BillHistory: { initialCategory?: BillType } | undefined;
};

// OCR Result types
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

// Firebase Auth Context types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

// Receipt Context types
export interface ReceiptContextType {
  receipts: Receipt[];
  loading: boolean;
  addReceipt: (receipt: Omit<Receipt, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateReceipt: (id: string, receipt: Partial<Receipt>) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
  syncReceipts: () => Promise<void>;
}

// Stats types
export interface Stats {
  totalExpenses: number;
  monthlyExpenses: number;
  receiptCount: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
}

export type BillType = 'electricity' | 'water' | 'gas' | 'naturalGas' | 'internet' | 'other';

export interface BillData {
  type: BillType;
  usage: number; // kWh for electricity, m3 for water/gas
  cost: number;
  date: Date;
  imageUrl?: string;
}
