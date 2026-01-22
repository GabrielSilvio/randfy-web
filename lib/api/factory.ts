// Factory for creating API Client instances

import { CONFIG } from '../config/constants';
import { ApiClient, ApiConfig, IApiClient } from './client';
import { RequestManager } from './request-manager';
import { createTokenManager } from './token-manager';

/**
 * Factory para criar API Client com configuração customizada
 */
export function createApiClient(config: Partial<ApiConfig> = {}): IApiClient {
  const mergedConfig: ApiConfig = {
    baseUrl: config.baseUrl || CONFIG.API.BASE_URL,
    timeout: config.timeout || CONFIG.API.TIMEOUT,
    retries: config.retries || CONFIG.API.RETRY_ATTEMPTS,
  };

  const requestManager = new RequestManager();
  const tokenManager = createTokenManager();

  return new ApiClient(mergedConfig, requestManager, tokenManager);
}

// Singleton instance for general use (backward compatibility)
export const apiClient = createApiClient();
