'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  isAI?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/daily', label: 'Rodada Diária', icon: 'today' },
  { href: '/pacientes', label: 'Pacientes', icon: 'people' },
  { href: '/agenda', label: 'Agenda', icon: 'calendar_month' },
  { href: '/prontuarios', label: 'Prontuários', icon: 'assignment' },
  { href: '/atendimento-ia', label: 'Atendimento IA', icon: 'auto_awesome', isAI: true },
  { href: '/financeiro', label: 'Financeiro', icon: 'payments' },
];

interface AppHeaderProps {
  userName: string;
  userRole?: string;
  onLogout: () => void;
}

export function AppHeader({ userName, userRole, onLogout }: AppHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/daily') {
      return pathname === '/daily' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="flex-none flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 bg-white px-6 py-3 z-20 shadow-sm relative">
      {/* Logo and Navigation */}
      <div className="flex items-center gap-8">
        <Link href="/daily" className="flex items-center gap-3 text-primary group">
          <div className="size-9 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow">
            <span className="material-symbols-outlined text-[22px]">local_hospital</span>
          </div>
          <h2 className="text-slate-900 text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Randfy
          </h2>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                isActive(item.href)
                  ? item.isAI
                    ? 'text-ai-accent bg-purple-50'
                    : 'text-primary bg-primary/10 font-bold'
                  : item.isAI
                  ? 'text-ai-accent hover:text-ai-accent hover:bg-purple-50'
                  : 'text-slate-500 hover:text-primary hover:bg-slate-50'
              }`}
            >
              {item.isAI && (
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              )}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
          <button className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors relative">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-0 right-0 size-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                {userName}
              </p>
              {userRole && <p className="text-[10px] text-slate-500">{userRole}</p>}
            </div>
            <div className="bg-primary rounded-full size-9 flex items-center justify-center text-white font-semibold text-sm border-2 border-white shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
          </button>

          {/* Profile Dropdown */}
          {profileMenuOpen && (
            <>
              {/* Backdrop to close menu when clicking outside */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileMenuOpen(false)}
              />
              
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-40">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{userName}</p>
                  {userRole && <p className="text-xs text-slate-500 mt-0.5">{userRole}</p>}
                </div>
                
                <div className="py-1">
                  <Link
                    href="/configuracoes"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                    Configurações
                  </Link>
                  
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex size-9 items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg md:hidden z-50">
          <nav className="flex flex-col p-4 gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  isActive(item.href)
                    ? item.isAI
                      ? 'text-ai-accent bg-purple-50'
                      : 'text-primary bg-primary/10 font-bold'
                    : item.isAI
                    ? 'text-ai-accent hover:bg-purple-50'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div className="border-t border-slate-200 mt-2 pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full px-4 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Sair
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
