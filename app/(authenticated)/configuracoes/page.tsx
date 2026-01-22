'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiClient,
  TenantResponse,
  StateResponse,
  ServiceResponse,
  UserResponse,
  SpecialtyResponse,
  TenantScheduleData,
  FAQResponse,
  FAQData,
  ServiceData,
  UpdateUserData,
  CreateTenantData,
} from '@/lib/api';
import { ScheduleForm, ProfessionalCard, FAQModal } from '@/components/config';

type Tab = 'clinic' | 'professionals' | 'schedules' | 'services' | 'whatsapp' | 'faqs';

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('clinic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tenant data
  const [tenant, setTenant] = useState<TenantResponse | null>(null);
  const [states, setStates] = useState<StateResponse[]>([]);
  const [tenantForm, setTenantForm] = useState<Partial<CreateTenantData>>({});

  // Professionals data
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyResponse[]>([]);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [userForm, setUserForm] = useState<UpdateUserData>({});

  // Schedules data
  const [schedules, setSchedules] = useState<TenantScheduleData[]>([]);

  // Services data
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [editingService, setEditingService] = useState<ServiceResponse | null>(null);
  const [serviceForm, setServiceForm] = useState<Partial<ServiceData>>({});

  // WhatsApp data
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // FAQs data
  const [faqs, setFaqs] = useState<FAQResponse[]>([]);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQResponse | null>(null);
  const [deletingFaqId, setDeletingFaqId] = useState<number | null>(null);

  // Load initial data
  useEffect(() => {
    const init = async () => {
      try {
        const user = await apiClient.getCurrentUser();
        const tenantId = user.tenant?.id || user.user?.tenant_id;

        if (!tenantId) {
          router.push('/onboarding');
          return;
        }

        // Load states
        const statesResponse = await apiClient.getStates();
        setStates(statesResponse.data || []);

        // Load tenant
        const tenantData = await apiClient.getTenant(tenantId);
        setTenant(tenantData);
        setTenantForm({
          name: tenantData.name,
          address_1: tenantData.address_1 || '',
          address_2: tenantData.address_2 || '',
          number: tenantData.number || '',
          neighborhood: tenantData.neighborhood || '',
          city: tenantData.city || '',
          state_id: tenantData.state_id || 0,
          postal_code: tenantData.postal_code || '',
          phone_number: tenantData.phone_number || '',
          assistant_name: tenantData.assistant_name || '',
          email: tenantData.email || '',
        });

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Erro ao carregar configurações');
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // Load tab-specific data
  const loadTabData = useCallback(async (tab: Tab) => {
    if (!tenant) return;

    try {
      switch (tab) {
        case 'professionals':
          const [usersResponse, specialtiesResponse] = await Promise.all([
            apiClient.listUsers(tenant.id),
            apiClient.getSpecialties(),
          ]);
          setUsers(usersResponse.data || []);
          setSpecialties(specialtiesResponse.data || []);
          break;

        case 'schedules':
          const schedulesResponse = await apiClient.getTenantSchedules(tenant.id);
          setSchedules(schedulesResponse.data || []);
          break;

        case 'services':
          const servicesResponse = await apiClient.getServices(tenant.id);
          setServices(servicesResponse.data || []);
          break;

        case 'whatsapp':
          // QR code is loaded on demand
          break;

        case 'faqs':
          const faqsResponse = await apiClient.listFAQs(tenant.id);
          setFaqs(faqsResponse.data || []);
          break;
      }
    } catch (err) {
      console.error(`Error loading ${tab} data:`, err);
    }
  }, [tenant]);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  // Handlers
  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setSaving(true);
    setError('');

    try {
      await apiClient.updateTenant(tenant.id, tenantForm as Partial<CreateTenantData>);
      setSuccess('Dados da clínica atualizados com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao atualizar dados da clínica');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = (user: UserResponse) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      phone_number: user.phone_number || '',
      crm: user.crm || '',
      active: user.active,
    });
  };

  const handleSaveUser = async () => {
    if (!tenant || !editingUser) return;

    setSaving(true);
    setError('');

    try {
      await apiClient.updateUser(tenant.id, editingUser.id, userForm);
      setSuccess('Profissional atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      setEditingUser(null);
      loadTabData('professionals');
    } catch (err) {
      setError('Erro ao atualizar profissional');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedules = async (schedules: TenantScheduleData[]) => {
    if (!tenant) return;

    setSaving(true);
    setError('');

    try {
      await apiClient.upsertTenantSchedules(tenant.id, schedules);
      setSuccess('Horários atualizados com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao atualizar horários');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setSaving(true);
    setError('');

    try {
      await apiClient.createService(tenant.id, serviceForm as ServiceData);
      setSuccess('Serviço criado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      setServiceForm({});
      loadTabData('services');
    } catch (err) {
      setError('Erro ao criar serviço');
    } finally {
      setSaving(false);
    }
  };

  const loadQRCode = async () => {
    if (!tenant) return;

    setQrLoading(true);
    try {
      const qrResponse = await apiClient.getQRCode(tenant.id);
      setQrCode(qrResponse.base64 || qrResponse.qrcode);
    } catch (err) {
      setError('Erro ao carregar QR Code');
    } finally {
      setQrLoading(false);
    }
  };

  const handleSaveFaq = async (data: FAQData) => {
    if (!tenant) return;

    setSaving(true);
    setError('');

    try {
      if (editingFaq) {
        await apiClient.updateFAQ(tenant.id, editingFaq.id, data);
        setSuccess('FAQ atualizada com sucesso!');
      } else {
        await apiClient.createFAQ(tenant.id, data);
        setSuccess('FAQ criada com sucesso!');
      }
      setTimeout(() => setSuccess(''), 3000);
      setIsFaqModalOpen(false);
      setEditingFaq(null);
      loadTabData('faqs');
    } catch (err) {
      setError('Erro ao salvar FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaq = async (faqId: number) => {
    if (!tenant) return;

    setDeletingFaqId(faqId);
    try {
      await apiClient.deleteFAQ(tenant.id, faqId);
      setSuccess('FAQ excluída com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      loadTabData('faqs');
    } catch (err) {
      setError('Erro ao excluir FAQ');
    } finally {
      setDeletingFaqId(null);
    }
  };

  const tabs = [
    { id: 'clinic' as Tab, label: 'Clínica', icon: 'business' },
    { id: 'professionals' as Tab, label: 'Profissionais', icon: 'people' },
    { id: 'schedules' as Tab, label: 'Horários', icon: 'schedule' },
    { id: 'services' as Tab, label: 'Serviços', icon: 'medical_services' },
    { id: 'whatsapp' as Tab, label: 'WhatsApp', icon: 'chat' },
    { id: 'faqs' as Tab, label: 'FAQs', icon: 'help' },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Configurações</h1>
          <p className="text-slate-600">Gerencie as configurações da sua clínica</p>
        </div>

        {/* Success Toast */}
        {success && (
          <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <p className="font-medium text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <span className="material-symbols-outlined text-red-600">error</span>
              <p className="font-medium text-sm">{error}</p>
              <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {activeTab === 'clinic' && (
            <ClinicTab
              tenantForm={tenantForm}
              setTenantForm={setTenantForm}
              states={states}
              onSave={handleSaveTenant}
              saving={saving}
            />
          )}

          {activeTab === 'professionals' && (
            <ProfessionalsTab
              users={users}
              specialties={specialties}
              editingUser={editingUser}
              userForm={userForm}
              setUserForm={setUserForm}
              onEditUser={handleEditUser}
              onSaveUser={handleSaveUser}
              onCancelEdit={() => setEditingUser(null)}
              saving={saving}
            />
          )}

          {activeTab === 'schedules' && (
            <SchedulesTab
              schedules={schedules}
              onSaveSchedules={handleSaveSchedules}
              saving={saving}
            />
          )}

          {activeTab === 'services' && (
            <ServicesTab
              services={services}
              serviceForm={serviceForm}
              setServiceForm={setServiceForm}
              onSave={handleSaveService}
              saving={saving}
            />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppTab
              qrCode={qrCode}
              qrLoading={qrLoading}
              onLoadQRCode={loadQRCode}
            />
          )}

          {activeTab === 'faqs' && (
            <FAQsTab
              faqs={faqs}
              onAddFaq={() => setIsFaqModalOpen(true)}
              onEditFaq={(faq) => {
                setEditingFaq(faq);
                setIsFaqModalOpen(true);
              }}
              onDeleteFaq={handleDeleteFaq}
              deletingFaqId={deletingFaqId}
            />
          )}
        </div>
      </div>

      {/* FAQ Modal */}
      <FAQModal
        isOpen={isFaqModalOpen}
        onClose={() => {
          setIsFaqModalOpen(false);
          setEditingFaq(null);
        }}
        onSave={handleSaveFaq}
        initialData={editingFaq ? { question: editingFaq.question, answer: editingFaq.answer } : undefined}
        isLoading={saving}
      />
    </div>
  );
}

// Sub-components for each tab
interface ClinicTabProps {
  tenantForm: Partial<CreateTenantData>;
  setTenantForm: React.Dispatch<React.SetStateAction<Partial<CreateTenantData>>>;
  states: StateResponse[];
  onSave: (e: React.FormEvent) => void;
  saving: boolean;
}

function ClinicTab({ tenantForm, setTenantForm, states, onSave, saving }: ClinicTabProps) {
  const updateField = (field: keyof CreateTenantData, value: string | number) => {
    setTenantForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Nome da Clínica <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={tenantForm.name || ''}
          onChange={(e) => updateField('name', e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">Endereço</label>
          <input
            type="text"
            value={tenantForm.address_1 || ''}
            onChange={(e) => updateField('address_1', e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Número</label>
          <input
            type="text"
            value={tenantForm.number || ''}
            onChange={(e) => updateField('number', e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Bairro</label>
          <input
            type="text"
            value={tenantForm.neighborhood || ''}
            onChange={(e) => updateField('neighborhood', e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Cidade <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={tenantForm.city || ''}
            onChange={(e) => updateField('city', e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Estado <span className="text-red-500">*</span>
          </label>
          <select
            value={tenantForm.state_id || 0}
            onChange={(e) => updateField('state_id', Number(e.target.value))}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            required
          >
            <option value={0}>Selecione um estado</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">CEP</label>
          <input
            type="text"
            value={tenantForm.postal_code || ''}
            onChange={(e) => updateField('postal_code', e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Telefone</label>
          <input
            type="tel"
            value={tenantForm.phone_number || ''}
            onChange={(e) => updateField('phone_number', e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
          <input
            type="email"
            value={tenantForm.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Nome do Assistente
        </label>
        <input
          type="text"
          value={tenantForm.assistant_name || ''}
          onChange={(e) => updateField('assistant_name', e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}

interface ProfessionalsTabProps {
  users: UserResponse[];
  specialties: SpecialtyResponse[];
  editingUser: UserResponse | null;
  userForm: UpdateUserData;
  setUserForm: React.Dispatch<React.SetStateAction<UpdateUserData>>;
  onEditUser: (user: UserResponse) => void;
  onSaveUser: () => void;
  onCancelEdit: () => void;
  saving: boolean;
}

function ProfessionalsTab({
  users,
  specialties,
  editingUser,
  userForm,
  setUserForm,
  onEditUser,
  onSaveUser,
  onCancelEdit,
  saving,
}: ProfessionalsTabProps) {
  if (editingUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Editar Profissional</h3>
          <button
            onClick={onCancelEdit}
            className="text-slate-600 hover:text-slate-900"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Nome</label>
          <input
            type="text"
            value={userForm.name || ''}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Telefone</label>
          <input
            type="tel"
            value={userForm.phone_number || ''}
            onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">CRM</label>
          <input
            type="text"
            value={userForm.crm || ''}
            onChange={(e) => setUserForm({ ...userForm, crm: e.target.value })}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="active"
            checked={userForm.active ?? true}
            onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })}
            className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary"
          />
          <label htmlFor="active" className="text-sm font-medium text-slate-700">
            Profissional ativo
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={saving}
            className="px-4 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSaveUser}
            disabled={saving}
            className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Profissionais</h3>
        <p className="text-sm text-slate-600">
          Gerencie os profissionais da sua clínica
        </p>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Nenhum profissional cadastrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <ProfessionalCard
              key={user.id}
              professional={user}
              specialties={specialties}
              onEdit={onEditUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SchedulesTabProps {
  schedules: TenantScheduleData[];
  onSaveSchedules: (schedules: TenantScheduleData[]) => Promise<void>;
  saving: boolean;
}

function SchedulesTab({ schedules, onSaveSchedules, saving }: SchedulesTabProps) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Horários de Funcionamento</h3>
        <p className="text-sm text-slate-600">
          Defina os dias e horários em que sua clínica atende
        </p>
      </div>

      <ScheduleForm
        initialSchedules={schedules}
        onSave={onSaveSchedules}
        isLoading={saving}
      />
    </div>
  );
}

interface ServicesTabProps {
  services: ServiceResponse[];
  serviceForm: Partial<ServiceData>;
  setServiceForm: React.Dispatch<React.SetStateAction<Partial<ServiceData>>>;
  onSave: (e: React.FormEvent) => void;
  saving: boolean;
}

function ServicesTab({ services, serviceForm, setServiceForm, onSave, saving }: ServicesTabProps) {
  const updateField = (field: keyof ServiceData, value: string | number | boolean) => {
    setServiceForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatPrice = (cents: number): string => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Serviços</h3>
        <p className="text-sm text-slate-600">
          Gerencie os serviços oferecidos pela sua clínica
        </p>
      </div>

      {/* Services List */}
      {services.length > 0 && (
        <div className="space-y-3 mb-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="border border-slate-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <h4 className="font-semibold text-slate-900">{service.name}</h4>
                {service.description && (
                  <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                  <span>⏱️ {service.duration_minutes} min</span>
                  <span>💰 {formatPrice(service.price_cents)}</span>
                  {service.requires_deposit && service.deposit_cents && (
                    <span className="text-amber-600">
                      💳 Sinal: {formatPrice(service.deposit_cents)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Service Form */}
      <div className="border-t border-slate-200 pt-6">
        <h4 className="font-semibold text-slate-900 mb-4">Adicionar Novo Serviço</h4>
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome do Serviço <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={serviceForm.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
            <textarea
              value={serviceForm.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Duração (minutos) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={serviceForm.duration_minutes || 30}
                onChange={(e) => updateField('duration_minutes', Number(e.target.value))}
                min={5}
                max={480}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Preço (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={(serviceForm.price_cents || 0) / 100}
                onChange={(e) => updateField('price_cents', Math.round(Number(e.target.value) * 100))}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Adicionando...' : 'Adicionar Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface WhatsAppTabProps {
  qrCode: string | null;
  qrLoading: boolean;
  onLoadQRCode: () => void;
}

function WhatsAppTab({ qrCode, qrLoading, onLoadQRCode }: WhatsAppTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">WhatsApp</h3>
        <p className="text-sm text-slate-600">
          Conecte seu WhatsApp Business ao assistente
        </p>
      </div>

      <div className="flex flex-col items-center py-8">
        {qrLoading ? (
          <div className="w-64 h-64 bg-slate-100 rounded-2xl flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : qrCode ? (
          <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
            <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
          </div>
        ) : (
          <div className="w-64 h-64 bg-slate-100 rounded-2xl flex flex-col items-center justify-center gap-4">
            <span className="material-symbols-outlined text-[64px] text-slate-400">qr_code</span>
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

      <div className="bg-slate-50 rounded-xl p-6">
        <h4 className="font-medium text-slate-900 mb-4">Como conectar:</h4>
        <ol className="space-y-3">
          <li className="flex items-start gap-3 text-slate-600">
            <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium shrink-0">
              1
            </span>
            <span>Abra o WhatsApp Business no seu celular</span>
          </li>
          <li className="flex items-start gap-3 text-slate-600">
            <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium shrink-0">
              2
            </span>
            <span>Vá em Configurações → Dispositivos conectados</span>
          </li>
          <li className="flex items-start gap-3 text-slate-600">
            <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium shrink-0">
              3
            </span>
            <span>Toque em "Conectar um dispositivo"</span>
          </li>
          <li className="flex items-start gap-3 text-slate-600">
            <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium shrink-0">
              4
            </span>
            <span>Escaneie o QR Code acima</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

interface FAQsTabProps {
  faqs: FAQResponse[];
  onAddFaq: () => void;
  onEditFaq: (faq: FAQResponse) => void;
  onDeleteFaq: (faqId: number) => void;
  deletingFaqId: number | null;
}

function FAQsTab({ faqs, onAddFaq, onEditFaq, onDeleteFaq, deletingFaqId }: FAQsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">FAQs do Bot</h3>
          <p className="text-sm text-slate-600">
            Perguntas frequentes que o assistente de IA usará para responder pacientes
          </p>
        </div>
        <button
          onClick={onAddFaq}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nova FAQ
        </button>
      </div>

      {faqs.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-[48px] text-slate-300">help</span>
          <p className="text-slate-500 mt-4">Nenhuma FAQ cadastrada</p>
          <button
            onClick={onAddFaq}
            className="mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Criar Primeira FAQ
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="border border-slate-200 rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-2">{faq.question}</h4>
                  <p className="text-sm text-slate-600">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onEditFaq(faq)}
                    className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => onDeleteFaq(faq.id)}
                    disabled={deletingFaqId === faq.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Excluir"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {deletingFaqId === faq.id ? 'hourglass_empty' : 'delete'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
