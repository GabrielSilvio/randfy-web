'use client';

import { VitalSignResponse, VitalSignTypeResponse } from '@/lib/api';

interface InfoCardsProps {
  vitalSigns: VitalSignResponse[];
  vitalSignTypes: VitalSignTypeResponse[];
  onAddVitalSign?: () => void;
}

interface ComingSoonBadgeProps {
  className?: string;
}

function ComingSoonBadge({ className = '' }: ComingSoonBadgeProps) {
  return (
    <span className={`text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ${className}`}>
      EM BREVE
    </span>
  );
}

export function InfoCards({ vitalSigns, vitalSignTypes, onAddVitalSign }: InfoCardsProps) {
  // Map vital sign type IDs to their names and units
  const vitalSignTypeMap = new Map(
    vitalSignTypes.map((type) => [type.id, { name: type.name, unit: type.unit }])
  );

  // Group vital signs by type
  const latestVitalSigns = vitalSigns.reduce((acc, vs) => {
    const existing = acc.get(vs.vital_sign_type_id);
    if (!existing || new Date(vs.created_at) > new Date(existing.created_at)) {
      acc.set(vs.vital_sign_type_id, vs);
    }
    return acc;
  }, new Map<number, VitalSignResponse>());

  return (
    <div className="flex overflow-x-auto gap-4 pb-2 px-1 no-scrollbar">
      {/* Allergies Card - Coming Soon */}
      <div className="flex-none w-72 bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col group hover:border-blue-300 transition-colors opacity-75">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-red-50 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px]">warning</span>
            </div>
            <h3 className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
              Alergias
            </h3>
            <ComingSoonBadge />
          </div>
          <button
            disabled
            className="text-slate-300 text-[10px] font-bold bg-slate-50 px-1.5 py-0.5 rounded cursor-not-allowed"
          >
            + Inserir
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-slate-400 text-xs italic">
          Nenhuma alergia registrada
        </div>
      </div>

      {/* Medications Card - Coming Soon */}
      <div className="flex-none w-72 bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col group hover:border-blue-300 transition-colors opacity-75">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-blue-50 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px]">pill</span>
            </div>
            <h3 className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
              Medicamentos
            </h3>
            <ComingSoonBadge />
          </div>
          <button
            disabled
            className="text-slate-300 text-[10px] font-bold bg-slate-50 px-1.5 py-0.5 rounded cursor-not-allowed"
          >
            + Inserir
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-slate-400 text-xs italic">
          Nenhum medicamento registrado
        </div>
      </div>

      {/* Vital Signs Card - Functional */}
      <div className="flex-none w-72 bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col group hover:border-blue-300 transition-colors">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px]">ecg_heart</span>
            </div>
            <h3 className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
              Sinais Vitais
            </h3>
          </div>
          <button
            onClick={onAddVitalSign}
            className="text-primary text-[10px] font-bold bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
          >
            + Inserir
          </button>
        </div>
        <div className="flex gap-4">
          {latestVitalSigns.size > 0 ? (
            Array.from(latestVitalSigns.values()).slice(0, 3).map((vs) => {
              const typeInfo = vitalSignTypeMap.get(vs.vital_sign_type_id);
              return (
                <div key={vs.id}>
                  <span className="text-slate-500 block text-[9px]">
                    {typeInfo?.name?.substring(0, 10) || 'N/A'}
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {vs.value} {typeInfo?.unit || ''}
                  </span>
                </div>
              );
            })
          ) : (
            <span className="text-slate-400 text-xs italic">Nenhum sinal registrado</span>
          )}
        </div>
      </div>
    </div>
  );
}
