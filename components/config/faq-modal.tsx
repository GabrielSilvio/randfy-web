'use client';

import { useState, useEffect } from 'react';
import { FAQData } from '@/lib/api';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FAQData) => Promise<void>;
  initialData?: FAQData;
  isLoading?: boolean;
}

export function FAQModal({ isOpen, onClose, onSave, initialData, isLoading = false }: FAQModalProps) {
  const [form, setForm] = useState<FAQData>({
    question: '',
    answer: '',
  });
  const [errors, setErrors] = useState<{ question?: string; answer?: string }>({});

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({ question: '', answer: '' });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { question?: string; answer?: string } = {};

    if (!form.question.trim()) {
      newErrors.question = 'Pergunta é obrigatória';
    }

    if (!form.answer.trim()) {
      newErrors.answer = 'Resposta é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    await onSave({
      question: form.question.trim(),
      answer: form.answer.trim(),
    });
  };

  const handleClose = () => {
    setForm({ question: '', answer: '' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {initialData ? 'Editar FAQ' : 'Nova FAQ'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-slate-700 mb-2">
              Pergunta <span className="text-red-500">*</span>
            </label>
            <textarea
              id="question"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                errors.question ? 'border-red-300' : 'border-slate-200'
              }`}
              placeholder="Ex: Qual é o horário de funcionamento da clínica?"
              disabled={isLoading}
            />
            {errors.question && (
              <p className="mt-1 text-sm text-red-600">{errors.question}</p>
            )}
          </div>

          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-slate-700 mb-2">
              Resposta <span className="text-red-500">*</span>
            </label>
            <textarea
              id="answer"
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              rows={6}
              className={`w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                errors.answer ? 'border-red-300' : 'border-slate-200'
              }`}
              placeholder="Ex: Nossa clínica funciona de segunda a sexta, das 8h às 18h."
              disabled={isLoading}
            />
            {errors.answer && (
              <p className="mt-1 text-sm text-red-600">{errors.answer}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-blue-600 shrink-0">info</span>
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Dica:</p>
                <p>
                  As FAQs são usadas pelo assistente de IA para responder perguntas frequentes dos
                  pacientes de forma automática pelo WhatsApp.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
