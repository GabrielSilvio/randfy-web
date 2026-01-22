'use client';

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, StateResponse, ServiceResponse, TenantResponse, UserResponse, SpecialtyResponse, TenantScheduleData, TenantScheduleResponse } from '@/lib/api';
import { validateData, createTenantSchema, createServiceSchema } from '@/lib/validators/schemas';
import { logger } from '@/lib/utils/logger';

// ==================== TYPES ====================

type Step = 'clinic' | 'professionals' | 'schedules' | 'services' | 'whatsapp';
type StepStatus = 'completed' | 'current' | 'upcoming';

interface TenantFormData {
  name: string;
  address_1: string;
  number: string;
  neighborhood: string;
  city: string;
  state_id: number;
  postal_code: string;
  phone_number: string;
  assistant_name: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  requires_deposit: boolean;
  deposit_cents: number;
}

// ==================== CONSTANTS ====================

const DEFAULT_ASSISTANT_NAME = 'Luna';
const DEFAULT_DURATION_MINUTES = 30;
const DEFAULT_PRICE_CENTS = 10000;
const ERROR_DISPLAY_DURATION_MS = 5000;

const STEPS: { id: Step; title: string; description: string }[] = [
  { id: 'clinic', title: 'Dados da Clínica', description: 'Informações básicas' },
  { id: 'professionals', title: 'Profissionais', description: 'Cadastre sua equipe' },
  { id: 'schedules', title: 'Horários', description: 'Defina o expediente' },
  { id: 'services', title: 'Serviços', description: 'Configure seus serviços' },
  { id: 'whatsapp', title: 'WhatsApp', description: 'Conecte seu número' },
];

const WHATSAPP_INSTRUCTIONS = [
  'Abra o WhatsApp Business no seu celular',
  'Vá em Configurações → Dispositivos conectados',
  'Toque em "Conectar um dispositivo"',
  'Escaneie o QR Code acima',
];

const INITIAL_TENANT_FORM: TenantFormData = {
  name: '',
  address_1: '',
  number: '',
  neighborhood: '',
  city: '',
  state_id: 0,
  postal_code: '',
  phone_number: '',
  assistant_name: DEFAULT_ASSISTANT_NAME,
};

const INITIAL_SERVICE_FORM: ServiceFormData = {
  name: '',
  description: '',
  duration_minutes: DEFAULT_DURATION_MINUTES,
  price_cents: DEFAULT_PRICE_CENTS,
  requires_deposit: false,
  deposit_cents: 0,
};

// ==================== HELPER FUNCTIONS ====================

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getStepIndex(stepId: Step): number {
  return STEPS.findIndex(s => s.id === stepId);
}

function formatTime(hhmm: number): string {
  if (hhmm === 0) return '';
  const hours = Math.floor(hhmm / 100);
  const minutes = hhmm % 100;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function parseTime(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 100 + minutes;
}

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// ==================== COMPONENT ====================

export default function OnboardingPage() {
  const router = useRouter();

  // UI state
  const [currentStep, setCurrentStep] = useState<Step>('clinic');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Tenant state
  const tenantIdRef = useRef<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [states, setStates] = useState<StateResponse[]>([]);
  const [tenantForm, setTenantForm] = useState<TenantFormData>(INITIAL_TENANT_FORM);

  // Professionals state
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyResponse[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    phone_number: '',
    crm: '',
    active: true,
  });

  // Schedules state
  const [schedules, setSchedules] = useState<TenantScheduleData[]>([
    { day_of_week: 0, start_time: 0, end_time: 0 }, // Sunday
    { day_of_week: 1, start_time: 900, end_time: 1800 }, // Monday
    { day_of_week: 2, start_time: 900, end_time: 1800 }, // Tuesday
    { day_of_week: 3, start_time: 900, end_time: 1800 }, // Wednesday
    { day_of_week: 4, start_time: 900, end_time: 1800 }, // Thursday
    { day_of_week: 5, start_time: 900, end_time: 1800 }, // Friday
    { day_of_week: 6, start_time: 0, end_time: 0 }, // Saturday
  ]);
  const [activeDay, setActiveDay] = useState<boolean[]>([false, true, true, true, true, true, false]);

  // Services state
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [serviceForm, setServiceForm] = useState<ServiceFormData>(INITIAL_SERVICE_FORM);

  // QR Code state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // ==================== CALLBACKS ====================

  const updateTenantId = useCallback((id: number | null) => {
    tenantIdRef.current = id;
  }, []);

  const populateTenantForm = useCallback((tenant: TenantResponse) => {
    const formData: TenantFormData = {
      name: tenant.name || '',
      address_1: tenant.address_1 || '',
      number: tenant.number || '',
      neighborhood: tenant.neighborhood || '',
      city: tenant.city || '',
      state_id: tenant.state_id || 0,
      postal_code: tenant.postal_code || '',
      phone_number: tenant.phone_number || '',
      assistant_name: tenant.assistant_name || DEFAULT_ASSISTANT_NAME,
    };
    setTenantForm(formData);
  }, []);

  const loadQRCode = useCallback(async () => {
    const currentTenantId = tenantIdRef.current;
    if (!currentTenantId) return;

    setQrLoading(true);
    try {
      const qrResponse = await apiClient.getQRCode(currentTenantId);
      setQrCode(qrResponse.base64 || qrResponse.qrcode);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar QR Code.';
      setError(message);
    } finally {
      setQrLoading(false);
    }
  }, []);

  const loadProfessionalsData = useCallback(async () => {
    const currentTenantId = tenantIdRef.current;
    if (!currentTenantId) return;

    try {
      const [usersResponse, specialtiesResponse] = await Promise.all([
        apiClient.listUsers(currentTenantId),
        apiClient.getSpecialties(),
      ]);
      setUsers(usersResponse.data || []);
      setSpecialties(specialtiesResponse.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar profissionais.';
      setError(message);
    }
  }, []);

  const loadSchedulesData = useCallback(async () => {
    const currentTenantId = tenantIdRef.current;
    if (!currentTenantId) return;

    try {
      const response = await apiClient.getTenantSchedules(currentTenantId);
      if (response.data && response.data.length > 0) {
        const loadedSchedules = [...schedules];
        const loadedActive = [...activeDay];
        
        response.data.forEach(schedule => {
          loadedSchedules[schedule.day_of_week] = {
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
          };
          loadedActive[schedule.day_of_week] = schedule.start_time > 0 || schedule.end_time > 0;
        });
        
        setSchedules(loadedSchedules);
        setActiveDay(loadedActive);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar horários.';
      setError(message);
    }
  }, [schedules, activeDay]);

  const handleSaveSchedules = useCallback(async () => {
    const currentTenantId = tenantIdRef.current;
    if (!currentTenantId) return;

    setIsLoading(true);
    try {
      const schedulesToSave = schedules.filter((_, idx) => activeDay[idx]);
      await apiClient.upsertTenantSchedules(currentTenantId, schedulesToSave);
      setCurrentStep('services');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar horários.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [schedules, activeDay]);

  const getStepStatus = useCallback((stepId: Step): StepStatus => {
    const stepIndex = getStepIndex(stepId);
    const currentIndex = getStepIndex(currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  }, [currentStep]);

  const goToStep = useCallback((step: Step) => {
    if ((step === 'professionals' || step === 'schedules' || step === 'services') && !tenantIdRef.current) {
      setError('Complete os dados da clínica primeiro');
      return;
    }
    
    if (step === 'professionals') {
      loadProfessionalsData();
    }
    
    if (step === 'schedules') {
      loadSchedulesData();
    }
    
    if (step === 'whatsapp') {
      if (!tenantIdRef.current) {
        setError('Complete os dados da clínica primeiro');
        return;
      }
      if (services.length === 0) {
        setError('Adicione pelo menos um serviço');
        return;
      }
      loadQRCode();
    }
    setCurrentStep(step);
  }, [services.length, loadQRCode, loadProfessionalsData, loadSchedulesData]);

  const handlePriceChange = useCallback((value: string, field: 'price_cents' | 'deposit_cents') => {
    const numericValue = value.replace(/\D/g, '');
    setServiceForm(prev => ({ ...prev, [field]: Number(numericValue) }));
  }, []);

  // ==================== EFFECTS ====================

  // Mark client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-dismiss error after timeout
  useEffect(() => {
    if (!error) return;
    
    const timer = setTimeout(() => setError(''), ERROR_DISPLAY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [error]);

  // Load initial data on mount
  useEffect(() => {
    if (!isClient) return;

    const init = async () => {
      setIsInitialLoading(true);
      try {
        const isAuthenticated = await apiClient.isAuthenticated();
        if (!isAuthenticated) {
          router.push('/login');
          return;
        }

        // Load states list
        const statesResponse = await apiClient.getStates();
        setStates(statesResponse.data || []);

        // Get current user and check for existing tenant
        const userData = await apiClient.getCurrentUser();
        const existingTenantId = userData.tenant?.id || userData.user?.tenant_id;

        if (existingTenantId && existingTenantId > 0) {
          updateTenantId(existingTenantId);
          setIsEditMode(true);

          try {
            // Load existing tenant data
            const tenantData = await apiClient.getTenant(existingTenantId);
            populateTenantForm(tenantData);

            // Load existing services
            const servicesResponse = await apiClient.getServices(existingTenantId);
            setServices(servicesResponse.data || []);
          } catch (tenantError) {
            logger.error('Failed to load tenant data', { error: tenantError });
            // Fallback to user.tenant if available
            if (userData.tenant) {
              populateTenantForm(userData.tenant);
            }
          }
        }
      } catch (err) {
        logger.error('Failed to initialize onboarding', { error: err });
        setError('Erro ao carregar dados. Tente novamente.');
      } finally {
        setIsInitialLoading(false);
      }
    };

    init();
  }, [isClient, router, updateTenantId, populateTenantForm]);

  // ==================== FORM HANDLERS ====================

  const handleTenantSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const validation = validateData(createTenantSchema, {
      ...tenantForm,
      state_id: Number(tenantForm.state_id),
    });

    if (!validation.success) {
      setError(Object.values(validation.errors)[0] || 'Verifique os dados');
      return;
    }

    setIsLoading(true);

    try {
      const currentTenantId = tenantIdRef.current;

      if (isEditMode && currentTenantId) {
        await apiClient.updateTenant(currentTenantId, validation.data);
      } else {
        const tenant = await apiClient.createTenant(validation.data);
        updateTenantId(tenant.id);
        setIsEditMode(true);
      }

      setCurrentStep('professionals');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const currentTenantId = tenantIdRef.current;
    if (!currentTenantId) {
      setError('Erro: Clínica não encontrada. Volte ao passo anterior.');
      return;
    }

    const validation = validateData(createServiceSchema, {
      ...serviceForm,
      duration_minutes: Number(serviceForm.duration_minutes),
      price_cents: Math.round(Number(serviceForm.price_cents)),
      deposit_cents: serviceForm.requires_deposit 
        ? Math.round(Number(serviceForm.deposit_cents)) 
        : 0,
    });

    if (!validation.success) {
      setError(Object.values(validation.errors)[0] || 'Verifique os dados');
      return;
    }

    setIsLoading(true);

    try {
      const service = await apiClient.createService(currentTenantId, validation.data);
      setServices(prev => [...prev, service]);
      setServiceForm(INITIAL_SERVICE_FORM);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar serviço.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== RENDER ====================

  if (!isClient) return null;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold">R</span>
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Randfy
            </span>
          </div>
          <div className="text-sm text-slate-500">
            Configuração inicial
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Steps Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {STEPS.map((step, index) => {
                const status = getStepStatus(step.id);
                return (
                  <button
                    key={step.id}
                    onClick={() => status === 'completed' && goToStep(step.id)}
                    disabled={status === 'upcoming'}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      status === 'current'
                        ? 'bg-primary/10 border-2 border-primary'
                        : status === 'completed'
                        ? 'bg-white border border-slate-200 hover:border-slate-300 cursor-pointer'
                        : 'bg-slate-100 border border-transparent cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                        status === 'current'
                          ? 'bg-primary text-white'
                          : status === 'completed'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-300 text-slate-600'
                      }`}>
                        {status === 'completed' ? (
                          <CheckIcon className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${status === 'current' ? 'text-primary' : 'text-slate-900'}`}>
                          {step.title}
                        </p>
                        <p className="text-sm text-slate-500">{step.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Help Card */}
            <div className="mt-6 p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-sm font-medium text-slate-900 mb-1">Precisa de ajuda?</p>
              <p className="text-sm text-slate-500">
                Entre em contato com nosso suporte para tirar dúvidas.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              {/* Step 1: Clinic */}
              {currentStep === 'clinic' && (
                <ClinicStep
                  isEditMode={isEditMode}
                  tenantForm={tenantForm}
                  setTenantForm={setTenantForm}
                  states={states}
                  isLoading={isLoading}
                  onSubmit={handleTenantSubmit}
                />
              )}

              {/* Step 2: Professionals */}
              {currentStep === 'professionals' && (
                <ProfessionalsStep
                  users={users}
                  specialties={specialties}
                  editingUserId={editingUserId}
                  setEditingUserId={setEditingUserId}
                  editUserForm={editUserForm}
                  setEditUserForm={setEditUserForm}
                  isLoading={isLoading}
                  onLoadData={loadProfessionalsData}
                  onBack={() => setCurrentStep('clinic')}
                  onContinue={() => goToStep('schedules')}
                />
              )}

              {/* Step 3: Schedules */}
              {currentStep === 'schedules' && (
                <SchedulesStep
                  schedules={schedules}
                  setSchedules={setSchedules}
                  activeDay={activeDay}
                  setActiveDay={setActiveDay}
                  isLoading={isLoading}
                  onLoadData={loadSchedulesData}
                  onSave={handleSaveSchedules}
                  onBack={() => setCurrentStep('professionals')}
                />
              )}

              {/* Step 4: Services */}
              {currentStep === 'services' && (
                <ServicesStep
                  services={services}
                  serviceForm={serviceForm}
                  setServiceForm={setServiceForm}
                  isLoading={isLoading}
                  onSubmit={handleServiceSubmit}
                  onPriceChange={handlePriceChange}
                  onBack={() => setCurrentStep('schedules')}
                  onContinue={() => goToStep('whatsapp')}
                />
              )}

              {/* Step 3: WhatsApp */}
              {currentStep === 'whatsapp' && (
                <WhatsAppStep
                  qrCode={qrCode}
                  qrLoading={qrLoading}
                  onLoadQRCode={loadQRCode}
                  onBack={() => setCurrentStep('services')}
                  onComplete={() => router.push('/dashboard')}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <ErrorToast message={error} onDismiss={() => setError('')} />
      )}
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function QRCodePlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <div className={`border-2 border-current border-t-transparent rounded-full animate-spin ${className}`} />
  );
}

interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
}

function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
        <AlertIcon className="w-5 h-5 shrink-0" />
        <p className="text-sm">{message}</p>
        <button onClick={onDismiss} className="text-white/80 hover:text-white ml-2">
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface ClinicStepProps {
  isEditMode: boolean;
  tenantForm: TenantFormData;
  setTenantForm: React.Dispatch<React.SetStateAction<TenantFormData>>;
  states: StateResponse[];
  isLoading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

function ClinicStep({ isEditMode, tenantForm, setTenantForm, states, isLoading, onSubmit }: ClinicStepProps) {
  const updateField = (field: keyof TenantFormData, value: string | number) => {
    setTenantForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          {isEditMode ? 'Atualize os dados da clínica' : 'Configure sua clínica'}
        </h1>
        <p className="text-slate-500 mt-1">
          Essas informações serão usadas pelo assistente de IA para atender seus pacientes.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <FormField label="Nome da Clínica" required>
          <input
            type="text"
            value={tenantForm.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="Ex: Clínica Saúde Total"
            required
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <FormField label="Endereço">
              <input
                type="text"
                value={tenantForm.address_1}
                onChange={(e) => updateField('address_1', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Rua, Avenida..."
              />
            </FormField>
          </div>
          <FormField label="Número">
            <input
              type="text"
              value={tenantForm.number}
              onChange={(e) => updateField('number', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="123"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Bairro">
            <input
              type="text"
              value={tenantForm.neighborhood}
              onChange={(e) => updateField('neighborhood', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="Centro"
            />
          </FormField>
          <FormField label="Cidade" required>
            <input
              type="text"
              value={tenantForm.city}
              onChange={(e) => updateField('city', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="São Paulo"
              required
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Estado" required>
            <select
              value={tenantForm.state_id}
              onChange={(e) => updateField('state_id', Number(e.target.value))}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
              required
            >
              <option value={0}>Selecione...</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name} ({state.code})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="CEP">
            <input
              type="text"
              value={tenantForm.postal_code}
              onChange={(e) => updateField('postal_code', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="01234-567"
            />
          </FormField>
        </div>

        <FormField label="Telefone">
          <input
            type="tel"
            value={tenantForm.phone_number}
            onChange={(e) => updateField('phone_number', e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="+55 11 99999-9999"
          />
        </FormField>

        <FormField label="Nome do Assistente IA" hint="Este nome será usado pelo assistente ao interagir com pacientes no WhatsApp.">
          <input
            type="text"
            value={tenantForm.assistant_name}
            onChange={(e) => updateField('assistant_name', e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder="Luna"
          />
        </FormField>

        <div className="pt-4 flex justify-end">
          <SubmitButton isLoading={isLoading} loadingText="Salvando...">
            Continuar
            <ChevronRightIcon className="w-4 h-4" />
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}

interface ServicesStepProps {
  services: ServiceResponse[];
  serviceForm: ServiceFormData;
  setServiceForm: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  isLoading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onPriceChange: (value: string, field: 'price_cents' | 'deposit_cents') => void;
  onBack: () => void;
  onContinue: () => void;
}

function ServicesStep({ 
  services, 
  serviceForm, 
  setServiceForm, 
  isLoading, 
  onSubmit, 
  onPriceChange, 
  onBack, 
  onContinue 
}: ServicesStepProps) {
  const updateField = (field: keyof ServiceFormData, value: string | number | boolean) => {
    setServiceForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Configure seus serviços</h1>
        <p className="text-slate-500 mt-1">
          Adicione os serviços que sua clínica oferece. Pacientes poderão agendar esses serviços.
        </p>
      </div>

      {/* Existing Services List */}
      {services.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            Serviços cadastrados ({services.length})
          </h3>
          <div className="space-y-2">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
              >
                <div>
                  <p className="font-medium text-slate-900">{service.name}</p>
                  <p className="text-sm text-slate-500">
                    {service.duration_minutes} min • {formatPrice(service.price_cents)}
                  </p>
                </div>
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Service Form */}
      <div className="border border-slate-200 rounded-xl p-6">
        <h3 className="font-medium text-slate-900 mb-4">Adicionar novo serviço</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="Nome do Serviço" required>
            <input
              type="text"
              value={serviceForm.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="Ex: Consulta Geral"
              required
            />
          </FormField>

          <FormField label="Descrição">
            <textarea
              value={serviceForm.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              rows={2}
              placeholder="Descrição opcional do serviço..."
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Duração (min)" required>
              <input
                type="number"
                value={serviceForm.duration_minutes}
                onChange={(e) => updateField('duration_minutes', Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                min={5}
                max={480}
                required
              />
            </FormField>
            <FormField label="Preço" required>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                <input
                  type="text"
                  value={(serviceForm.price_cents / 100).toFixed(2)}
                  onChange={(e) => onPriceChange(e.target.value.replace('.', '').replace(',', ''), 'price_cents')}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  required
                />
              </div>
            </FormField>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input
              type="checkbox"
              id="requires_deposit"
              checked={serviceForm.requires_deposit}
              onChange={(e) => updateField('requires_deposit', e.target.checked)}
              className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
            />
            <label htmlFor="requires_deposit" className="text-sm text-slate-700">
              Exigir sinal para agendamento
            </label>
          </div>

          {serviceForm.requires_deposit && (
            <FormField label="Valor do Sinal">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                <input
                  type="text"
                  value={(serviceForm.deposit_cents / 100).toFixed(2)}
                  onChange={(e) => onPriceChange(e.target.value.replace('.', '').replace(',', ''), 'deposit_cents')}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </FormField>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-600 font-medium rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Spinner className="w-4 h-4" />
                Adicionando...
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5" />
                Adicionar Serviço
              </>
            )}
          </button>
        </form>
      </div>

      <div className="pt-6 flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={onContinue}
          disabled={services.length === 0}
          className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continuar
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
      {services.length === 0 && (
        <p className="text-center text-sm text-slate-500 mt-2">
          Adicione pelo menos um serviço para continuar
        </p>
      )}
    </div>
  );
}

interface ProfessionalsStepProps {
  users: UserResponse[];
  specialties: SpecialtyResponse[];
  editingUserId: number | null;
  setEditingUserId: (id: number | null) => void;
  editUserForm: {
    name: string;
    phone_number: string;
    crm: string;
    active: boolean;
  };
  setEditUserForm: React.Dispatch<React.SetStateAction<{
    name: string;
    phone_number: string;
    crm: string;
    active: boolean;
  }>>;
  isLoading: boolean;
  onLoadData: () => void;
  onBack: () => void;
  onContinue: () => void;
}

function ProfessionalsStep({ 
  users, 
  specialties, 
  editingUserId, 
  setEditingUserId,
  editUserForm,
  setEditUserForm,
  isLoading, 
  onLoadData, 
  onBack, 
  onContinue 
}: ProfessionalsStepProps) {
  const [hasLoadedData, setHasLoadedData] = useState(false);

  useEffect(() => {
    if (!hasLoadedData) {
      onLoadData();
      setHasLoadedData(true);
    }
  }, [hasLoadedData, onLoadData]);

  const handleEditUser = (user: UserResponse) => {
    setEditingUserId(user.id);
    setEditUserForm({
      name: user.name,
      phone_number: user.phone_number || '',
      crm: user.crm || '',
      active: user.active,
    });
  };

  const handleSaveUser = async () => {
    if (!editingUserId) return;
    // This will be handled via API in the real implementation
    setEditingUserId(null);
    onLoadData();
  };

  const activeUsers = users.filter(u => u.active);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Profissionais</h1>
        <p className="text-slate-500 mt-1">
          Revise e atualize as informações dos profissionais da sua clínica.
        </p>
      </div>

      {users.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-slate-500">Carregando profissionais...</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {users.map((user) => (
            <div 
              key={user.id} 
              className="border border-slate-200 rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full size-12 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{user.name}</h3>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    {user.phone_number && (
                      <p className="text-sm text-slate-600 mt-1">📞 {user.phone_number}</p>
                    )}
                    {user.crm && (
                      <p className="text-sm text-slate-600">CRM: {user.crm}</p>
                    )}
                    <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${
                      user.active 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleEditUser(user)}
                  className="text-primary hover:text-primary-dark text-sm font-medium"
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-6 flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={onContinue}
          disabled={activeUsers.length === 0}
          className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continuar
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
      {activeUsers.length === 0 && users.length > 0 && (
        <p className="text-center text-sm text-slate-500 mt-2">
          Ative pelo menos um profissional para continuar
        </p>
      )}
    </div>
  );
}

interface SchedulesStepProps {
  schedules: TenantScheduleData[];
  setSchedules: React.Dispatch<React.SetStateAction<TenantScheduleData[]>>;
  activeDay: boolean[];
  setActiveDay: React.Dispatch<React.SetStateAction<boolean[]>>;
  isLoading: boolean;
  onLoadData: () => void;
  onSave: () => void;
  onBack: () => void;
}

function SchedulesStep({ 
  schedules, 
  setSchedules, 
  activeDay, 
  setActiveDay, 
  isLoading, 
  onLoadData, 
  onSave, 
  onBack 
}: SchedulesStepProps) {
  const [hasLoadedData, setHasLoadedData] = useState(false);

  useEffect(() => {
    if (!hasLoadedData) {
      onLoadData();
      setHasLoadedData(true);
    }
  }, [hasLoadedData, onLoadData]);

  const handleDayToggle = (dayIndex: number) => {
    const newActive = [...activeDay];
    newActive[dayIndex] = !newActive[dayIndex];
    setActiveDay(newActive);
  };

  const handleTimeChange = (dayIndex: number, field: 'start_time' | 'end_time', value: string) => {
    const newSchedules = [...schedules];
    newSchedules[dayIndex] = {
      ...newSchedules[dayIndex],
      [field]: parseTime(value),
    };
    setSchedules(newSchedules);
  };

  const hasAtLeastOneActiveDay = activeDay.some(active => active);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Horários de Funcionamento</h1>
        <p className="text-slate-500 mt-1">
          Defina os dias e horários em que sua clínica atende.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {DAYS_OF_WEEK.map((dayName, index) => (
          <div key={index} className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={activeDay[index]}
                onChange={() => handleDayToggle(index)}
                className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary"
              />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <span className="font-medium text-slate-900">{dayName}</span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 w-16">Início:</label>
                  <input
                    type="time"
                    value={formatTime(schedules[index].start_time)}
                    onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                    disabled={!activeDay[index]}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 w-16">Fim:</label>
                  <input
                    type="time"
                    value={formatTime(schedules[index].end_time)}
                    onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                    disabled={!activeDay[index]}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={onSave}
          disabled={!hasAtLeastOneActiveDay || isLoading}
          className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Spinner className="w-4 h-4" />
              Salvando...
            </>
          ) : (
            <>
              Continuar
              <ChevronRightIcon className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
      {!hasAtLeastOneActiveDay && (
        <p className="text-center text-sm text-slate-500 mt-2">
          Ative pelo menos um dia para continuar
        </p>
      )}
    </div>
  );
}

interface WhatsAppStepProps {
  qrCode: string | null;
  qrLoading: boolean;
  onLoadQRCode: () => void;
  onBack: () => void;
  onComplete: () => void;
}

function WhatsAppStep({ qrCode, qrLoading, onLoadQRCode, onBack, onComplete }: WhatsAppStepProps) {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Conecte o WhatsApp</h1>
        <p className="text-slate-500 mt-1">
          Escaneie o QR Code para conectar seu WhatsApp Business ao assistente.
        </p>
      </div>

      <div className="flex flex-col items-center py-8">
        {qrLoading ? (
          <div className="w-64 h-64 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Spinner className="w-8 h-8 border-primary" />
          </div>
        ) : qrCode ? (
          <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
            <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
          </div>
        ) : (
          <div className="w-64 h-64 bg-slate-100 rounded-2xl flex flex-col items-center justify-center gap-4">
            <QRCodePlaceholderIcon className="w-16 h-16 text-slate-400" />
            <button
              onClick={onLoadQRCode}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Gerar QR Code
            </button>
          </div>
        )}

        <button
          onClick={onLoadQRCode}
          disabled={qrLoading}
          className="mt-4 text-sm text-primary hover:underline disabled:opacity-50"
        >
          Atualizar QR Code
        </button>
      </div>

      <div className="bg-slate-50 rounded-xl p-6 mb-8">
        <h3 className="font-medium text-slate-900 mb-4">Como conectar:</h3>
        <ol className="space-y-3">
          {WHATSAPP_INSTRUCTIONS.map((instruction, index) => (
            <li key={index} className="flex items-start gap-3 text-slate-600">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                {index + 1}
              </span>
              {instruction}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          Concluir Configuração
          <CheckIcon className="w-4 h-4" />
        </button>
      </div>
      <p className="text-center text-sm text-slate-500 mt-4">
        Você pode pular esta etapa e conectar depois nas configurações
      </p>
    </div>
  );
}

// ==================== REUSABLE FORM COMPONENTS ====================

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

function FormField({ label, required, hint, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-sm text-slate-500 mt-2">{hint}</p>}
    </div>
  );
}

interface SubmitButtonProps {
  isLoading: boolean;
  loadingText: string;
  children: React.ReactNode;
}

function SubmitButton({ isLoading, loadingText, children }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <Spinner className="w-4 h-4 border-white" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
