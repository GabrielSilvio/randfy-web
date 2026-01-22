'use client';

/**
 * Initialize Sentry on client-side
 * This component runs only on the client
 */

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import('../sentry.client.config');
}

export default function SentryInit() {
  return null;
}
