# 📐 Coding Standards & Best Practices

**Last Updated:** 2026-01-21  
**Purpose:** Maintain consistency and quality across all code

---

## 🎯 Core Principles

1. **English Only** - All comments, variable names, and documentation in English
2. **Type Safety First** - Use TypeScript strict mode, Zod for validation
3. **Test Coverage** - Write tests for critical paths (validators, API, utils)
4. **Observability** - All errors logged, Sentry integrated
5. **Security** - Never log sensitive data, use httpOnly cookies
6. **DRY** - Don't repeat yourself, extract shared logic

---

## 📁 Project Structure

```
RandFyWebsite/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route groups
│   │   ├── login/
│   │   └── register/
│   ├── api/                # API Routes
│   │   └── auth/
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
│
├── components/             # Shared React components
│   ├── error-boundary.tsx
│   └── skeleton.tsx
│
├── lib/                    # Core libraries
│   ├── api/                # API client
│   │   ├── client.ts       # Main API client
│   │   ├── factory.ts      # Factory pattern
│   │   ├── request-manager.ts
│   │   ├── token-manager.ts
│   │   └── __tests__/      # Tests
│   │
│   ├── config/             # Configuration
│   │   └── constants.ts
│   │
│   ├── validators/         # Validation schemas
│   │   ├── schemas.ts      # Zod schemas
│   │   └── __tests__/
│   │
│   └── utils/              # Utilities
│       └── logger.ts
│
├── instrumentation.ts      # Sentry server init
├── sentry.client.config.ts # Sentry client config
├── sentry.server.config.ts # Sentry server config
└── jest.config.js          # Jest configuration
```

---

## 🔧 API Client Pattern

### ✅ DO: Use Factory Pattern

```typescript
// ✅ CORRECT
import { createApiClient } from '@/lib/api';

const api = createApiClient({
  baseUrl: 'https://api.example.com',
  timeout: 15000,
});

await api.loginUser({ email, password });
```

### ❌ DON'T: Use Singleton Directly

```typescript
// ❌ WRONG
import apiService from '@/lib/api'; // Old pattern
```

### Creating New API Methods

```typescript
// lib/api/client.ts
export interface IApiClient {
  // ... existing methods
  newMethod(data: NewData): Promise<Response>;
}

export class ApiClient implements IApiClient {
  async newMethod(data: NewData): Promise<Response> {
    const startTime = Date.now();
    
    try {
      const response = await this.requestManager.fetch<Response>(
        `${this.config.baseUrl}/api/new-endpoint`,
        {
          method: 'POST',
          body: JSON.stringify(data),
          timeout: 10000,
          dedupe: true,
        }
      );

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const result = await response.json();
      
      logger.info('New method success', {
        operation: 'newMethod',
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('New method failed', {
        operation: 'newMethod',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }
}
```

---

## ✅ Validation Pattern

### ✅ DO: Use Zod Schemas

```typescript
// lib/validators/schemas.ts
import { z } from 'zod';
import { CONFIG } from '../config/constants';

export const newFeatureSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
});

export type NewFeatureData = z.infer<typeof newFeatureSchema>;
```

### Usage in Components

```typescript
// app/new-feature/page.tsx
import { validateData, newFeatureSchema } from '@/lib/validators/schemas';

const handleSubmit = async (formData: unknown) => {
  const validation = validateData(newFeatureSchema, formData);

  if (!validation.success) {
    const firstError = Object.values(validation.errors)[0];
    setError(firstError);
    return;
  }

  // Data is now type-safe
  await apiClient.newMethod(validation.data);
};
```

### ❌ DON'T: Manual Validation

```typescript
// ❌ WRONG
if (!formData.email || !formData.email.includes('@')) {
  setError('Invalid email');
}
```

---

## 🧪 Testing Standards

### Test File Structure

```typescript
// lib/feature/__tests__/feature.test.ts
import { featureFunction } from '../feature';

describe('featureFunction', () => {
  it('should handle valid input', () => {
    const result = featureFunction('valid');
    expect(result).toBe(true);
  });

  it('should reject invalid input', () => {
    expect(() => featureFunction('')).toThrow();
  });
});
```

### Test Coverage Requirements

- ✅ Validators: 100% coverage
- ✅ API Client methods: Test success + error cases
- ✅ Utils: Test edge cases
- ✅ Components: Test critical user flows

### Running Tests

```bash
npm test              # Run all tests
npm test:watch        # Watch mode
npm test:coverage     # Coverage report
```

---

## 📝 Code Comments

### ✅ DO: English Comments

```typescript
/**
 * Register a new user
 * @param data - User registration data
 * @returns Promise with token and user data
 */
async registerUser(data: RegisterData): Promise<LoginResponse> {
  // Save token securely
  await this.tokenManager.saveToken(token);
  
  // Save user data (non-sensitive) to localStorage
  localStorage.setItem('user_data', JSON.stringify(user));
}
```

### ❌ DON'T: Portuguese Comments

```typescript
// ❌ WRONG
// Salvar token de forma segura
// Salvar dados do usuário
```

### Comment Guidelines

- **Function comments:** Use JSDoc format
- **Inline comments:** Explain "why", not "what"
- **Complex logic:** Always comment
- **TODOs:** Use `// TODO: description`

---

## 🚨 Error Handling

### ✅ DO: Use Logger

```typescript
import { logger } from '@/lib/utils/logger';

try {
  await apiClient.someMethod();
} catch (error) {
  logger.error('Operation failed', {
    operation: 'someMethod',
    error,
    userId: user.id,
  });
  
  // Show user-friendly message
  setError('Something went wrong. Please try again.');
}
```

### Error Messages

- ✅ User-facing: Friendly, actionable
- ✅ Logs: Technical, with context
- ✅ Sentry: Automatic via logger

---

## 🔍 Observability (Sentry)

### Setup

1. Add DSN to `.env.local`:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

2. Errors automatically tracked via:
   - Error Boundary
   - Logger
   - API Client

### Manual Tracking

```typescript
import * as Sentry from '@sentry/nextjs';

// Capture exception
Sentry.captureException(error, {
  tags: { section: 'checkout' },
  extra: { orderId: '123' },
});

// Capture message
Sentry.captureMessage('User action', {
  level: 'warning',
});

// Set user context
Sentry.setUser({
  id: user.id,
  email: user.email,
});
```

---

## 🎨 Component Patterns

### ✅ DO: Use Skeleton Loaders

```typescript
import { SkeletonCard } from '@/components/skeleton';

if (loading) {
  return (
    <div className="grid grid-cols-4 gap-6">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
```

### ✅ DO: Error Boundaries

```typescript
// Already in layout.tsx
<ErrorBoundary>
  {children}
</ErrorBoundary>
```

### ✅ DO: Loading States

```typescript
<button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? (
    <>
      <Spinner />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</button>
```

---

## 🔐 Security Standards

### ✅ DO: Filter Sensitive Data

```typescript
// Logger automatically filters
logger.error('Login failed', {
  email: userEmail, // ✅ OK - will be sanitized
  password: password, // ✅ OK - will be removed
});
```

### ✅ DO: Use httpOnly Cookies

```typescript
// TokenManager handles this automatically
await tokenManager.saveToken(token);
```

### ❌ DON'T: Log Sensitive Data

```typescript
// ❌ WRONG
console.log('Password:', password);
console.log('Token:', token);
```

---

## 📊 Configuration

### ✅ DO: Use Constants File

```typescript
// lib/config/constants.ts
export const CONFIG = {
  API: {
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
  },
  VALIDATION: {
    EMAIL_MAX_LENGTH: 254,
  },
} as const;
```

### ❌ DON'T: Magic Numbers

```typescript
// ❌ WRONG
setTimeout(() => {}, 30000);
if (email.length > 254) {}
```

---

## 🚀 Adding New Features

### Checklist

- [ ] Create Zod schema in `lib/validators/schemas.ts`
- [ ] Add API method to `lib/api/client.ts` with:
  - [ ] Error handling
  - [ ] Logging
  - [ ] Timeout
  - [ ] Deduplication (if needed)
- [ ] Write tests in `__tests__/` folder
- [ ] Use `validateData()` in component
- [ ] Add loading states
- [ ] Add error messages
- [ ] Test manually
- [ ] Run `npm test`
- [ ] Run `npm run lint`
- [ ] Check Sentry (if error occurs)

### Example: Adding "Forgot Password"

```typescript
// 1. Schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// 2. API Method
async forgotPassword(email: string): Promise<void> {
  // ... implementation
}

// 3. Component
const validation = validateData(forgotPasswordSchema, { email });
if (!validation.success) {
  setError(Object.values(validation.errors)[0]);
  return;
}
await apiClient.forgotPassword(validation.data.email);
```

---

## 📝 File Naming Conventions

- **Components:** `kebab-case.tsx` (e.g., `error-boundary.tsx`)
- **Utils/Lib:** `kebab-case.ts` (e.g., `request-manager.ts`)
- **Tests:** `*.test.ts` (e.g., `schemas.test.ts`)
- **Config:** `kebab-case.ts` (e.g., `sentry.client.config.ts`)

---

## 🎯 Code Review Checklist

Before submitting code:

- [ ] All comments in English
- [ ] TypeScript strict mode passes
- [ ] Tests written and passing
- [ ] No console.log/error (use logger)
- [ ] No sensitive data in logs
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Validation with Zod
- [ ] Lint passes (`npm run lint`)
- [ ] Tests pass (`npm test`)

---

## 🔄 Git Workflow

### Commit Messages

```
feat: add forgot password feature
fix: resolve login timeout issue
refactor: extract validation logic
test: add tests for token manager
docs: update API documentation
```

### Branch Naming

```
feature/forgot-password
fix/login-timeout
refactor/api-client
```

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `lib/api/client.ts` | API client implementation |
| `lib/api/factory.ts` | Factory for creating API instances |
| `lib/validators/schemas.ts` | Zod validation schemas |
| `lib/utils/logger.ts` | Structured logging |
| `lib/config/constants.ts` | Centralized configuration |
| `components/error-boundary.tsx` | Error boundary component |
| `components/skeleton.tsx` | Loading skeleton components |

---

## 🎓 Quick Reference

### Import Patterns

```typescript
// API Client
import { apiClient } from '@/lib/api';
import { createApiClient } from '@/lib/api';

// Validation
import { validateData, loginSchema } from '@/lib/validators/schemas';

// Logger
import { logger } from '@/lib/utils/logger';

// Config
import { CONFIG } from '@/lib/config/constants';

// Components
import { ErrorBoundary } from '@/components/error-boundary';
import { SkeletonCard } from '@/components/skeleton';
```

### Common Patterns

```typescript
// Form validation
const validation = validateData(schema, formData);
if (!validation.success) {
  setError(Object.values(validation.errors)[0]);
  return;
}

// API call with error handling
try {
  setIsLoading(true);
  await apiClient.method(validation.data);
  router.push('/success');
} catch (error) {
  logger.error('Operation failed', { operation: 'method', error });
  setError(error instanceof Error ? error.message : 'Failed');
} finally {
  setIsLoading(false);
}
```

---

## ✅ Final Checklist for New Features

1. ✅ Schema created in `lib/validators/schemas.ts`
2. ✅ API method added to `lib/api/client.ts`
3. ✅ Tests written in `__tests__/` folder
4. ✅ Component uses `validateData()`
5. ✅ Loading states implemented
6. ✅ Error handling with logger
7. ✅ Comments in English
8. ✅ No sensitive data logged
9. ✅ Tests passing
10. ✅ Lint passing

---

**🎯 Remember: Consistency is key. Follow these patterns for maintainable, scalable code.**
