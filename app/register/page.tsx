'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiErrorResponse } from '@/lib/api';
import { validateData, registerSchema } from '@/lib/validators/schemas';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate terms first
    if (!acceptedTerms) {
      setError('Você precisa aceitar os termos de uso e política de privacidade');
      return;
    }

    // Validate with Zod
    const validation = validateData(registerSchema, {
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });

    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      setError(firstError || 'Por favor, verifique os dados informados');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.registerUser(validation.data, false);
      router.push('/dashboard');
    } catch (error) {
      // ApiErrorResponse has user-friendly message
      if (error instanceof ApiErrorResponse) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implementar login com Google OAuth
    alert('Login com Google será implementado em breve!');
  };

  return (
    <div className="bg-white min-h-screen flex items-stretch">
      {/* Lado Esquerdo - Hero Section */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB3e_OaTuVTG24YHQEXVLqy4_oUg8BshCxrGeMA3nA8GKD-HmMirV3ORvm2Lz0j4h893uyfHephv_vqALXP-BFd_vbCASZfUGMuh4plRSZHYZoX91w8SomTN5Fb5OgVsyM2Z8sZL2bpqjuDxO2XEX1vCl2moFjvvyKo6pqRcxRemhkFSkgqV_m3x41ONW1oDe3n7QidKfogwxaeUqJdcZDh9O_ZxLzdTCmgeOUmY1SZtg7SSUkTBxLVNShsS7oTzoKkKvmwsaww7Wnd')",
            filter: 'brightness(0.7)',
          }}
        ></div>
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 clinic-overlay mix-blend-multiply"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full animate-slide-in-left">
          {/* Logo */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight drop-shadow-lg">Randfy</h1>
          </div>

          {/* Main Content */}
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 mb-6">
              <span className="material-symbols-outlined text-[16px] text-purple-200">auto_awesome</span>
              <span className="text-xs font-semibold uppercase tracking-wider">Gestão Inteligente</span>
            </div>
            
            <h2 className="text-5xl font-bold leading-tight mb-6">
              A revolução da sua clínica começa aqui.
            </h2>
            
            <p className="text-lg text-white/90 leading-relaxed mb-8">
              Prontuários inteligentes com IA e automação de WhatsApp para você focar no que realmente importa: seus pacientes.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 border-t border-white/20 pt-8">
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold">40%</span>
                <span className="text-sm text-white/70">Redução em faltas</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold">100%</span>
                <span className="text-sm text-white/70">Segurança de Dados</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-white/60">
            © 2024 Randfy Health Solutions. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-8 bg-slate-50 md:bg-white">
        <div className="w-full max-w-md space-y-8 animate-slide-in-right">
          {/* Logo Mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Randfy
            </h2>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Criar sua conta</h2>
            <p className="text-slate-500 mt-2">Comece a revolucionar sua clínica hoje mesmo.</p>
          </div>

          <div className="space-y-6">
            {/* Google Button */}
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-3 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Entrar com Google
            </button>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-medium uppercase">ou email</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-3 animate-slide-up"
                role="alert"
                aria-live="polite"
              >
                <span className="material-symbols-outlined text-red-600 text-[20px] flex-shrink-0 mt-0.5" aria-hidden="true">
                  error
                </span>
                <p className="flex-1" id="form-error">{error}</p>
              </div>
            )}

            {/* Form */}
            <form 
              className="space-y-5" 
              onSubmit={handleSubmit}
              noValidate
              aria-describedby={error ? "form-error" : undefined}
            >
              <fieldset disabled={isLoading} className="space-y-5"  aria-busy={isLoading}>
              {/* Nome */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="name">
                  Nome Completo
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]" aria-hidden="true">
                    person
                  </span>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    id="name"
                    name="name"
                    type="text"
                    placeholder="João Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    aria-label="Nome completo"
                    aria-required="true"
                    aria-invalid={error && error.includes('nome') ? 'true' : 'false'}
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="email">
                  E-mail Profissional
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]" aria-hidden="true">
                    mail
                  </span>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nome@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    aria-label="E-mail profissional"
                    aria-required="true"
                    aria-invalid={error && error.includes('e-mail') ? 'true' : 'false'}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                  Senha
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]" aria-hidden="true">
                    lock
                  </span>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-11 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    aria-label="Senha"
                    aria-required="true"
                    aria-invalid={error && error.includes('senha') ? 'true' : 'false'}
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={50}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={0}
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  className="rounded text-primary focus:ring-primary border-slate-300 size-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  required
                  aria-label="Aceitar termos de uso e política de privacidade"
                  aria-required="true"
                />
                <label className="text-sm text-slate-600 cursor-pointer" htmlFor="terms">
                  Aceito os{' '}
                  <a href="#" className="text-primary font-semibold hover:underline">
                    termos de uso
                  </a>{' '}
                  e{' '}
                  <a href="#" className="text-primary font-semibold hover:underline">
                    política de privacidade
                  </a>
                </label>
              </div>
              </fieldset>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative"
                aria-busy={isLoading}
              >
                {isLoading && (
                  <span className="absolute left-4" aria-hidden="true">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                )}
                <span>{isLoading ? 'Criando conta...' : 'Criar conta'}</span>
                {!isLoading && <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>}
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-slate-500 text-sm">
                Já tem uma conta?{' '}
                <a href="/login" className="text-primary font-bold hover:underline">
                  Entrar
                </a>
              </p>
            </div>
          </div>

          {/* Footer Links */}
          <div className="pt-8 flex flex-wrap justify-center gap-6 border-t border-slate-100">
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">help</span>
              Suporte
            </a>
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">description</span>
              Termos
            </a>
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              Privacidade
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
