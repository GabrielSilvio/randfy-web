// Token Manager with automatic refresh

import { CONFIG } from '../config/constants';
import { logger } from '../utils/logger';

export interface ITokenManager {
  getToken(): Promise<string | null>;
  getValidToken(): Promise<string | null>;
  saveToken(token: string, rememberMe?: boolean): Promise<void>;
  clearToken(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
}

export class TokenManager implements ITokenManager {
  private refreshPromise: Promise<string> | null = null;
  private cachedToken: string | null = null;
  private tokenFetchPromise: Promise<string | null> | null = null;
  private lastFetchTime: number = 0;
  private static readonly CACHE_TTL_MS = 5000; // Cache token for 5 seconds

  /**
   * Obtém token do cookie httpOnly (com cache e deduplicação)
   */
  async getToken(): Promise<string | null> {
    const now = Date.now();
    
    // Return cached token if still valid
    if (this.cachedToken && (now - this.lastFetchTime) < TokenManager.CACHE_TTL_MS) {
      return this.cachedToken;
    }

    // Deduplicate concurrent requests
    if (this.tokenFetchPromise) {
      return this.tokenFetchPromise;
    }

    this.tokenFetchPromise = this.fetchToken();
    
    try {
      const token = await this.tokenFetchPromise;
      this.cachedToken = token;
      this.lastFetchTime = now;
      return token;
    } finally {
      this.tokenFetchPromise = null;
    }
  }

  /**
   * Fetch token from API (internal, no caching)
   */
  private async fetchToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/auth/get-token', {
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.token || null;
    } catch (error) {
      logger.error('Failed to get token', { error });
      
      // Fallback para localStorage em desenvolvimento
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        return localStorage.getItem('auth_token_fallback');
      }
      
      return null;
    }
  }

  /**
   * Obtém token válido (refresh automático se necessário)
   */
  async getValidToken(): Promise<string | null> {
    const token = await this.getToken();
    
    if (!token) {
      return null;
    }

    try {
      const decoded = this.decodeToken(token);
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

      // Token expira em menos de 5 minutos - refresh
      if (expiresIn < CONFIG.AUTH.TOKEN_REFRESH_THRESHOLD) {
        logger.info('Token expiring soon, refreshing', { expiresIn });
        return await this.refreshToken();
      }

      // Token still valid
      return token;
    } catch (error) {
      // Error decoding token - may be invalid
      logger.warn('Failed to decode token', { error });
      return token; // Return anyway, backend will validate
    }
  }

  /**
   * Salva token no cookie httpOnly
   */
  async saveToken(token: string, rememberMe: boolean = false): Promise<void> {
    try {
      const response = await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rememberMe }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to save token');
      }

      // Update cache immediately
      this.cachedToken = token;
      this.lastFetchTime = Date.now();

      logger.info('Token saved successfully', { rememberMe });
    } catch (error) {
      logger.error('Failed to save token', { error });
      
      // Fallback para localStorage em desenvolvimento
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        localStorage.setItem('auth_token_fallback', token);
        this.cachedToken = token;
        this.lastFetchTime = Date.now();
        logger.warn('Token saved to localStorage fallback');
      }
      
      throw error;
    }
  }

  /**
   * Remove token (logout)
   */
  async clearToken(): Promise<void> {
    // Clear cache immediately
    this.cachedToken = null;
    this.lastFetchTime = 0;

    try {
      await fetch('/api/auth/clear-cookie', {
        method: 'POST',
        credentials: 'include',
      });

      logger.info('Token cleared successfully');
    } catch (error) {
      logger.error('Failed to clear token', { error });
    }

    // Also clear fallback
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token_fallback');
      localStorage.removeItem('user_data');
    }
  }

  /**
   * Verifica se usuário está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  /**
   * Refresh token automaticamente
   */
  private async refreshToken(): Promise<string> {
    // Deduplicate refresh requests (avoid multiple simultaneous refreshes)
    if (this.refreshPromise) {
      logger.info('Refresh already in progress, waiting');
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        logger.info('Refreshing token');

        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          // Refresh failed - force logout
          logger.warn('Token refresh failed, forcing logout');
          await this.clearToken();
          
          // Redirecionar para login
          if (typeof window !== 'undefined') {
            window.location.href = '/login?reason=session_expired';
          }
          
          throw new Error('Session expired');
        }

        const { token } = await response.json();
        await this.saveToken(token);
        
        logger.info('Token refreshed successfully');
        return token;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Decodifica JWT token (apenas payload, sem validação)
   */
  private decodeToken(token: string): { exp: number; [key: string]: any } {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }
}

// Factory para criar token manager
export function createTokenManager(): ITokenManager {
  return new TokenManager();
}

// Singleton instance for general use
export const tokenManager = createTokenManager();
