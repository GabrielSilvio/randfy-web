import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Usado por load balancers, monitoring e CI/CD
 */
export async function GET() {
  const startTime = Date.now();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {
      backend: 'unknown',
    },
  };

  // Verificar conectividade com backend (opcional)
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (backendUrl) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${backendUrl}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      health.checks.backend = response.ok ? 'healthy' : 'unhealthy';
    }
  } catch (error) {
    health.checks.backend = 'unreachable';
  }

  const duration = Date.now() - startTime;

  // Retornar status 503 se algum check crítico falhar
  const isHealthy = health.checks.backend !== 'unhealthy';
  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      ...health,
      responseTime: `${duration}ms`,
    },
    { status: statusCode }
  );
}
