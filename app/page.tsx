import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Randfy
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-6 py-2.5 text-sm font-semibold text-slate-700 hover:text-primary transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Começar Agora
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-purple-50 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-200 mb-8">
              <span className="material-symbols-outlined text-[20px] text-purple-600">auto_awesome</span>
              <span className="text-sm font-semibold text-purple-900 uppercase tracking-wide">
                Gestão Inteligente com IA
              </span>
            </div>

            {/* Main Heading */}
            <h2 className="text-6xl md:text-7xl font-bold leading-tight mb-6 bg-gradient-to-r from-slate-900 via-primary to-blue-600 bg-clip-text text-transparent">
              A revolução da sua clínica começa aqui
            </h2>

            {/* Subheading */}
            <p className="text-xl text-slate-600 leading-relaxed mb-12 max-w-2xl mx-auto">
              Prontuários inteligentes com IA e automação de WhatsApp para você focar no que realmente importa: seus pacientes.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/register"
                className="px-8 py-4 text-base font-semibold bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                Começar Gratuitamente
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 text-base font-semibold border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all"
              >
                Acessar Conta
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12 border-t border-slate-200">
              <div className="flex flex-col">
                <span className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  40%
                </span>
                <span className="text-sm text-slate-600 mt-1">Redução em faltas</span>
              </div>
              <div className="flex flex-col">
                <span className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  100%
                </span>
                <span className="text-sm text-slate-600 mt-1">Segurança de Dados</span>
              </div>
              <div className="flex flex-col">
                <span className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  24/7
                </span>
                <span className="text-sm text-slate-600 mt-1">Atendimento IA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-slate-900 mb-4">
              Tudo que sua clínica precisa
            </h3>
            <p className="text-lg text-slate-600">
              Ferramentas poderosas para transformar sua gestão
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-white text-[28px]">auto_awesome</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">IA Integrada</h4>
              <p className="text-slate-600">
                Assistente inteligente que auxilia nos prontuários e automatiza o atendimento via WhatsApp
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-white text-[28px]">assignment</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Prontuários Digitais</h4>
              <p className="text-slate-600">
                Gestão completa de pacientes com histórico, prescrições e exames em um só lugar
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-white text-[28px]">calendar_month</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Agenda Inteligente</h4>
              <p className="text-slate-600">
                Controle total de agendamentos com lembretes automáticos e redução de faltas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-2xl font-bold text-white">Randfy</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2024 Randfy Health Solutions. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
