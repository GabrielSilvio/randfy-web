'use client';

import { useState, useEffect } from 'react';
import { AppointmentData, PatientResponse } from '@/lib/api';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AppointmentData) => Promise<void>;
  isLoading?: boolean;
  patients: PatientResponse[];
}

const INITIAL_FORM: AppointmentData & { service_name: string } = {
  patient_id: 0,
  service_id: 1, // Default service ID
  date_time: '',
  notes: '',
  status: 'PENDING',
  service_name: 'Consulta',
};

// Common services for healthcare
const SERVICES = [
  { id: 1, name: 'Consulta' },
  { id: 2, name: 'Retorno' },
  { id: 3, name: 'Avaliação' },
  { id: 4, name: 'Exame' },
  { id: 5, name: 'Procedimento' },
];

export function AppointmentModal({ isOpen, onClose, onSave, isLoading = false, patients }: AppointmentModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Set default date/time to next available slot (next hour)
      const now = new Date();
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
      now.setSeconds(0);
      now.setMilliseconds(0);
      
      // Format to datetime-local format
      const defaultDateTime = now.toISOString().slice(0, 16);
      
      setForm({ ...INITIAL_FORM, date_time: defaultDateTime });
      setErrors({});
      setSearchTerm('');
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.patient_id || form.patient_id === 0) {
      newErrors.patient_id = 'Selecione um paciente';
    }

    if (!form.date_time) {
      newErrors.date_time = 'Data e hora são obrigatórias';
    } else {
      const appointmentDate = new Date(form.date_time);
      const now = new Date();
      
      if (appointmentDate < now) {
        newErrors.date_time = 'Data e hora devem ser futuras';
      }
    }

    if (!form.service_id) {
      newErrors.service_id = 'Selecione um serviço';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Format date_time to RFC3339 for Go API
    const formattedDateTime = new Date(form.date_time).toISOString();

    const appointmentData: AppointmentData = {
      patient_id: form.patient_id,
      service_id: form.service_id,
      date_time: formattedDateTime,
      status: form.status,
    };

    // Only include notes if provided
    if (form.notes && form.notes.trim()) {
      appointmentData.notes = form.notes.trim();
    }

    await onSave(appointmentData);
  };

  const filteredPatients = patients.filter((patient) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      patient.name.toLowerCase().includes(search) ||
      patient.phone_number.includes(search)
    );
  });

  const selectedPatient = patients.find(p => p.id === form.patient_id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined">event</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Novo Agendamento</h2>
                <p className="text-sm text-white/80">Agende uma consulta ou procedimento</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Paciente <span className="text-red-500">*</span>
            </label>
            
            {/* Search Input */}
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Buscar paciente..."
              />
            </div>

            {/* Patient Dropdown */}
            <div className={`border rounded-lg overflow-hidden ${errors.patient_id ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
              <div className="max-h-48 overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    Nenhum paciente encontrado
                  </div>
                ) : (
                  filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, patient_id: patient.id });
                        setErrors({ ...errors, patient_id: '' });
                        setSearchTerm('');
                      }}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-b-0 ${
                        form.patient_id === patient.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="bg-primary/10 rounded-full size-10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{patient.name}</p>
                        <p className="text-xs text-slate-500 truncate">{patient.phone_number}</p>
                      </div>
                      {form.patient_id === patient.id && (
                        <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Selected Patient Display */}
            {selectedPatient && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                  <span className="text-sm font-semibold text-slate-900">{selectedPatient.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, patient_id: 0 })}
                  className="text-slate-500 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            {errors.patient_id && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {errors.patient_id}
              </p>
            )}
          </div>

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tipo de Serviço <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICES.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, service_id: service.id, service_name: service.name });
                    setErrors({ ...errors, service_id: '' });
                  }}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                    form.service_id === service.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {service.name}
                </button>
              ))}
            </div>
            {errors.service_id && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {errors.service_id}
              </p>
            )}
          </div>

          {/* Date and Time */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Data e Hora <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
              </span>
              <input
                type="datetime-local"
                value={form.date_time}
                onChange={(e) => {
                  setForm({ ...form, date_time: e.target.value });
                  setErrors({ ...errors, date_time: '' });
                }}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                  errors.date_time ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.date_time && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {errors.date_time}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'PENDING' | 'CONFIRMED' })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none bg-white cursor-pointer"
            >
              <option value="PENDING">Aguardando confirmação</option>
              <option value="CONFIRMED">Confirmado</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Observações <span className="text-slate-400 text-xs font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              placeholder="Adicione observações sobre o agendamento..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  Salvando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Criar Agendamento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
