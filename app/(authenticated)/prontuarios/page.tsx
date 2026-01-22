'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, AppointmentResponse, CurrentUserResponse } from '@/lib/api';

type FilterStatus = 'all' | 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';

export default function ProntuariosPage() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [userData, setUserData] = useState<CurrentUserResponse | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await apiClient.getCurrentUser();
        setUserData(user);

        const tenantId = user.user?.tenant_id;
        if (!tenantId) return;

        // Get last 30 days of appointments
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const appointmentsResponse = await apiClient.getAppointments(tenantId, {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        });

        // Sort by date descending
        const sorted = (appointmentsResponse.data || []).sort(
          (a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
        );

        setAppointments(sorted);
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { text: 'Em Atendimento', className: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
      case 'PENDING':
        return { text: 'Aguardando', className: 'text-yellow-700 bg-yellow-50 border-yellow-100' };
      case 'COMPLETED':
        return { text: 'Finalizado', className: 'text-slate-700 bg-slate-100 border-slate-200' };
      case 'CANCELLED':
        return { text: 'Cancelado', className: 'text-red-700 bg-red-50 border-red-100' };
      default:
        return { text: status, className: 'text-slate-700 bg-slate-50 border-slate-100' };
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesSearch =
      searchTerm === '' ||
      appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Prontuários</h2>
          <p className="text-slate-600">Visualize e gerencie os atendimentos dos pacientes</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por paciente ou serviço..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'CONFIRMED', label: 'Em Atendimento' },
                { value: 'PENDING', label: 'Aguardando' },
                { value: 'COMPLETED', label: 'Finalizados' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value as FilterStatus)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filterStatus === filter.value
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
              <p className="text-slate-500 mt-4">Carregando atendimentos...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-[48px] text-slate-300">
                assignment
              </span>
              <p className="text-slate-500 mt-2">
                {searchTerm || filterStatus !== 'all'
                  ? 'Nenhum atendimento encontrado com os filtros aplicados'
                  : 'Nenhum atendimento nos últimos 30 dias'}
              </p>
              <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                Os atendimentos aparecem aqui quando um paciente tem um agendamento.
              </p>
              <Link
                href="/agenda"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">event</span>
                Ir para Agenda
              </Link>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <div className="col-span-4">Paciente</div>
                <div className="col-span-2">Data/Hora</div>
                <div className="col-span-2">Serviço</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Ações</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-slate-100">
                {filteredAppointments.map((appointment) => {
                  const { date, time } = formatDateTime(appointment.date_time);
                  const statusBadge = getStatusBadge(appointment.status);

                  return (
                    <Link
                      key={appointment.id}
                      href={`/prontuarios/${appointment.id}`}
                      className="block md:grid md:grid-cols-12 gap-4 p-4 hover:bg-slate-50 transition-colors group"
                    >
                      {/* Patient */}
                      <div className="col-span-4 flex items-center gap-3 mb-2 md:mb-0">
                        <div className="bg-primary/10 rounded-full size-10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {appointment.patient_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                            {appointment.patient_name}
                          </p>
                          <p className="text-xs text-slate-500 md:hidden">
                            {date} às {time}
                          </p>
                        </div>
                      </div>

                      {/* Date/Time */}
                      <div className="col-span-2 hidden md:flex flex-col justify-center">
                        <p className="font-medium text-slate-900">{date}</p>
                        <p className="text-sm text-slate-500">{time}</p>
                      </div>

                      {/* Service */}
                      <div className="col-span-2 hidden md:flex items-center">
                        <span className="text-sm text-slate-600">{appointment.service_name}</span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex items-center mb-2 md:mb-0">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded border ${statusBadge.className}`}
                        >
                          {statusBadge.text}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <span className="text-sm text-primary font-medium group-hover:underline hidden md:inline">
                          Abrir Prontuário
                        </span>
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                          chevron_right
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pagination Placeholder */}
        {filteredAppointments.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-sm text-slate-500">
            <p>
              Mostrando {filteredAppointments.length} de {appointments.length} atendimentos
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
