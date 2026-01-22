// Zod validation schemas (isomorphic - frontend and backend)

import { z } from 'zod';
import { CONFIG } from '../config/constants';

/**
 * Schema de validação para email
 */
export const emailSchema = z
  .string()
  .trim()
  .min(CONFIG.VALIDATION.EMAIL_MIN_LENGTH, 'E-mail muito curto')
  .max(CONFIG.VALIDATION.EMAIL_MAX_LENGTH, 'E-mail muito longo')
  .email('Por favor, informe um e-mail válido')
  .toLowerCase();

/**
 * Schema de validação para senha
 */
export const passwordSchema = z
  .string()
  .min(CONFIG.VALIDATION.PASSWORD_MIN_LENGTH, `A senha deve ter no mínimo ${CONFIG.VALIDATION.PASSWORD_MIN_LENGTH} caracteres`)
  .max(CONFIG.VALIDATION.PASSWORD_MAX_LENGTH, `A senha deve ter no máximo ${CONFIG.VALIDATION.PASSWORD_MAX_LENGTH} caracteres`);

/**
 * Schema de validação para nome completo
 */
export const nameSchema = z
  .string()
  .min(CONFIG.VALIDATION.NAME_MIN_LENGTH, `O nome deve ter no mínimo ${CONFIG.VALIDATION.NAME_MIN_LENGTH} caracteres`)
  .max(CONFIG.VALIDATION.NAME_MAX_LENGTH, `O nome deve ter no máximo ${CONFIG.VALIDATION.NAME_MAX_LENGTH} caracteres`)
  .trim()
  .refine(
    (name) => {
      const words = name.split(/\s+/).filter((w) => w.length > 0);
      return words.length >= 2;
    },
    {
      message: 'Por favor, informe seu nome completo (nome e sobrenome)',
    }
  );

/**
 * Schema de validação para termos de uso
 */
export const termsSchema = z.literal(true, {
  errorMap: () => ({
    message: 'Você precisa aceitar os termos de uso e política de privacidade',
  }),
});

/**
 * Schema de validação para login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginData = z.infer<typeof loginSchema>;

/**
 * Schema de validação para registro
 * Note: terms field is validated separately in the component
 */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterData = z.infer<typeof registerSchema>;

/**
 * Schema de validação para atualização de perfil
 */
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
});

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;

/**
 * Schema de validação para mudança de senha
 */
export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'A nova senha deve ser diferente da senha atual',
    path: ['newPassword'],
  });

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

// ==================== TENANT SCHEMAS ====================

/**
 * Schema for phone number validation (Brazilian format)
 */
export const phoneSchema = z
  .string()
  .min(10, 'Telefone muito curto')
  .max(20, 'Telefone muito longo')
  .regex(/^\+?[\d\s()-]+$/, 'Formato de telefone inválido')
  .optional()
  .or(z.literal(''));

/**
 * Schema for postal code validation (Brazilian CEP)
 */
export const postalCodeSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP inválido (ex: 01234-567)')
  .optional()
  .or(z.literal(''));

/**
 * Schema for creating a tenant (clinic)
 */
export const createTenantSchema = z.object({
  name: z.string().min(3, 'Nome da clínica deve ter no mínimo 3 caracteres').max(100, 'Nome muito longo'),
  address_1: z.string().max(200, 'Endereço muito longo').optional().or(z.literal('')),
  address_2: z.string().max(200, 'Complemento muito longo').optional().or(z.literal('')),
  number: z.string().max(20, 'Número muito longo').optional().or(z.literal('')),
  neighborhood: z.string().max(100, 'Bairro muito longo').optional().or(z.literal('')),
  city: z.string().min(2, 'Cidade deve ter no mínimo 2 caracteres').max(100, 'Cidade muito longa'),
  state_id: z.number().min(1, 'Selecione um estado'),
  postal_code: postalCodeSchema,
  phone_number: phoneSchema,
  assistant_name: z.string().max(50, 'Nome do assistente muito longo').optional().or(z.literal('')),
  email: emailSchema.optional().or(z.literal('')),
});

export type CreateTenantData = z.infer<typeof createTenantSchema>;

// ==================== SERVICE SCHEMAS ====================

/**
 * Schema for creating a service
 */
export const createServiceSchema = z.object({
  name: z.string().min(2, 'Nome do serviço deve ter no mínimo 2 caracteres').max(100, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional().or(z.literal('')),
  duration_minutes: z.number().min(5, 'Duração mínima de 5 minutos').max(480, 'Duração máxima de 8 horas'),
  price_cents: z.number().min(0, 'Preço não pode ser negativo'),
  requires_deposit: z.boolean().optional().default(false),
  deposit_cents: z.number().min(0, 'Depósito não pode ser negativo').optional().default(0),
});

export type CreateServiceData = z.infer<typeof createServiceSchema>;

/**
 * Helper to validate data and return formatted errors
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format errors to plain object with user-friendly messages
  const errors: Record<string, string> = {};
  result.error.issues.forEach((err) => {
    const path = err.path.join('.') || 'form';
    
    // Map Zod error codes to user-friendly messages
    let message = err.message;
    
    if (err.code === 'invalid_type') {
      if (err.expected === 'string' && err.received === 'undefined') {
        message = 'Este campo é obrigatório';
      } else if (err.expected === 'string' && err.received === 'null') {
        message = 'Este campo não pode estar vazio';
      }
    } else if (err.code === 'too_small') {
      if (err.type === 'string') {
        message = `Este campo deve ter no mínimo ${err.minimum} caracteres`;
      }
    } else if (err.code === 'too_big') {
      if (err.type === 'string') {
        message = `Este campo deve ter no máximo ${err.maximum} caracteres`;
      }
    } else if (err.code === 'invalid_string') {
      if (err.validation === 'email') {
        message = 'Por favor, informe um e-mail válido';
      }
    }
    
    errors[path] = message;
  });

  return { success: false, errors };
}

/**
 * Helper para obter o primeiro erro de validação
 */
export function getFirstError<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): string | null {
  const result = schema.safeParse(data);

  if (result.success) {
    return null;
  }

  return result.error.issues[0]?.message || 'Erro de validação';
}
