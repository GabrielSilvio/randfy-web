'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, AppointmentResponse, CurrentUserResponse } from '@/lib/api';

export default function DailyPage() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPatientIndex, setCurrentPatientIndex] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await apiClient.getCurrentUser();
        const tenantId = user.user?.tenant_id;
        if (!tenantId) return;

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const appointmentsResponse = await apiClient.getAppointments(tenantId, {
          start_date: startOfDay,
          end_date: endOfDay,
        });

        const todayAppointments = (appointmentsResponse.data || [])
          .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

        setAppointments(todayAppointments);
      } catch (error) {
        console.error('Error loading daily data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const currentPatient = appointments[currentPatientIndex];
  const remainingPatients = appointments.slice(currentPatientIndex + 1);

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const goToPrevious = () => {
    if (currentPatientIndex > 0) setCurrentPatientIndex(currentPatientIndex - 1);
  };

  const goToNext = () => {
    if (currentPatientIndex < appointments.length - 1) setCurrentPatientIndex(currentPatientIndex + 1);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin inline-block w-10 h-10 border-2 border-primary border-t-transparent rounded-full"></div>
          <p className="text-slate-500 mt-4">Carregando atendimentos...</p>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 p-6">
        <div className="text-center max-w-md bg-white rounded-2xl p-12 shadow-sm border border-slate-200">
          <span className="material-symbols-outlined text-[64px] text-slate-300">event_available</span>
          <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Nenhum atendimento agendado</h3>
          <p className="text-slate-600 mb-6">Você não tem pacientes agendados para hoje.</p>
          <Link href="/agenda" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Criar Agendamento
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
              WORKFLOW DO MÉDICO
            </div>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-slate-900">Paciente em Foco</h1>
              <div className="flex gap-2">
                <button 
                  onClick={goToPrevious}
                  disabled={currentPatientIndex === 0}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:border-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                >
                  <span className="material-symbols-outlined text-[20px] text-slate-700">chevron_left</span>
                </button>
                <button 
                  onClick={goToNext}
                  disabled={currentPatientIndex === appointments.length - 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:border-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                >
                  <span className="material-symbols-outlined text-[20px] text-slate-700">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/50">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[16px] text-white">check</span>
                </div>
                <span className="ml-2 text-xs font-semibold text-slate-700 whitespace-nowrap">Chegada</span>
              </div>
              
              <div className="flex-1 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 mx-3 rounded-full"></div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[16px] text-white">check</span>
                </div>
                <span className="ml-2 text-xs font-semibold text-slate-700 whitespace-nowrap">Triagem</span>
              </div>
              
              <div className="flex-1 h-1 bg-gradient-to-r from-primary to-blue-600 mx-3 rounded-full"></div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-primary/10">
                  <span className="material-symbols-outlined text-[16px] text-white">emergency</span>
                </div>
                <span className="ml-2 text-xs font-semibold text-primary whitespace-nowrap">Consulta</span>
              </div>
              
              <div className="flex-1 h-1 bg-slate-200 mx-3 rounded-full"></div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">flag</span>
                </div>
                <span className="ml-2 text-xs font-medium text-slate-400 whitespace-nowrap">Finalização</span>
              </div>
            </div>
          </div>

          {/* Patient Card */}
          {currentPatient && (
            <div className="bg-white rounded-2xl border border-slate-200/50 p-6 mb-5 shadow-lg hover:shadow-xl transition-shadow">
              {/* Patient Header */}
              <div className="flex gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center flex-shrink-0 shadow-md ring-4 ring-blue-50">
                  <span className="text-2xl font-bold text-white">
                    {currentPatient.patient_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1.5">
                    <h2 className="text-xl font-bold text-slate-900">{currentPatient.patient_name}</h2>
                    <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm">
                      AGENDADO
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 mb-2.5">
                    <span className="font-medium">45 anos</span>
                    <span className="mx-2 text-slate-400">•</span>
                    <span className="font-medium">Masculino</span>
                    <span className="mx-2 text-slate-400">•</span>
                    <span className="text-primary font-semibold">Chegou às {formatTime(currentPatient.date_time)} (15 min de espera)</span>
                  </div>
                  <Link href="#" className="text-sm text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1.5 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">description</span>
                    Histórico Completo
                  </Link>
                </div>
              </div>

              {/* Complaint */}
              <div className="mb-5 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  QUEIXA PRINCIPAL / MOTIVO DA VISITA
                </div>
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  "{currentPatient.notes || 'Palpitações frequentes e cansaço excessivo ao realizar esforços moderados nos últimos 3 meses.'}"
                </p>
              </div>

              {/* Two Columns */}
              <div className="grid grid-cols-2 gap-5 mb-6">
                {/* Checklist */}
                <div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-3">
                    CHECKLIST DE ATENDIMENTO
                    <span className="ml-2 text-primary font-extrabold">0/2 Concluídos</span>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" className="mt-0.5 w-4 h-4 rounded-md border-slate-300 text-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">Revisar Holter de 24h</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" className="mt-0.5 w-4 h-4 rounded-md border-slate-300 text-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">Ajustar dosagem de Betabloqueador</span>
                    </label>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-3">
                    AÇÕES RÁPIDAS DE ALTA VAZÃO
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-md transition-all group">
                      <span className="material-symbols-outlined text-[22px] text-slate-600 group-hover:text-slate-900 transition-colors">edit_note</span>
                      <span className="text-[10px] font-bold text-slate-700 uppercase">Prescrever</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-md transition-all group">
                      <span className="material-symbols-outlined text-[22px] text-slate-600 group-hover:text-slate-900 transition-colors">science</span>
                      <span className="text-[10px] font-bold text-slate-700 uppercase">Exames</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-md transition-all group">
                      <span className="material-symbols-outlined text-[22px] text-slate-600 group-hover:text-slate-900 transition-colors">description</span>
                      <span className="text-[10px] font-bold text-slate-700 uppercase">Atestado</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-3 bg-gradient-to-br from-blue-50 to-primary/5 border border-primary/20 rounded-xl hover:from-blue-100 hover:to-primary/10 hover:shadow-md transition-all group">
                      <span className="material-symbols-outlined text-[22px] text-primary group-hover:scale-110 transition-transform">auto_awesome</span>
                      <span className="text-[10px] font-bold text-primary uppercase">IA Scribe</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl font-bold hover:from-primary/90 hover:to-blue-500 hover:shadow-lg transform hover:scale-[1.02] transition-all">
                <span className="material-symbols-outlined text-[22px]">play_circle</span>
                Iniciar Consulta Agora
              </button>
            </div>
          )}

          {/* Shortcuts */}
          <div className="grid grid-cols-4 gap-3">
            <Link href="/agenda" className="group flex flex-col items-center gap-2.5 p-5 bg-white border border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 hover:shadow-lg transform hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-[32px] text-primary group-hover:scale-110 transition-transform">event</span>
              <span className="text-xs font-bold text-slate-900">Agenda</span>
            </Link>
            <Link href="/pacientes" className="group flex flex-col items-center gap-2.5 p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-lg transform hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-[32px] text-emerald-600 group-hover:scale-110 transition-transform">person_add</span>
              <span className="text-xs font-bold text-slate-900">Novo Paciente</span>
            </Link>
            <Link href="/atendimento" className="group flex flex-col items-center gap-2.5 p-5 bg-white border border-slate-200 rounded-2xl hover:border-purple-500 hover:bg-purple-50 hover:shadow-lg transform hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-[32px] text-purple-600 group-hover:scale-110 transition-transform">chat</span>
              <span className="text-xs font-bold text-slate-900">Mensagens</span>
            </Link>
            <Link href="/prontuarios" className="group flex flex-col items-center gap-2.5 p-5 bg-white border border-slate-200 rounded-2xl hover:border-orange-500 hover:bg-orange-50 hover:shadow-lg transform hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-[32px] text-orange-600 group-hover:scale-110 transition-transform">description</span>
              <span className="text-xs font-bold text-slate-900">Relatórios</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-gradient-to-b from-white to-slate-50/50 border-l border-slate-200/50 flex-shrink-0 overflow-y-auto backdrop-blur-sm">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-white text-[20px]">groups</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Fila de Espera</h3>
            </div>
            <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg">{remainingPatients.length} PACIENTES</span>
          </div>
        </div>

        {/* Queue List */}
        <div className="p-3">
          {remainingPatients.slice(0, 4).map((appointment, index) => {
            const initials = appointment.patient_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const statuses = ['Triagem concluída', 'Aguardando triagem', 'Check-in realizado', 'Confirmado'];
            
            return (
              <div key={appointment.id} className="mb-2 p-3.5 bg-white border border-slate-200/50 rounded-xl hover:border-primary/30 hover:bg-primary/5 hover:shadow-md cursor-pointer transition-all group">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-110 ${
                    index === 0 ? 'bg-gradient-to-br from-primary to-blue-600 text-white ring-2 ring-primary/20' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-sm text-slate-900 truncate">{appointment.patient_name}</p>
                      {index === 0 && (
                        <span className="px-2 py-1 bg-gradient-to-r from-primary to-blue-600 text-white text-[9px] font-bold uppercase rounded-lg shadow-sm flex-shrink-0">
                          PRÓXIMO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {formatTime(appointment.date_time)} • {statuses[index] || 'Confirmado'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/50 bg-white/80 backdrop-blur-sm sticky bottom-0">
          <button className="w-full flex items-center justify-center gap-2 py-3 text-sm text-primary font-bold hover:bg-primary/5 rounded-xl transition-all">
            <span className="material-symbols-outlined text-[18px]">swap_vert</span>
            Reordenar Fila Manualmente
          </button>
        </div>
      </div>
    </div>
  );
}
