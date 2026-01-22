'use client';

import { useState } from 'react';
import { PrescriptionResponse } from '@/lib/api';

interface DiagnosisSectionProps {
  prescriptions: PrescriptionResponse[];
  onAddPrescription?: (medicationName: string, detail: string, durationDays: number) => void;
  onRemovePrescription?: (id: number) => void;
}

function ComingSoonBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ${className}`}>
      EM BREVE
    </span>
  );
}

export function DiagnosisSection({
  prescriptions,
  onAddPrescription,
  onRemovePrescription,
}: DiagnosisSectionProps) {
  const [newPrescription, setNewPrescription] = useState('');
  const [returnOption, setReturnOption] = useState('15 dias');

  const handleAddPrescription = () => {
    if (newPrescription.trim() && onAddPrescription) {
      onAddPrescription(newPrescription.trim(), '', 7);
      setNewPrescription('');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">assignment</span>
          Diagnóstico & Plano
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">
          Ações imediatas de conduta
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Diagnósticos/CID - Coming Soon */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            Diagnósticos / CID
            <ComingSoonBadge />
          </label>
          <div className="relative group">
            <input
              disabled
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-sm cursor-not-allowed opacity-60"
              placeholder="Ex: G43.9 Enxaqueca..."
              type="text"
            />
            <span className="material-symbols-outlined absolute right-2 top-2 text-[18px] text-slate-300">
              add_circle
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2 text-slate-400 text-xs italic">
            Funcionalidade em breve
          </div>
        </div>

        {/* Conduta & Prescrição - Functional */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Conduta & Prescrição
          </label>
          <div className="relative group">
            <input
              value={newPrescription}
              onChange={(e) => setNewPrescription(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddPrescription()}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              placeholder="Medicação, dose, via..."
              type="text"
            />
            <button
              onClick={handleAddPrescription}
              className="material-symbols-outlined absolute right-2 top-2 text-[18px] text-slate-400 group-hover:text-primary transition-colors cursor-pointer"
            >
              medication
            </button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {prescriptions.length > 0 ? (
              prescriptions.map((prescription) => (
                <span
                  key={prescription.id}
                  className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded border border-emerald-100"
                >
                  {prescription.medication_name || 'Prescrição'}
                  <button
                    onClick={() => onRemovePrescription?.(prescription.id)}
                    className="material-symbols-outlined text-[12px] cursor-pointer hover:text-red-600"
                  >
                    close
                  </button>
                </span>
              ))
            ) : (
              <span className="text-slate-400 text-xs italic">Nenhuma prescrição</span>
            )}
          </div>
        </div>

        {/* Retorno / Orientações */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Retorno / Orientações
          </label>
          <div className="relative">
            <select
              value={returnOption}
              onChange={(e) => setReturnOption(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
            >
              <option value="15 dias">Próximo retorno: 15 dias</option>
              <option value="30 dias">Próximo retorno: 30 dias</option>
              <option value="sob demanda">Sob demanda / SOS</option>
              <option value="encaminhamento">Encaminhamento externo</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-2.5 text-[18px] text-slate-400 pointer-events-none">
              calendar_today
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
