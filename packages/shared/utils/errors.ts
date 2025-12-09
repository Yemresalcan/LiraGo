// ===========================================
// CUSTOM ERROR CLASSES
// ===========================================

import { ERROR_CODES, ErrorCode } from '../constants';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly timestamp: Date;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.code = code;
    this.timestamp = new Date();
    this.details = details;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace (if available)
    const ErrorWithCapture = Error as typeof Error & { captureStackTrace?: (target: object, constructor: Function) => void };
    if (ErrorWithCapture.captureStackTrace) {
      ErrorWithCapture.captureStackTrace(this, this.constructor);
    }
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      details: this.details,
    };
  }
}

export class AuthError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ERROR_CODES.AUTH_INVALID_CREDENTIALS, message, details);
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ERROR_CODES.NETWORK_ERROR, message, details);
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(ERROR_CODES.VALIDATION_ERROR, message, fieldErrors);
    this.fieldErrors = fieldErrors;
  }
}

export class FirebaseError extends AppError {
  public readonly originalCode: string;

  constructor(code: string, message: string, details?: unknown) {
    super(ERROR_CODES.FIREBASE_ERROR, message, details);
    this.originalCode = code;
  }
}

// ===========================================
// ERROR HANDLER UTILITY
// ===========================================

export interface ErrorInfo {
  code: ErrorCode;
  message: string;
  userMessage: string;
  shouldRetry: boolean;
}

const ERROR_MESSAGES: Record<string, string> = {
  // Firebase Auth errors
  'auth/user-not-found': 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.',
  'auth/wrong-password': 'Hatalı şifre girdiniz.',
  'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanımda.',
  'auth/weak-password': 'Şifre en az 6 karakter olmalıdır.',
  'auth/invalid-email': 'Geçersiz e-posta adresi.',
  'auth/too-many-requests': 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.',
  'auth/network-request-failed': 'İnternet bağlantınızı kontrol edin.',
  
  // Firestore errors
  'permission-denied': 'Bu işlem için yetkiniz bulunmuyor.',
  'not-found': 'İstenen veri bulunamadı.',
  'unavailable': 'Sunucu şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
  
  // Generic errors
  'network-error': 'İnternet bağlantınızı kontrol edin.',
  'timeout': 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.',
};

export function handleError(error: unknown): ErrorInfo {
  // Handle AppError instances
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      userMessage: error.message,
      shouldRetry: error.code === ERROR_CODES.NETWORK_ERROR || 
                   error.code === ERROR_CODES.NETWORK_TIMEOUT,
    };
  }

  // Handle Firebase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string; message: string };
    const userMessage = ERROR_MESSAGES[firebaseError.code] || 'Bir hata oluştu. Lütfen tekrar deneyin.';
    
    return {
      code: ERROR_CODES.FIREBASE_ERROR,
      message: firebaseError.message,
      userMessage,
      shouldRetry: ['unavailable', 'network-request-failed'].some(
        code => firebaseError.code.includes(code)
      ),
    };
  }

  // Handle standard Error
  if (error instanceof Error) {
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error.message,
      userMessage: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
      shouldRetry: false,
    };
  }

  // Handle unknown errors
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: String(error),
    userMessage: 'Beklenmeyen bir hata oluştu.',
    shouldRetry: false,
  };
}

// ===========================================
// LOGGER UTILITY
// ===========================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

class Logger {
  private isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  debug(message: string, data?: unknown) {
    if (this.isDevelopment) {
      console.debug('[DEBUG]', this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: unknown) {
    console.info('[INFO]', this.formatMessage('info', message, data));
  }

  warn(message: string, data?: unknown) {
    console.warn('[WARN]', this.formatMessage('warn', message, data));
  }

  error(message: string, error?: unknown, data?: unknown) {
    const logEntry = this.formatMessage('error', message, data);
    console.error('[ERROR]', logEntry);
    
    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: logEntry });
    
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

export const logger = new Logger();
