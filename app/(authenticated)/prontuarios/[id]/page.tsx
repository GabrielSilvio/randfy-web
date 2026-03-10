'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  apiClient,
  AppointmentResponse,
  PatientResponse,
  VitalSignResponse,
  VitalSignTypeResponse,
  PrescriptionResponse,
  TestRequestResponse,
  ChatMessage,
  CurrentUserResponse,
} from '@/lib/api';
import { PatientHeader } from '@/components/prontuario/patient-header';
import { InfoCards } from '@/components/prontuario/info-cards';
import { DiagnosisSection } from '@/components/prontuario/diagnosis-section';
import { MedicalNotes } from '@/components/prontuario/medical-notes';
import { ChatSidebar } from '@/components/prontuario/chat-sidebar';

export default function ProntuarioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<CurrentUserResponse | null>(null);
  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [vitalSigns, setVitalSigns] = useState<VitalSignResponse[]>([]);
  const [vitalSignTypes, setVitalSignTypes] = useState<VitalSignTypeResponse[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
  const [testRequests, setTestRequests] = useState<TestRequestResponse[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);

  const [isVitalSignModalOpen, setIsVitalSignModalOpen] = useState(false);
  const [vitalSignForm, setVitalSignForm] = useState({ value: '', vital_sign_type_id: 0 });
  const [newTestRequest, setNewTestRequest] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await apiClient.getCurrentUser();
      setUserData(user);

      const tenantId = user.user?.tenant_id;
      if (!tenantId) {
        setError('Tenant não encontrado');
        return;
      }

      // Load appointment
      const appointmentData = await apiClient.getAppointment(tenantId, appointmentId);
      setAppointment(appointmentData);

      // Load patient
      const patientData = await apiClient.getPatient(tenantId, appointmentData.patient_id);
      setPatient(patientData);

      // Load vital sign types
      const typesResponse = await apiClient.getVitalSignTypes();
      setVitalSignTypes(typesResponse.data || []);

      // Load vital signs for this appointment
      const vitalSignsResponse = await apiClient.getVitalSigns(tenantId, appointmentId);
      setVitalSigns(vitalSignsResponse.data || []);

      // Load prescriptions
      const prescriptionsResponse = await apiClient.getPrescriptions(tenantId, appointmentId);
      setPrescriptions(prescriptionsResponse.data || []);

      // Load test requests
      const testRequestsResponse = await apiClient.getTestRequests(tenantId, appointmentId);
      setTestRequests(testRequestsResponse.data || []);

      // Try to load chat messages if patient has phone
      if (patientData.phone_number) {
        try {
          const phoneNumber = patientData.phone_number.replace(/\D/g, '');
          const messagesResponse = await apiClient.getMessages(tenantId, phoneNumber);
          setMessages(messagesResponse.messages || []);
          setIsWhatsAppConnected(true);
        } catch {
          // WhatsApp not connected or no messages
          setIsWhatsAppConnected(false);
        }
      }
    } catch (err) {
      console.error('Error loading prontuario data:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (appointmentId) {
      loadData();
    }
  }, [appointmentId, loadData]);

  const handleSendMessage = async (text: string) => {
    if (!userData?.user?.tenant_id || !patient?.phone_number) return;

    try {
      const phoneNumber = patient.phone_number.replace(/\D/g, '');
      await apiClient.sendMessage(userData.user.tenant_id, {
        phone_number: phoneNumber,
        text,
      });

      // Add message to local state optimistically
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        from: 'me',
        text,
        timestamp: new Date().toISOString(),
        from_me: true,
      };
      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleAddPrescription = async (medicationName: string, detail: string, durationDays: number) => {
    if (!userData?.user?.tenant_id || !appointmentId) return;

    try {
      const newPrescription = await apiClient.createPrescription(
        userData.user.tenant_id,
        appointmentId,
        {
          medication_name: medicationName,
          detail: detail || `Uso conforme orientação médica`,
          duration_days: durationDays,
        }
      );
      setPrescriptions((prev) => [...prev, newPrescription]);
    } catch (error) {
      console.error('Error creating prescription:', error);
    }
  };

  const handleRemovePrescription = async (prescriptionId: number) => {
    const tenantId = userData?.user?.tenant_id;
    if (!tenantId) return;
    try {
      await apiClient.deletePrescription(tenantId, prescriptionId);
      setPrescriptions((prev) => prev.filter((p) => p.id !== prescriptionId));
    } catch (error) {
      console.error('Error deleting prescription:', error);
    }
  };

  const handleSaveVitalSign = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenantId = userData?.user?.tenant_id;
    if (!tenantId || !vitalSignForm.vital_sign_type_id || !vitalSignForm.value.trim()) return;
    try {
      const created = await apiClient.createVitalSign(tenantId, appointmentId, {
        vital_sign_type_id: vitalSignForm.vital_sign_type_id,
        value: vitalSignForm.value.trim(),
      });
      setVitalSigns((prev) => [...prev, created]);
      setIsVitalSignModalOpen(false);
      setVitalSignForm({ value: '', vital_sign_type_id: vitalSignTypes[0]?.id ?? 0 });
    } catch (error) {
      console.error('Error creating vital sign:', error);
    }
  };

  const handleDeleteVitalSign = async (vitalSignId: number) => {
    const tenantId = userData?.user?.tenant_id;
    if (!tenantId) return;
    try {
      await apiClient.deleteVitalSign(tenantId, vitalSignId);
      setVitalSigns((prev) => prev.filter((vs) => vs.id !== vitalSignId));
    } catch (error) {
      console.error('Error deleting vital sign:', error);
    }
  };

  const handleAddTestRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenantId = userData?.user?.tenant_id;
    if (!tenantId || !newTestRequest.trim()) return;
    try {
      const created = await apiClient.createTestRequest(tenantId, appointmentId, {
        test: newTestRequest.trim(),
      });
      setTestRequests((prev) => [...prev, created]);
      setNewTestRequest('');
    } catch (error) {
      console.error('Error creating test request:', error);
    }
  };

  const handleDeleteTestRequest = async (testRequestId: number) => {
    const tenantId = userData?.user?.tenant_id;
    if (!tenantId) return;
    try {
      await apiClient.deleteTestRequest(tenantId, testRequestId);
      setTestRequests((prev) => prev.filter((tr) => tr.id !== testRequestId));
    } catch (error) {
      console.error('Error deleting test request:', error);
    }
  };

  const handleFinalize = () => {
    if (typeof window !== 'undefined' && !window.confirm('Finalizar atendimento e voltar à lista?')) return;
    router.push('/prontuarios');
  };

  const handleViewHistory = () => {
    alert('Funcionalidade em breve');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin inline-block w-10 h-10 border-2 border-primary border-t-transparent rounded-full"></div>
          <p className="text-slate-500 mt-4">Carregando prontuário...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment || !patient) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-red-400">error</span>
          <p className="text-slate-700 font-medium mt-4">{error || 'Prontuário não encontrado'}</p>
          <button
            onClick={() => router.push('/prontuarios')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-slate-50 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            {/* Patient Header */}
            <PatientHeader
              patient={patient}
              appointment={appointment}
              onFinalize={handleFinalize}
              onViewHistory={handleViewHistory}
            />

            {/* Info Cards */}
            <div className="-mx-1">
              <div className="px-1">
                <InfoCards
                  vitalSigns={vitalSigns}
                  vitalSignTypes={vitalSignTypes}
                  onAddVitalSign={() => {
                setVitalSignForm({
                  value: '',
                  vital_sign_type_id: vitalSignTypes[0]?.id ?? 0,
                });
                setIsVitalSignModalOpen(true);
              }}
                  onDeleteVitalSign={handleDeleteVitalSign}
                />
              </div>
            </div>

            {/* Diagnosis Section */}
            <DiagnosisSection
              prescriptions={prescriptions}
              onAddPrescription={handleAddPrescription}
              onRemovePrescription={handleRemovePrescription}
            />

            {/* Test Requests */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">science</span>
                Solicitações de Exames
              </h3>
              <form onSubmit={handleAddTestRequest} className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={newTestRequest}
                  onChange={(e) => setNewTestRequest(e.target.value)}
                  placeholder="Ex: Hemograma, Glicemia..."
                  className="flex-1 min-w-[180px] px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!newTestRequest.trim()}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  Adicionar
                </button>
              </form>
              <div className="flex flex-wrap gap-2">
                {testRequests.length === 0 ? (
                  <span className="text-slate-400 text-sm italic">Nenhum exame solicitado</span>
                ) : (
                  testRequests.map((tr) => (
                    <span
                      key={tr.id}
                      className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200"
                    >
                      {tr.test}
                      <button
                        type="button"
                        onClick={() => handleDeleteTestRequest(tr.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Medical Notes */}
            <MedicalNotes />
          </div>
        </div>
      </main>

      {/* Chat Sidebar - Desktop */}
      <div className="hidden xl:flex">
        <ChatSidebar
          isConnected={isWhatsAppConnected}
          messages={messages}
          onSendMessage={handleSendMessage}
          isMiniMode={chatMinimized}
          onToggleMode={() => setChatMinimized(!chatMinimized)}
        />
      </div>

      {/* Chat Button - Mobile/Tablet */}
      <div className="xl:hidden">
        <ChatSidebar
          isConnected={isWhatsAppConnected}
          messages={messages}
          onSendMessage={handleSendMessage}
          isMiniMode={true}
          onToggleMode={() => setChatMinimized(!chatMinimized)}
        />
      </div>

      {/* Mobile Chat Modal */}
      {!chatMinimized && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setChatMinimized(true)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md">
            <ChatSidebar
              isConnected={isWhatsAppConnected}
              messages={messages}
              onSendMessage={handleSendMessage}
              isMiniMode={false}
              onToggleMode={() => setChatMinimized(true)}
            />
          </div>
        </div>
      )}

      {/* Vital Sign Modal */}
      {isVitalSignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsVitalSignModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Registrar sinal vital</h3>
            <form onSubmit={handleSaveVitalSign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select
                  value={vitalSignForm.vital_sign_type_id || ''}
                  onChange={(e) =>
                    setVitalSignForm((p) => ({ ...p, vital_sign_type_id: Number(e.target.value) }))
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  required
                >
                  <option value="">Selecione</option>
                  {vitalSignTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
                <input
                  type="text"
                  value={vitalSignForm.value}
                  onChange={(e) => setVitalSignForm((p) => ({ ...p, value: e.target.value }))}
                  placeholder="Ex: 120, 36.5"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsVitalSignModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
