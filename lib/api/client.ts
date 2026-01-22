/**
 * Refactored API Client with Factory Pattern + Dependency Injection
 */

import { logger } from '../utils/logger';
import { RequestManager } from './request-manager';
import { ITokenManager } from './token-manager';

// ==================== INTERFACES ====================

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  tenant_id: number;
  role: string;
  phone_number?: string;
  crm?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantResponse {
  id: number;
  name: string;
  address_1?: string;
  address_2?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state_id?: number;
  postal_code?: string;
  phone_number?: string;
  assistant_name?: string;
  email?: string;
  evolution_token?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CurrentUserResponse {
  user: UserResponse;
  tenant?: TenantResponse;
}

export interface CreateTenantData {
  name: string;
  address_1?: string;
  address_2?: string;
  number?: string;
  neighborhood?: string;
  city: string;
  state_id: number;
  postal_code?: string;
  phone_number?: string;
  assistant_name?: string;
  email?: string;
}

export interface ServiceData {
  name: string;
  description?: string;
  duration_minutes: number;
  price_cents: number;
  requires_deposit?: boolean;
  deposit_cents?: number;
}

export interface ServiceResponse {
  id: number;
  name: string;
  description?: string;
  duration_minutes: number;
  price_cents: number;
  requires_deposit: boolean;
  deposit_cents?: number;
  tenant_id: number;
}

export interface StateResponse {
  id: number;
  code: string;
  name: string;
  country: string;
}

export interface QRCodeResponse {
  base64: string;
  code: string;
  qrcode: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface ApiError {
  error: string;
  message?: string;
}

// ==================== PATIENT INTERFACES ====================

export interface PatientData {
  name: string;
  phone_number: string;
  dob?: string;
  cpf?: string;
  sex?: 'M' | 'F';
}

export interface PatientResponse {
  id: number;
  name: string;
  phone_number: string;
  dob?: string;
  cpf?: string;
  sex?: 'M' | 'F';
  tenant_id: number;
  created_at: string;
  updated_at: string;
}

// ==================== APPOINTMENT INTERFACES ====================

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface AppointmentData {
  patient_id: number;
  date_time: string;
  service_id: number;
  professional_id: number;
}

export interface AppointmentResponse {
  id: number;
  patient_id: number;
  patient_name: string;
  date_time: string;
  end_date_time: string;
  status: AppointmentStatus;
  service_id: number;
  service_name: string;
  professional_id: number;
  professional_name: string;
  payment_url?: string;
  payment_status: PaymentStatus;
  requires_deposit: boolean;
  deposit_cents?: number;
  price_cents: number;
}

export interface AppointmentFilters {
  start_date?: string;
  end_date?: string;
}

// ==================== VITAL SIGNS INTERFACES ====================

export interface VitalSignData {
  value: string;
  vital_sign_type_id: number;
}

export interface VitalSignResponse {
  id: number;
  value: string;
  vital_sign_type_id: number;
  appointment_id: number;
  created_at: string;
  updated_at: string;
}

export interface VitalSignTypeResponse {
  id: number;
  name: string;
  unit: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// ==================== PRESCRIPTION INTERFACES ====================

export interface PrescriptionData {
  medication_id?: number;
  medication_name?: string;
  duration_days: number;
  detail: string;
}

export interface PrescriptionResponse {
  id: number;
  medication_id?: number;
  medication_name?: string;
  duration_days: number;
  detail: string;
  appointment_id: number;
  created_at: string;
  updated_at: string;
}

// ==================== TEST REQUEST INTERFACES ====================

export interface TestRequestData {
  test: string;
}

export interface TestRequestResponse {
  id: number;
  test: string;
  appointment_id: number;
  created_at: string;
  updated_at: string;
}

// ==================== CHAT INTERFACES ====================

export interface ChatConversation {
  id: string;
  phone_number: string;
  name: string;
  unread_count: number;
  last_message: string;
  last_message_time: string;
  profile_picture_url?: string;
}

export interface ChatMessage {
  id: string;
  from: string;
  text: string;
  timestamp: string;
  from_me: boolean;
  push_name?: string;
}

export interface SendMessageData {
  phone_number: string;
  text: string;
}

export interface SendMessageResponse {
  message_id: string;
  timestamp: string;
  success: boolean;
}

// ==================== USER MANAGEMENT INTERFACES ====================

export interface UpdateUserData {
  name?: string;
  phone_number?: string;
  crm?: string;
  active?: boolean;
}

// ==================== SPECIALTY INTERFACES ====================

export interface SpecialtyResponse {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// ==================== PAYMENT METHOD INTERFACES ====================

export interface PaymentMethodResponse {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

// ==================== TENANT SCHEDULE INTERFACES ====================

export interface TenantScheduleData {
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: number;  // HHMM format (e.g., 900 for 09:00)
  end_time: number;    // HHMM format (e.g., 1800 for 18:00)
}

export interface TenantScheduleResponse extends TenantScheduleData {
  id: number;
  tenant_id: number;
  created_at: string;
  updated_at: string;
}

// ==================== FAQ INTERFACES ====================

export interface FAQData {
  question: string;
  answer: string;
}

export interface FAQResponse extends FAQData {
  id: number;
  tenant_id: number;
  created_at: string;
  updated_at: string;
}

// ==================== ERROR CLASS ====================

export class ApiErrorResponse extends Error {
  status: number;
  statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.status = status;
    this.statusText = statusText;
    this.name = 'ApiErrorResponse';
  }
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

// ==================== API CLIENT INTERFACE ====================

export interface IApiClient {
  // Auth
  registerUser(data: RegisterData, rememberMe?: boolean): Promise<LoginResponse>;
  loginUser(data: LoginData, rememberMe?: boolean): Promise<LoginResponse>;
  getCurrentUser(): Promise<CurrentUserResponse>;
  logout(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
  getAuthToken(): Promise<string | null>;
  
  // Tenant
  createTenant(data: CreateTenantData): Promise<TenantResponse>;
  getTenant(tenantId: number): Promise<TenantResponse>;
  updateTenant(tenantId: number, data: Partial<CreateTenantData>): Promise<TenantResponse>;
  getQRCode(tenantId: number): Promise<QRCodeResponse>;
  
  // States
  getStates(): Promise<{ data: StateResponse[] }>;
  
  // Services
  createService(tenantId: number, data: ServiceData): Promise<ServiceResponse>;
  getServices(tenantId: number): Promise<{ data: ServiceResponse[] }>;

  // Patients
  getPatients(tenantId: number): Promise<{ data: PatientResponse[] }>;
  getPatient(tenantId: number, patientId: number): Promise<PatientResponse>;
  createPatient(tenantId: number, data: PatientData): Promise<PatientResponse>;
  updatePatient(tenantId: number, patientId: number, data: Partial<PatientData>): Promise<PatientResponse>;

  // Appointments
  getAppointments(tenantId: number, filters?: AppointmentFilters): Promise<{ data: AppointmentResponse[] }>;
  getAppointment(tenantId: number, appointmentId: number): Promise<AppointmentResponse>;
  createAppointment(tenantId: number, data: AppointmentData): Promise<AppointmentResponse>;
  cancelAppointment(tenantId: number, appointmentId: number): Promise<AppointmentResponse>;

  // Vital Signs
  getVitalSigns(tenantId: number, appointmentId: number): Promise<{ data: VitalSignResponse[] }>;
  createVitalSign(tenantId: number, appointmentId: number, data: VitalSignData): Promise<VitalSignResponse>;
  getVitalSignTypes(): Promise<{ data: VitalSignTypeResponse[] }>;

  // Prescriptions
  getPrescriptions(tenantId: number, appointmentId: number): Promise<{ data: PrescriptionResponse[] }>;
  createPrescription(tenantId: number, appointmentId: number, data: PrescriptionData): Promise<PrescriptionResponse>;

  // Test Requests
  getTestRequests(tenantId: number, appointmentId: number): Promise<{ data: TestRequestResponse[] }>;
  createTestRequest(tenantId: number, appointmentId: number, data: TestRequestData): Promise<TestRequestResponse>;

  // Chat
  getConversations(tenantId: number): Promise<{ conversations: ChatConversation[] }>;
  getMessages(tenantId: number, phoneNumber: string, limit?: number, page?: number): Promise<{ messages: ChatMessage[] }>;
  sendMessage(tenantId: number, data: SendMessageData): Promise<SendMessageResponse>;

  // Users (Professionals)
  listUsers(tenantId: number): Promise<{ data: UserResponse[] }>;
  getUser(tenantId: number, userId: number): Promise<UserResponse>;
  updateUser(tenantId: number, userId: number, data: UpdateUserData): Promise<UserResponse>;

  // Specialties
  getSpecialties(): Promise<{ data: SpecialtyResponse[] }>;

  // Payment Methods
  getPaymentMethods(): Promise<{ data: PaymentMethodResponse[] }>;

  // Tenant Schedules
  upsertTenantSchedules(tenantId: number, schedules: TenantScheduleData[]): Promise<{ data: TenantScheduleResponse[] }>;
  getTenantSchedules(tenantId: number): Promise<{ data: TenantScheduleResponse[] }>;

  // FAQs
  createFAQ(tenantId: number, data: FAQData): Promise<FAQResponse>;
  listFAQs(tenantId: number): Promise<{ data: FAQResponse[] }>;
  getFAQ(tenantId: number, faqId: number): Promise<FAQResponse>;
  updateFAQ(tenantId: number, faqId: number, data: Partial<FAQData>): Promise<FAQResponse>;
  deleteFAQ(tenantId: number, faqId: number): Promise<void>;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Extract data from API response that may be wrapped in { data: ... }
 */
function unwrapResponse<T>(result: T | { data: T }): T {
  if (result && typeof result === 'object' && 'data' in result && result.data) {
    return result.data as T;
  }
  return result as T;
}

// ==================== API CLIENT ====================

/**
 * API Client with Dependency Injection
 */
export class ApiClient implements IApiClient {
  constructor(
    private config: ApiConfig,
    private requestManager: RequestManager,
    private tokenManager: ITokenManager
  ) {}

  /**
   * Get authorization headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.tokenManager.getValidToken();
    if (!token) throw new Error('Sessão expirada. Faça login novamente.');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Handle network errors and convert to user-friendly messages
   */
  private handleNetworkError(error: unknown): never {
    if (error instanceof ApiErrorResponse) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error(
          'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.'
        );
      }
      throw error;
    }

    throw new Error('Erro inesperado. Tente novamente.');
  }

  // ==================== AUTH METHODS ====================

  async registerUser(data: RegisterData, rememberMe = false): Promise<LoginResponse> {
    const startTime = Date.now();

    try {
      const result = await this.requestManager.fetch<LoginResponse>(
        `${this.config.baseUrl}/api/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          timeout: 10000,
          dedupe: true,
        }
      );

      if (result.token) {
        await this.tokenManager.saveToken(result.token, rememberMe);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_data', JSON.stringify(result.user));
        }
      }

      logger.info('User registered successfully', {
        operation: 'registerUser',
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Registration failed', {
        operation: 'registerUser',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async loginUser(data: LoginData, rememberMe = false): Promise<LoginResponse> {
    const startTime = Date.now();

    try {
      const result = await this.requestManager.fetch<LoginResponse>(
        `${this.config.baseUrl}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          timeout: 10000,
          dedupe: true,
        }
      );

      if (result.token) {
        await this.tokenManager.saveToken(result.token, rememberMe);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_data', JSON.stringify(result.user));
        }
      }

      logger.info('User logged in successfully', {
        operation: 'loginUser',
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Login failed', {
        operation: 'loginUser',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async getCurrentUser(): Promise<CurrentUserResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<CurrentUserResponse | UserResponse | { data: unknown }>(
        `${this.config.baseUrl}/api/auth/me`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
          dedupe: true, // Avoid duplicate concurrent requests
        }
      );

      let normalized: CurrentUserResponse;
      
      if ('data' in result && result.data) {
        const dataResult = result.data as CurrentUserResponse | UserResponse;
        normalized = 'user' in dataResult && dataResult.user
          ? dataResult as CurrentUserResponse
          : { user: dataResult as UserResponse, tenant: undefined };
      } else if ('user' in result && result.user) {
        normalized = result as CurrentUserResponse;
      } else {
        normalized = { user: result as UserResponse, tenant: undefined };
      }

      logger.info('Got current user', {
        operation: 'getCurrentUser',
        userId: normalized.user?.id?.toString(),
        tenantId: normalized.user?.tenant_id?.toString(),
        duration: Date.now() - startTime,
      });

      return normalized;
    } catch (error) {
      logger.error('Failed to get current user', {
        operation: 'getCurrentUser',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.tokenManager.clearToken();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_data');
      }
      logger.info('User logged out', { operation: 'logout' });
    } catch (error) {
      logger.error('Logout failed', { operation: 'logout', error });
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return await this.tokenManager.isAuthenticated();
  }

  async getAuthToken(): Promise<string | null> {
    return await this.tokenManager.getToken();
  }

  // ==================== TENANT METHODS ====================

  async createTenant(data: CreateTenantData): Promise<TenantResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<TenantResponse | { data: TenantResponse }>(
        `${this.config.baseUrl}/api/tenants`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          timeout: 15000,
          dedupe: true,
        }
      );

      const tenant = unwrapResponse(result);

      logger.info('Tenant created', {
        operation: 'createTenant',
        tenantId: tenant.id,
        duration: Date.now() - startTime,
      });

      return tenant;
    } catch (error) {
      logger.error('Failed to create tenant', {
        operation: 'createTenant',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async getTenant(tenantId: number): Promise<TenantResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<TenantResponse | { data: TenantResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      const tenant = unwrapResponse(result);

      logger.info('Got tenant', {
        operation: 'getTenant',
        tenantId,
        duration: Date.now() - startTime,
      });

      return tenant;
    } catch (error) {
      logger.error('Failed to get tenant', {
        operation: 'getTenant',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async updateTenant(tenantId: number, data: Partial<CreateTenantData>): Promise<TenantResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<TenantResponse | { data: TenantResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data),
          timeout: 10000,
        }
      );

      const tenant = unwrapResponse(result);

      logger.info('Tenant updated', {
        operation: 'updateTenant',
        tenantId,
        duration: Date.now() - startTime,
      });

      return tenant;
    } catch (error) {
      logger.error('Failed to update tenant', {
        operation: 'updateTenant',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async getQRCode(tenantId: number): Promise<QRCodeResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<QRCodeResponse>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/qrcode`,
        {
          method: 'GET',
          headers,
          timeout: 30000,
        }
      );

      logger.info('Got QR code', {
        operation: 'getQRCode',
        tenantId,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get QR code', {
        operation: 'getQRCode',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  // ==================== STATES METHODS ====================

  async getStates(): Promise<{ data: StateResponse[] }> {
    const startTime = Date.now();

    try {
      const result = await this.requestManager.fetch<{ data: StateResponse[] }>(
        `${this.config.baseUrl}/api/states`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
          dedupe: true, // Avoid duplicate concurrent requests
        }
      );

      logger.info('Got states', {
        operation: 'getStates',
        count: result.data?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get states', {
        operation: 'getStates',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  // ==================== SERVICE METHODS ====================

  async createService(tenantId: number, data: ServiceData): Promise<ServiceResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<ServiceResponse | { data: ServiceResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/services`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          timeout: 10000,
          dedupe: true,
        }
      );

      const service = unwrapResponse(result);

      logger.info('Service created', {
        operation: 'createService',
        tenantId,
        serviceId: service.id,
        duration: Date.now() - startTime,
      });

      return service;
    } catch (error) {
      logger.error('Failed to create service', {
        operation: 'createService',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async getServices(tenantId: number): Promise<{ data: ServiceResponse[] }> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<{ data: ServiceResponse[] }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/services`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      logger.info('Got services', {
        operation: 'getServices',
        tenantId,
        count: result.data?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get services', {
        operation: 'getServices',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  // ==================== PATIENT METHODS ====================

  async getPatients(tenantId: number): Promise<{ data: PatientResponse[] }> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<{ data: PatientResponse[] }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/patients`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      logger.info('Got patients', {
        operation: 'getPatients',
        tenantId,
        count: result.data?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get patients', {
        operation: 'getPatients',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async getPatient(tenantId: number, patientId: number): Promise<PatientResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<PatientResponse | { data: PatientResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/patients/${patientId}`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      const patient = unwrapResponse(result);

      logger.info('Got patient', {
        operation: 'getPatient',
        tenantId,
        patientId,
        duration: Date.now() - startTime,
      });

      return patient;
    } catch (error) {
      logger.error('Failed to get patient', {
        operation: 'getPatient',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async createPatient(tenantId: number, data: PatientData): Promise<PatientResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<PatientResponse | { data: PatientResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/patients`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          timeout: 10000,
          dedupe: true,
        }
      );

      const patient = unwrapResponse(result);

      logger.info('Patient created', {
        operation: 'createPatient',
        tenantId,
        patientId: patient.id,
        duration: Date.now() - startTime,
      });

      return patient;
    } catch (error) {
      logger.error('Failed to create patient', {
        operation: 'createPatient',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async updatePatient(tenantId: number, patientId: number, data: Partial<PatientData>): Promise<PatientResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<PatientResponse | { data: PatientResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/patients/${patientId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data),
          timeout: 10000,
        }
      );

      const patient = unwrapResponse(result);

      logger.info('Patient updated', {
        operation: 'updatePatient',
        tenantId,
        patientId,
        duration: Date.now() - startTime,
      });

      return patient;
    } catch (error) {
      logger.error('Failed to update patient', {
        operation: 'updatePatient',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  // ==================== APPOINTMENT METHODS ====================

  async getAppointments(tenantId: number, filters?: AppointmentFilters): Promise<{ data: AppointmentResponse[] }> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      let url = `${this.config.baseUrl}/api/tenants/${tenantId}/appointments`;
      if (filters) {
        const params = new URLSearchParams();
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (params.toString()) url += `?${params.toString()}`;
      }

      const result = await this.requestManager.fetch<{ data: AppointmentResponse[] }>(
        url,
        {
          method: 'GET',
          headers,
          timeout: 10000,
          dedupe: true, // Avoid duplicate concurrent requests
        }
      );

      logger.info('Got appointments', {
        operation: 'getAppointments',
        tenantId,
        count: result.data?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get appointments', {
        operation: 'getAppointments',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async getAppointment(tenantId: number, appointmentId: number): Promise<AppointmentResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<AppointmentResponse | { data: AppointmentResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/appointments/${appointmentId}`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      const appointment = unwrapResponse(result);

      logger.info('Got appointment', {
        operation: 'getAppointment',
        tenantId,
        appointmentId,
        duration: Date.now() - startTime,
      });

      return appointment;
    } catch (error) {
      logger.error('Failed to get appointment', {
        operation: 'getAppointment',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async createAppointment(tenantId: number, data: AppointmentData): Promise<AppointmentResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<AppointmentResponse | { data: AppointmentResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/appointments`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          timeout: 10000,
          dedupe: true,
        }
      );

      const appointment = unwrapResponse(result);

      logger.info('Appointment created', {
        operation: 'createAppointment',
        tenantId,
        appointmentId: appointment.id,
        duration: Date.now() - startTime,
      });

      return appointment;
    } catch (error) {
      logger.error('Failed to create appointment', {
        operation: 'createAppointment',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async cancelAppointment(tenantId: number, appointmentId: number): Promise<AppointmentResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<AppointmentResponse | { data: AppointmentResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/appointments/${appointmentId}/cancel`,
        {
          method: 'POST',
          headers,
          timeout: 10000,
        }
      );

      const appointment = unwrapResponse(result);

      logger.info('Appointment cancelled', {
        operation: 'cancelAppointment',
        tenantId,
        appointmentId,
        duration: Date.now() - startTime,
      });

      return appointment;
    } catch (error) {
      logger.error('Failed to cancel appointment', {
        operation: 'cancelAppointment',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  // ==================== VITAL SIGNS METHODS ====================

  async getVitalSigns(tenantId: number, appointmentId: number): Promise<{ data: VitalSignResponse[] }> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<{ data: VitalSignResponse[] }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/appointments/${appointmentId}/vital-signs`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      logger.info('Got vital signs', {
        operation: 'getVitalSigns',
        tenantId,
        appointmentId,
        count: result.data?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get vital signs', {
        operation: 'getVitalSigns',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async createVitalSign(tenantId: number, appointmentId: number, data: VitalSignData): Promise<VitalSignResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<VitalSignResponse | { data: VitalSignResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/appointments/${appointmentId}/vital-signs`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          timeout: 10000,
          dedupe: true,
        }
      );

      const vitalSign = unwrapResponse(result);

      logger.info('Vital sign created', {
        operation: 'createVitalSign',
        tenantId,
        appointmentId,
        vitalSignId: vitalSign.id,
        duration: Date.now() - startTime,
      });

      return vitalSign;
    } catch (error) {
      logger.error('Failed to create vital sign', {
        operation: 'createVitalSign',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async getVitalSignTypes(): Promise<{ data: VitalSignTypeResponse[] }> {
    const startTime = Date.now();

    try {
      const result = await this.requestManager.fetch<{ data: VitalSignTypeResponse[] }>(
        `${this.config.baseUrl}/api/vital-sign-types`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      logger.info('Got vital sign types', {
        operation: 'getVitalSignTypes',
        count: result.data?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get vital sign types', {
        operation: 'getVitalSignTypes',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  // ==================== PRESCRIPTION METHODS ====================

  async getPrescriptions(tenantId: number, appointmentId: number): Promise<{ data: PrescriptionResponse[] }> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<{ data: PrescriptionResponse[] }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/appointments/${appointmentId}/prescriptions`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      logger.info('Got prescriptions', {
        operation: 'getPrescriptions',
        tenantId,
        appointmentId,
        count: result.data?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get prescriptions', {
        operation: 'getPrescriptions',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async createPrescription(tenantId: number, appointmentId: number, data: PrescriptionData): Promise<PrescriptionResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<PrescriptionResponse | { data: PrescriptionResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/appointments/${appointmentId}/prescriptions`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          timeout: 10000,
          dedupe: true,
        }
      );

      const prescription = unwrapResponse(result);

      logger.info('Prescription created', {
        operation: 'createPrescription',
        tenantId,
        appointmentId,
        prescriptionId: prescription.id,
        duration: Date.now() - startTime,
      });

      return prescription;
    } catch (error) {
      logger.error('Failed to create prescription', {
        operation: 'createPrescription',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  // ==================== TEST REQUEST METHODS ====================

  async getTestRequests(tenantId: number, appointmentId: number): Promise<{ data: TestRequestResponse[] }> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<{ data: TestRequestResponse[] }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/appointments/${appointmentId}/test-requests`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      logger.info('Got test requests', {
        operation: 'getTestRequests',
        tenantId,
        appointmentId,
        count: result.data?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get test requests', {
        operation: 'getTestRequests',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async createTestRequest(tenantId: number, appointmentId: number, data: TestRequestData): Promise<TestRequestResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<TestRequestResponse | { data: TestRequestResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/appointments/${appointmentId}/test-requests`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          timeout: 10000,
          dedupe: true,
        }
      );

      const testRequest = unwrapResponse(result);

      logger.info('Test request created', {
        operation: 'createTestRequest',
        tenantId,
        appointmentId,
        testRequestId: testRequest.id,
        duration: Date.now() - startTime,
      });

      return testRequest;
    } catch (error) {
      logger.error('Failed to create test request', {
        operation: 'createTestRequest',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  // ==================== CHAT METHODS ====================

  async getConversations(tenantId: number): Promise<{ conversations: ChatConversation[] }> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<{ conversations: ChatConversation[] }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/chat/conversations`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      logger.info('Got conversations', {
        operation: 'getConversations',
        tenantId,
        count: result.conversations?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get conversations', {
        operation: 'getConversations',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async getMessages(tenantId: number, phoneNumber: string, limit = 50, page = 1): Promise<{ messages: ChatMessage[] }> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
      });

      const result = await this.requestManager.fetch<{ messages: ChatMessage[] }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/chat/conversations/${phoneNumber}/messages?${params.toString()}`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      logger.info('Got messages', {
        operation: 'getMessages',
        tenantId,
        phoneNumber,
        count: result.messages?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get messages', {
        operation: 'getMessages',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async sendMessage(tenantId: number, data: SendMessageData): Promise<SendMessageResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<SendMessageResponse>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/chat/send`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          timeout: 10000,
          dedupe: true,
        }
      );

      logger.info('Message sent', {
        operation: 'sendMessage',
        tenantId,
        messageId: result.message_id,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to send message', {
        operation: 'sendMessage',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  // ==================== USER MANAGEMENT METHODS ====================

  async listUsers(tenantId: number): Promise<{ data: UserResponse[] }> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<{ data: UserResponse[] }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/users`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      logger.info('Got users', {
        operation: 'listUsers',
        tenantId,
        count: result.data?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to list users', {
        operation: 'listUsers',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async getUser(tenantId: number, userId: number): Promise<UserResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<UserResponse | { data: UserResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/users/${userId}`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      const user = unwrapResponse(result);

      logger.info('Got user', {
        operation: 'getUser',
        tenantId,
        userId,
        duration: Date.now() - startTime,
      });

      return user;
    } catch (error) {
      logger.error('Failed to get user', {
        operation: 'getUser',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async updateUser(tenantId: number, userId: number, data: UpdateUserData): Promise<UserResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<UserResponse | { data: UserResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/users/${userId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data),
          timeout: 10000,
          dedupe: true,
        }
      );

      const user = unwrapResponse(result);

      logger.info('User updated', {
        operation: 'updateUser',
        tenantId,
        userId,
        duration: Date.now() - startTime,
      });

      return user;
    } catch (error) {
      logger.error('Failed to update user', {
        operation: 'updateUser',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  // ==================== SPECIALTY METHODS ====================

  async getSpecialties(): Promise<{ data: SpecialtyResponse[] }> {
    const startTime = Date.now();

    try {
      const result = await this.requestManager.fetch<{ data: SpecialtyResponse[] }>(
        `${this.config.baseUrl}/api/specialties`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      logger.info('Got specialties', {
        operation: 'getSpecialties',
        count: result.data?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get specialties', {
        operation: 'getSpecialties',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  // ==================== PAYMENT METHOD METHODS ====================

  async getPaymentMethods(): Promise<{ data: PaymentMethodResponse[] }> {
    const startTime = Date.now();

    try {
      const result = await this.requestManager.fetch<{ data: PaymentMethodResponse[] }>(
        `${this.config.baseUrl}/api/payment-methods`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      logger.info('Got payment methods', {
        operation: 'getPaymentMethods',
        count: result.data?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get payment methods', {
        operation: 'getPaymentMethods',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  // ==================== TENANT SCHEDULE METHODS ====================

  async upsertTenantSchedules(tenantId: number, schedules: TenantScheduleData[]): Promise<{ data: TenantScheduleResponse[] }> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<{ data: TenantScheduleResponse[] }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/schedules`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ schedules }),
          timeout: 10000,
          dedupe: true,
        }
      );

      logger.info('Tenant schedules upserted', {
        operation: 'upsertTenantSchedules',
        tenantId,
        count: result.data?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to upsert tenant schedules', {
        operation: 'upsertTenantSchedules',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async getTenantSchedules(tenantId: number): Promise<{ data: TenantScheduleResponse[] }> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<{ data: TenantScheduleResponse[] }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/schedules`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      logger.info('Got tenant schedules', {
        operation: 'getTenantSchedules',
        tenantId,
        count: result.data?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get tenant schedules', {
        operation: 'getTenantSchedules',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  // ==================== FAQ METHODS ====================

  async createFAQ(tenantId: number, data: FAQData): Promise<FAQResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<FAQResponse | { data: FAQResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/faqs`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          timeout: 10000,
          dedupe: true,
        }
      );

      const faq = unwrapResponse(result);

      logger.info('FAQ created', {
        operation: 'createFAQ',
        tenantId,
        faqId: faq.id,
        duration: Date.now() - startTime,
      });

      return faq;
    } catch (error) {
      logger.error('Failed to create FAQ', {
        operation: 'createFAQ',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async listFAQs(tenantId: number): Promise<{ data: FAQResponse[] }> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<{ data: FAQResponse[] }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/faqs`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      logger.info('Got FAQs', {
        operation: 'listFAQs',
        tenantId,
        count: result.data?.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Failed to list FAQs', {
        operation: 'listFAQs',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async getFAQ(tenantId: number, faqId: number): Promise<FAQResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<FAQResponse | { data: FAQResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/faqs/${faqId}`,
        {
          method: 'GET',
          headers,
          timeout: 10000,
        }
      );

      const faq = unwrapResponse(result);

      logger.info('Got FAQ', {
        operation: 'getFAQ',
        tenantId,
        faqId,
        duration: Date.now() - startTime,
      });

      return faq;
    } catch (error) {
      logger.error('Failed to get FAQ', {
        operation: 'getFAQ',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async updateFAQ(tenantId: number, faqId: number, data: Partial<FAQData>): Promise<FAQResponse> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      const result = await this.requestManager.fetch<FAQResponse | { data: FAQResponse }>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/faqs/${faqId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data),
          timeout: 10000,
          dedupe: true,
        }
      );

      const faq = unwrapResponse(result);

      logger.info('FAQ updated', {
        operation: 'updateFAQ',
        tenantId,
        faqId,
        duration: Date.now() - startTime,
      });

      return faq;
    } catch (error) {
      logger.error('Failed to update FAQ', {
        operation: 'updateFAQ',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }

  async deleteFAQ(tenantId: number, faqId: number): Promise<void> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      await this.requestManager.fetch<void>(
        `${this.config.baseUrl}/api/tenants/${tenantId}/faqs/${faqId}`,
        {
          method: 'DELETE',
          headers,
          timeout: 10000,
          dedupe: true,
        }
      );

      logger.info('FAQ deleted', {
        operation: 'deleteFAQ',
        tenantId,
        faqId,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      logger.error('Failed to delete FAQ', {
        operation: 'deleteFAQ',
        error,
        duration: Date.now() - startTime,
      });
      this.handleNetworkError(error);
    }
  }
}
