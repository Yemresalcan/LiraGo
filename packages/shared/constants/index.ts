// ===========================================
// SHARED CONSTANTS
// ===========================================

// ============ APP CONFIG ============
export const APP_CONFIG = {
  APP_NAME: 'LiraGo',
  APP_VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'tr' as const,
  SUPPORTED_LANGUAGES: ['tr', 'en'] as const,
  DEFAULT_CURRENCY: 'TRY',
} as const;

// ============ THEME COLORS ============
export const COLORS = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  secondary: '#10b981',
  background: '#f5f5f5',
  backgroundDark: '#1a1a2e',
  surface: '#ffffff',
  surfaceDark: '#16213e',
  text: '#1f2937',
  textDark: '#f9fafb',
  textSecondary: '#6b7280',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  info: '#3b82f6',
} as const;

// ============ BILL TYPE COLORS ============
export const BILL_TYPE_COLORS = {
  electricity: '#facc15', // Yellow
  water: '#3b82f6',       // Blue
  gas: '#f97316',         // Orange
  naturalGas: '#f97316',  // Orange
  internet: '#8b5cf6',    // Purple
  other: '#a855f7',       // Purple
} as const;

// ============ API CONFIG ============
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// ============ PAGINATION DEFAULTS ============
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ============ STORAGE KEYS ============
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  LANGUAGE: '@app_language',
  THEME: '@app_theme',
  ONBOARDING_COMPLETED: '@onboarding_completed',
  OFFLINE_RECEIPTS: '@receipts_offline',
  OFFLINE_BILLS: '@bills_offline',
} as const;

// ============ ERROR CODES ============
export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Firebase errors
  FIREBASE_ERROR: 'FIREBASE_ERROR',
  FIRESTORE_ERROR: 'FIRESTORE_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ============ DATE FORMATS ============
export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  DISPLAY_SHORT: 'dd/MM/yy',
  API: 'yyyy-MM-dd',
  FULL: 'dd MMMM yyyy HH:mm',
} as const;
