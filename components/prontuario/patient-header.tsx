'use client';

import { PatientResponse, AppointmentResponse } from '@/lib/api';

interface PatientHeaderProps {
  patient: PatientResponse;
  appointment: AppointmentResponse;
  onFinalize?: () => void;
  onViewHistory?: () => void;
}

function calculateAge(dob?: string): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return {
        text: 'Em Atendimento',
        className: 'text-emerald-700 bg-emerald-50 border-emerald-100',
        pulse: true,
      };
    case 'PENDING':
      return {
        text: 'Aguardando',
        className: 'text-yellow-700 bg-yellow-50 border-yellow-100',
        pulse: false,
      };
    case 'COMPLETED':
      return {
        text: 'Finalizado',
        className: 'text-slate-700 bg-slate-50 border-slate-100',
        pulse: false,
      };
    case 'CANCELLED':
      return {
        text: 'Cancelado',
        className: 'text-red-700 bg-red-50 border-red-100',
        pulse: false,
      };
    default:
      return {
        text: status,
        className: 'text-slate-700 bg-slate-50 border-slate-100',
        pulse: false,
      };
  }
}

export function PatientHeader({
  patient,
  appointment,
  onFinalize,
  onViewHistory,
}: PatientHeaderProps) {
  const age = calculateAge(patient.dob);
  const statusBadge = getStatusBadge(appointment.status);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
      <div className="flex gap-4 items-center">
        {/* Patient Avatar */}
        <div className="bg-primary/10 rounded-full size-16 md:size-20 flex items-center justify-center text-primary font-bold text-2xl border border-slate-100">
          {patient.name.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 text-2xl font-bold leading-tight">
            {patient.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm">
            {age !== null && (
              <>
                <span className="text-slate-500 font-medium">{age} anos</span>
                <span className="size-1 bg-slate-300 rounded-full"></span>
              </>
            )}
            <span className="text-primary font-semibold bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">
              {appointment.service_name}
            </span>
            <span className="size-1 bg-slate-300 rounded-full"></span>
            <span className={`font-semibold px-2 py-0.5 rounded text-xs border flex items-center gap-1 ${statusBadge.className}`}>
              {statusBadge.pulse && (
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
              {statusBadge.text}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 w-full md:w-auto">
        <button
          onClick={onViewHistory}
          className="flex-1 md:flex-none h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          Histórico
        </button>
        <button
          onClick={onFinalize}
          className="flex-1 md:flex-none h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">check</span>
          Finalizar
        </button>
      </div>
    </div>
  );
}
