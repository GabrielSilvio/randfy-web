'use client';

import { useState, useEffect } from 'react';
import { PatientData } from '@/lib/api';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PatientData) => Promise<void>;
  isLoading?: boolean;
}

const INITIAL_FORM: PatientData = {
  name: '',
  phone_number: '',
  dob: '',
  cpf: '',
  sex: undefined,
};

function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

export function PatientModal({ isOpen, onClose, onSave, isLoading = false }: PatientModalProps) {
  const [form, setForm] = useState<PatientData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!form.phone_number.trim()) {
      newErrors.phone_number = 'Telefone é obrigatório';
    } else {
      const phoneNumbers = form.phone_number.replace(/\D/g, '');
      if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
        newErrors.phone_number = 'Telefone inválido';
      }
    }

    if (form.cpf) {
      const cpfNumbers = form.cpf.replace(/\D/g, '');
      if (cpfNumbers.length !== 11) {
        newErrors.cpf = 'CPF inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Clean and format data for API
    const phoneDigits = form.phone_number.replace(/\D/g, '');
    
    // Build request body with only valid fields
    const cleanedData: PatientData = {
      name: form.name.trim(),
      phone_number: `+55${phoneDigits}`, // Add Brazil country code
    };

    // Only include optional fields if they have values
    // Convert date to RFC3339 format (Go's time.Time expects this)
    if (form.dob && form.dob.trim()) {
      cleanedData.dob = `${form.dob}T00:00:00Z`;
    }
    
    if (form.cpf && form.cpf.trim()) {
      cleanedData.cpf = form.cpf.replace(/\D/g, '');
    }
    
    if (form.sex) {
      cleanedData.sex = form.sex;
    }

    await onSave(cleanedData);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setForm({ ...form, phone_number: formatted });
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setForm({ ...form, cpf: formatted });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined">person_add</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Novo Paciente</h2>
                <p className="text-sm text-white/80">Cadastre um novo paciente</p>
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
          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
              placeholder="Ex: Maria Silva"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {errors.name}
              </p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Telefone (WhatsApp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">phone</span>
              </span>
              <input
                type="tel"
                value={form.phone_number}
                onChange={handlePhoneChange}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                  errors.phone_number ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
                placeholder="(11) 99999-9999"
                maxLength={16}
              />
            </div>
            {errors.phone_number && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {errors.phone_number}
              </p>
            )}
          </div>

          {/* Data de Nascimento e Sexo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={form.dob || ''}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Sexo
              </label>
              <select
                value={form.sex || ''}
                onChange={(e) => setForm({ ...form, sex: e.target.value as 'M' | 'F' | undefined || undefined })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
          </div>

          {/* CPF */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              CPF <span className="text-slate-400 text-xs font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={form.cpf || ''}
              onChange={handleCPFChange}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                errors.cpf ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
              placeholder="000.000.000-00"
              maxLength={14}
            />
            {errors.cpf && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {errors.cpf}
              </p>
            )}
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
                  Cadastrar Paciente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
