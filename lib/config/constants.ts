// Centralized application configuration

export const CONFIG = {
  API: {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    TIMEOUT: 30000, // 30 segundos
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 segundo
  },
  
  AUTH: {
    TOKEN_COOKIE_NAME: 'auth_token',
    REMEMBER_ME_DURATION: 30 * 24 * 60 * 60, // 30 dias em segundos
    SESSION_DURATION: 24 * 60 * 60, // 1 dia em segundos
    TOKEN_REFRESH_THRESHOLD: 5 * 60, // 5 minutes before expiration
  },
  
  VALIDATION: {
    EMAIL_MAX_LENGTH: 254,
    EMAIL_MIN_LENGTH: 3,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 100,
  },
  
  RATE_LIMIT: {
    LOGIN_MAX_ATTEMPTS: 5,
    LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutos
    REGISTER_MAX_ATTEMPTS: 3,
    REGISTER_WINDOW_MS: 60 * 60 * 1000, // 1 hora
  },
  
  UI: {
    TOAST_DURATION: 5000, // 5 segundos
    DEBOUNCE_DELAY: 300, // 300ms
    ANIMATION_DURATION: 300, // 300ms
  },
} as const;

// Type-safe config access
export type AppConfig = typeof CONFIG;
