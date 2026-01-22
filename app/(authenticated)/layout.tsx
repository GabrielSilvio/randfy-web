'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, CurrentUserResponse } from '@/lib/api';
import { AppHeader } from '@/components/layout/app-header';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const checkAuth = async () => {
      try {
        const isAuthenticated = await apiClient.isAuthenticated();
        
        if (!isAuthenticated) {
          router.push('/login');
          return;
        }

        const userData = await apiClient.getCurrentUser();
        
        // Check if user needs onboarding (no tenant or tenant_id is 0)
        const tenantId = userData.user?.tenant_id;
        if (!tenantId || tenantId === 0) {
          router.push('/onboarding');
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isClient, router]);

  const handleLogout = async () => {
    await apiClient.logout();
    router.push('/login');
  };

  // Avoid rendering on server or while loading
  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header Skeleton */}
        <header className="flex-none flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
          <div className="flex items-center gap-8">
            <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"></div>
            <div className="hidden md:flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-20 bg-slate-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 bg-slate-200 rounded-full animate-pulse"></div>
            <div className="h-9 w-9 bg-slate-200 rounded-full animate-pulse"></div>
          </div>
        </header>
        
        {/* Content Skeleton */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-slate-200 h-32 rounded-xl mb-8 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-200 h-24 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen">
      <AppHeader
        userName={user.user?.name || 'Usuário'}
        userRole={user.user?.role}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
