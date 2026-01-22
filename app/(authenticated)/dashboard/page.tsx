'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to daily page
    router.replace('/daily');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin inline-block w-10 h-10 border-2 border-primary border-t-transparent rounded-full"></div>
        <p className="text-slate-500 mt-4">Redirecionando...</p>
      </div>
    </div>
  );
}
