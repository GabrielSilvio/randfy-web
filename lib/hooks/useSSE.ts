'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { CONFIG } from '@/lib/config/constants';

const RECONNECT_INTERVAL_MS = 5000;

export interface SSEMessageEvent {
  tenant_id?: number;
  from?: string;
  to?: string;
  text?: string;
  timestamp?: string;
  message_id?: string;
  push_name?: string;
  phone_number?: string;
  [key: string]: unknown;
}

export interface UseSSEOptions {
  tenantId: number | null;
  onMessage?: (data: SSEMessageEvent) => void;
  enabled?: boolean;
}

export interface UseSSEReturn {
  isConnected: boolean;
  lastEvent: SSEMessageEvent | null;
  disconnect: () => void;
}

/**
 * Hook to connect to GET /api/tenants/{tenantId}/chat/stream via EventSource.
 * Since EventSource does not support custom headers, the JWT is passed as ?token=...
 */
export function useSSE({ tenantId, onMessage, enabled = true }: UseSSEOptions): UseSSEReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEMessageEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !enabled || tenantId == null) {
      return;
    }

    let mounted = true;

    const connect = async () => {
      try {
        const token = await apiClient.getToken();
        const baseUrl = CONFIG.API.BASE_URL || '';
        const url = `${baseUrl}/api/tenants/${tenantId}/chat/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.addEventListener('connected', () => {
          if (mounted) setIsConnected(true);
        });

        es.addEventListener('message', (event: MessageEvent) => {
          if (!mounted) return;
          try {
            const data = JSON.parse(event.data || '{}') as SSEMessageEvent;
            setLastEvent(data);
            onMessageRef.current?.(data);
          } catch {
            // ignore parse errors
          }
        });

        es.onerror = () => {
          es.close();
          eventSourceRef.current = null;
          if (mounted) setIsConnected(false);
          if (mounted && enabled) {
            reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_INTERVAL_MS);
          }
        };

        es.onclose = () => {
          if (mounted) setIsConnected(false);
          eventSourceRef.current = null;
          if (mounted && enabled) {
            reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_INTERVAL_MS);
          }
        };
      } catch (err) {
        console.error('SSE connect error:', err);
        if (mounted && enabled) {
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_INTERVAL_MS);
        }
      }
    };

    connect();

    return () => {
      mounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [tenantId, enabled]);

  return { isConnected, lastEvent, disconnect };
}
