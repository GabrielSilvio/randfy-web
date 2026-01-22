'use client';

import Link from 'next/link';

export default function FinanceiroPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Financeiro</h2>
          <p className="text-slate-600">Gerencie suas finanças e relatórios</p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
            <span className="material-symbols-outlined text-[48px] text-yellow-600">payments</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Em Breve</h3>
          <p className="text-slate-600 max-w-md mx-auto mb-6">
            O módulo financeiro está em desenvolvimento. Em breve você poderá gerenciar 
            pagamentos, emitir relatórios e acompanhar a saúde financeira da sua clínica.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Voltar ao Painel
            </Link>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 opacity-60">
            <div className="size-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-emerald-600">trending_up</span>
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Dashboard Financeiro</h4>
            <p className="text-sm text-slate-600">
              Visualize receitas, despesas e lucro em gráficos intuitivos.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 opacity-60">
            <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Gestão de Pagamentos</h4>
            <p className="text-sm text-slate-600">
              Controle pagamentos, parcelas e gere links de cobrança.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 opacity-60">
            <div className="size-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-ai-accent">summarize</span>
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Relatórios Automáticos</h4>
            <p className="text-sm text-slate-600">
              Receba relatórios semanais e mensais automaticamente.
            </p>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 opacity-40">
            <p className="text-sm text-slate-500 mb-1">Receita do Mês</p>
            <p className="text-2xl font-bold text-slate-300">R$ --,--</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 opacity-40">
            <p className="text-sm text-slate-500 mb-1">Despesas</p>
            <p className="text-2xl font-bold text-slate-300">R$ --,--</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 opacity-40">
            <p className="text-sm text-slate-500 mb-1">Lucro Líquido</p>
            <p className="text-2xl font-bold text-slate-300">R$ --,--</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 opacity-40">
            <p className="text-sm text-slate-500 mb-1">Pendentes</p>
            <p className="text-2xl font-bold text-slate-300">--</p>
          </div>
        </div>
      </div>
    </div>
  );
}
