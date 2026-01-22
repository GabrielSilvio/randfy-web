'use client';

import { useState } from 'react';

interface MedicalNotesProps {
  initialQP?: string;
  initialHMA?: string;
  onSave?: (qp: string, hma: string) => void;
  lastSaved?: string;
}

function ComingSoonBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ${className}`}>
      EM BREVE
    </span>
  );
}

export function MedicalNotes({ initialQP = '', initialHMA = '', lastSaved }: MedicalNotesProps) {
  const [qp, setQp] = useState(initialQP);
  const [hma, setHma] = useState(initialHMA);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50 flex-none">
        <button
          disabled
          className="p-1.5 rounded text-slate-300 cursor-not-allowed"
          title="Em breve"
        >
          <span className="material-symbols-outlined text-[18px]">format_bold</span>
        </button>
        <button
          disabled
          className="p-1.5 rounded text-slate-300 cursor-not-allowed"
          title="Em breve"
        >
          <span className="material-symbols-outlined text-[18px]">format_italic</span>
        </button>
        <button
          disabled
          className="p-1.5 rounded text-slate-300 cursor-not-allowed"
          title="Em breve"
        >
          <span className="material-symbols-outlined text-[18px]">format_underlined</span>
        </button>
        <div className="w-px h-4 bg-slate-300 mx-1"></div>
        <button
          disabled
          className="p-1.5 rounded text-slate-300 cursor-not-allowed"
          title="Em breve"
        >
          <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
        </button>
        <button
          disabled
          className="p-1.5 rounded text-slate-300 cursor-not-allowed"
          title="Em breve"
        >
          <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
        </button>
        <div className="flex-1"></div>
        <ComingSoonBadge className="mr-2" />
        {lastSaved && (
          <span className="text-xs text-slate-400 font-medium pr-2">
            Salvo automaticamente {lastSaved}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-8">
        {/* Queixa Principal */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            Queixa Principal (QP)
            <span className="material-symbols-outlined text-slate-300 text-[16px]">info</span>
            <ComingSoonBadge />
          </span>
          <textarea
            disabled
            value={qp}
            onChange={(e) => setQp(e.target.value)}
            className="w-full h-auto min-h-[40px] text-base leading-relaxed text-slate-400 placeholder:text-slate-300 border-none p-0 focus:ring-0 resize-none font-normal bg-transparent cursor-not-allowed"
            placeholder="Funcionalidade em breve - Descreva o motivo principal da consulta..."
          />
        </label>

        <div className="h-px bg-slate-100 w-full"></div>

        {/* História da Moléstia Atual */}
        <label className="flex flex-col gap-2 relative group/field">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              História da Moléstia Atual (HMA)
              <ComingSoonBadge />
            </span>
            <button
              disabled
              className="text-xs flex items-center gap-1 text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              Expandir com IA
            </button>
          </div>
          <textarea
            disabled
            value={hma}
            onChange={(e) => setHma(e.target.value)}
            className="w-full min-h-[200px] text-base leading-relaxed text-slate-400 placeholder:text-slate-300 border-none p-0 focus:ring-0 resize-none font-normal bg-transparent cursor-not-allowed"
            placeholder="Funcionalidade em breve - Paciente relata início dos sintomas há 3 dias..."
          />
        </label>
      </div>
    </div>
  );
}
