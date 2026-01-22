/**
 * Secure logger for development and production environments
 */

export interface LogContext {
  operation?: string;
  status?: number;
  duration?: number;
  userId?: string | number;
  tenantId?: string | number;
  error?: unknown;
  [key: string]: unknown;
}

export interface ILogger {
  log(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
}

class DevelopmentLogger implements ILogger {
  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;
    
    const sanitized = { ...context };
    
    // Remove sensitive data
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    
    return sanitized;
  }

  log(message: string, context?: LogContext): void {
    console.log(`[LOG] ${message}`, this.sanitizeContext(context));
  }

  error(message: string, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, {
      ...this.sanitizeContext(context),
      timestamp: new Date().toISOString(),
    });
  }

  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, this.sanitizeContext(context));
  }

  info(message: string, context?: LogContext): void {
    console.info(`[INFO] ${message}`, this.sanitizeContext(context));
  }
}

class ProductionLogger implements ILogger {
  private getSentry() {
    try {
      return require('@sentry/nextjs');
    } catch {
      return null;
    }
  }

  log(message: string, context?: LogContext): void {
    // Silent in production
  }

  error(message: string, context?: LogContext): void {
    const Sentry = this.getSentry();
    if (!Sentry || typeof window === 'undefined') return;

    Sentry.captureException(context?.error || new Error(message), {
      tags: {
        operation: context?.operation,
        status: context?.status?.toString(),
      },
      extra: {
        duration: context?.duration,
        userId: context?.userId,
      },
    });
  }

  warn(message: string, context?: LogContext): void {
    const Sentry = this.getSentry();
    if (!Sentry || typeof window === 'undefined') return;

    Sentry.captureMessage(message, {
      level: 'warning',
      extra: context,
    });
  }

  info(message: string, context?: LogContext): void {
    // Silent in production
  }
}

/**
 * Factory to create logger based on environment
 */
export function createLogger(): ILogger {
  return process.env.NODE_ENV === 'production'
    ? new ProductionLogger()
    : new DevelopmentLogger();
}

/**
 * Singleton instance for general use
 */
export const logger = createLogger();
