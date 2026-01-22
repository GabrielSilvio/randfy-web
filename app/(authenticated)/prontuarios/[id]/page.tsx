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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);

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

  const handleFinalize = () => {
    // TODO: Implement finalization logic
    router.push('/prontuarios');
  };

  const handleViewHistory = () => {
    // TODO: Implement history view
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
                  onAddVitalSign={() => alert('Funcionalidade em breve')}
                />
              </div>
            </div>

            {/* Diagnosis Section */}
            <DiagnosisSection
              prescriptions={prescriptions}
              onAddPrescription={handleAddPrescription}
            />

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
    </div>
  );
}
