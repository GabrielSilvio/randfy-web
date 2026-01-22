/**
 * Request Manager with timeout, retry and deduplication
 */

import { logger } from '../utils/logger';
import { ApiErrorResponse } from './client';

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  dedupe?: boolean;
}

export class RequestManager {
  private abortControllers = new Map<string, AbortController>();
  private inflightRequests = new Map<string, Promise<any>>();

  /**
   * Fetch with timeout, automatic retry and deduplication
   */
  async fetch<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const {
      timeout = 30000,
      retries = 3,
      retryDelay = 1000,
      dedupe = false,
      ...fetchOptions
    } = options;

    // Request deduplication
    if (dedupe) {
      const key = this.getRequestKey(url, fetchOptions);
      const inflight = this.inflightRequests.get(key);
      if (inflight) {
        logger.info('Request deduplicated', { url, method: fetchOptions.method });
        return inflight as Promise<T>;
      }
    }

    const promise = this.executeWithRetry<T>(url, fetchOptions, {
      timeout,
      retries,
      retryDelay,
    });

    // Store inflight request
    if (dedupe) {
      const key = this.getRequestKey(url, fetchOptions);
      this.inflightRequests.set(key, promise);
      promise.finally(() => this.inflightRequests.delete(key));
    }

    return promise;
  }

  /**
   * Execute request with automatic retry
   */
  private async executeWithRetry<T>(
    url: string,
    options: RequestInit,
    config: { timeout: number; retries: number; retryDelay: number }
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        const response = await this.executeWithTimeout(url, options, config.timeout);

        // Retry on 5xx errors and 429 (rate limit)
        if (!response.ok) {
          if (
            attempt < config.retries &&
            (response.status >= 500 || response.status === 429)
          ) {
            const delay = this.calculateBackoff(attempt, config.retryDelay);
            logger.warn(`Retrying request (attempt ${attempt + 1}/${config.retries})`, {
              url,
              status: response.status,
              delay,
            });
            await this.delay(delay);
            continue;
          }

          // Not retryable, throw ApiErrorResponse
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, try text
            try {
              const errorText = await response.text();
              if (errorText) errorMessage = errorText;
            } catch {
              // Keep default message
            }
          }
          throw new ApiErrorResponse(
            errorMessage,
            response.status,
            response.statusText
          );
        }

        // Success
        return response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Retry only on network errors
        if (attempt < config.retries && this.isRetryableError(error)) {
          const delay = this.calculateBackoff(attempt, config.retryDelay);
          logger.warn(`Retrying request after network error (attempt ${attempt + 1})`, {
            url,
            error: lastError.message,
            delay,
          });
          await this.delay(delay);
          continue;
        }

        // Not retryable or exhausted retries
        break;
      }
    }

    // Exhausted all retry attempts
    logger.error('Request failed after all retries', {
      url,
      retries: config.retries,
      error: lastError,
    });
    throw lastError || new Error('Request failed');
  }

  /**
   * Execute request with timeout
   */
  private async executeWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const requestId = Math.random().toString(36).substring(7);
    
    this.abortControllers.set(requestId, controller);

    const timeoutId = setTimeout(() => {
      controller.abort();
      logger.warn('Request timeout', { url, timeout });
    }, timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Cancel all inflight requests
   */
  cancelAll(): void {
    logger.info('Cancelling all inflight requests', {
      count: this.abortControllers.size,
    });

    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
    this.inflightRequests.clear();
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateBackoff(attempt: number, baseDelay: number): number {
    // Exponential backoff: baseDelay * 2^attempt
    // With jitter to avoid thundering herd
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * exponentialDelay; // ±30% jitter
    return exponentialDelay + jitter;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const retryableErrors = [
      'Failed to fetch',
      'NetworkError',
      'Network request failed',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
    ];

    return retryableErrors.some((msg) => error.message.includes(msg));
  }

  /**
   * Generates unique key for request (for deduplication)
   */
  private getRequestKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    // options.body is already a stringified JSON from the API client
    // Using it directly as string, or empty string if undefined
    const body = typeof options.body === 'string' ? options.body : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Helper for delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const requestManager = new RequestManager();
