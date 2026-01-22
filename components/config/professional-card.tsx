'use client';

import { UserResponse, SpecialtyResponse } from '@/lib/api';

interface ProfessionalCardProps {
  professional: UserResponse;
  specialties?: SpecialtyResponse[];
  onEdit: (professional: UserResponse) => void;
}

export function ProfessionalCard({ professional, specialties, onEdit }: ProfessionalCardProps) {
  const getSpecialtyName = (specialtyId?: number) => {
    if (!specialtyId || !specialties) return null;
    const specialty = specialties.find((s) => s.id === specialtyId);
    return specialty?.name;
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:border-primary/50 transition-colors bg-white">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 rounded-full size-12 flex items-center justify-center text-primary font-bold text-lg shrink-0">
            {professional.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{professional.name}</h3>
            <p className="text-sm text-slate-500">{professional.email}</p>

            <div className="mt-2 space-y-1">
              {professional.phone_number && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="material-symbols-outlined text-[16px]">phone</span>
                  <span>{professional.phone_number}</span>
                </div>
              )}

              {professional.crm && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="material-symbols-outlined text-[16px]">badge</span>
                  <span>CRM: {professional.crm}</span>
                </div>
              )}

              {professional.role && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="material-symbols-outlined text-[16px]">work</span>
                  <span className="capitalize">{professional.role.toLowerCase()}</span>
                </div>
              )}
            </div>

            <span
              className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${
                professional.active
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {professional.active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>

        <button
          onClick={() => onEdit(professional)}
          className="flex items-center gap-1 px-3 py-2 text-primary hover:bg-primary/5 rounded-lg text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
          Editar
        </button>
      </div>
    </div>
  );
}
