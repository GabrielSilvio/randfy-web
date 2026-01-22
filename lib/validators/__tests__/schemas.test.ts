import {
  emailSchema,
  passwordSchema,
  nameSchema,
  termsSchema,
  loginSchema,
  registerSchema,
  validateData,
  getFirstError,
} from '../schemas';

describe('emailSchema', () => {
  it('should accept valid email', () => {
    expect(emailSchema.safeParse('test@example.com').success).toBe(true);
  });

  it('should reject empty email', () => {
    const result = emailSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('should reject email without @', () => {
    const result = emailSchema.safeParse('testexample.com');
    expect(result.success).toBe(false);
  });

  it('should reject email without domain', () => {
    const result = emailSchema.safeParse('test@');
    expect(result.success).toBe(false);
  });

  it('should reject email longer than 254 chars', () => {
    const longEmail = 'a'.repeat(250) + '@test.com';
    const result = emailSchema.safeParse(longEmail);
    expect(result.success).toBe(false);
  });

  it('should normalize email to lowercase', () => {
    const result = emailSchema.safeParse('TEST@EXAMPLE.COM');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test@example.com');
    }
  });

  it('should trim whitespace', () => {
    const result = emailSchema.safeParse('  test@example.com  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test@example.com');
    }
  });
});

describe('passwordSchema', () => {
  it('should accept valid password', () => {
    expect(passwordSchema.safeParse('password123').success).toBe(true);
  });

  it('should reject password shorter than 8 chars', () => {
    const result = passwordSchema.safeParse('pass');
    expect(result.success).toBe(false);
  });

  it('should reject password longer than 128 chars', () => {
    const longPassword = 'a'.repeat(130);
    const result = passwordSchema.safeParse(longPassword);
    expect(result.success).toBe(false);
  });

  it('should accept password exactly 8 chars', () => {
    expect(passwordSchema.safeParse('12345678').success).toBe(true);
  });

  it('should accept password exactly 128 chars', () => {
    expect(passwordSchema.safeParse('a'.repeat(128)).success).toBe(true);
  });
});

describe('nameSchema', () => {
  it('should accept valid full name', () => {
    expect(nameSchema.safeParse('John Doe').success).toBe(true);
  });

  it('should reject single word', () => {
    const result = nameSchema.safeParse('John');
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = nameSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('should reject name shorter than 3 chars', () => {
    const result = nameSchema.safeParse('Jo');
    expect(result.success).toBe(false);
  });

  it('should reject name longer than 100 chars', () => {
    const longName = 'a'.repeat(101);
    const result = nameSchema.safeParse(longName);
    expect(result.success).toBe(false);
  });

  it('should trim whitespace', () => {
    const result = nameSchema.safeParse('  John Doe  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('John Doe');
    }
  });

  it('should accept names with multiple spaces', () => {
    expect(nameSchema.safeParse('John   Doe').success).toBe(true);
  });

  it('should accept names with 3+ words', () => {
    expect(nameSchema.safeParse('John Michael Doe').success).toBe(true);
  });
});

describe('termsSchema', () => {
  it('should accept true', () => {
    expect(termsSchema.safeParse(true).success).toBe(true);
  });

  it('should reject false', () => {
    const result = termsSchema.safeParse(false);
    expect(result.success).toBe(false);
  });

  it('should reject undefined', () => {
    const result = termsSchema.safeParse(undefined);
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('should accept valid login data', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
    };
    expect(loginSchema.safeParse(data).success).toBe(true);
  });

  it('should reject invalid email', () => {
    const data = {
      email: 'invalid-email',
      password: 'password123',
    };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const data = {
      email: 'test@example.com',
      password: 'short',
    };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('should accept valid register data', () => {
    const data = {
      name: 'John Doe',
      email: 'test@example.com',
      password: 'password123',
    };
    expect(registerSchema.safeParse(data).success).toBe(true);
  });

  it('should reject invalid name', () => {
    const data = {
      name: 'John',
      email: 'test@example.com',
      password: 'password123',
    };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('validateData', () => {
  it('should return success for valid data', () => {
    const data = { email: 'test@example.com', password: 'password123' };
    const result = validateData(loginSchema, data);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('should return errors for invalid data', () => {
    const data = { email: 'invalid', password: 'short' };
    const result = validateData(loginSchema, data);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeDefined();
      expect(result.errors.email).toBeDefined();
    }
  });
});

describe('getFirstError', () => {
  it('should return null for valid data', () => {
    const data = { email: 'test@example.com', password: 'password123' };
    const error = getFirstError(loginSchema, data);
    expect(error).toBeNull();
  });

  it('should return first error message', () => {
    const data = { email: 'invalid', password: 'short' };
    const error = getFirstError(loginSchema, data);
    expect(error).toBeTruthy();
    expect(typeof error).toBe('string');
  });
});
