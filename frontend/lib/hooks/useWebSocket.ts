'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getAccessToken } from '@/lib/api/client';

type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  onMessage?: (event: MessageEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnects?: number;
}

export function useWebSocket(path: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnects = 5,
  } = options;

  const [status, setStatus] = useState<WSStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';

  const connect = useCallback(() => {
    if (!process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET || process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'false') {
      return;
    }

    const token = getAccessToken();
    const url = `${WS_URL}${path}${token ? `?token=${token}` : ''}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      setStatus('connecting');

      ws.onopen = () => {
        setStatus('connected');
        reconnectCountRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        onMessage?.(event);
      };

      ws.onclose = () => {
        setStatus('disconnected');
        onDisconnect?.();

        if (autoReconnect && reconnectCountRef.current < maxReconnects) {
          reconnectCountRef.current++;
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval * Math.pow(1.5, reconnectCountRef.current));
        }
      };

      ws.onerror = () => {
        setStatus('error');
        ws.close();
      };
    } catch {
      setStatus('error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('disconnected');
  }, []);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return { status, send, connect, disconnect };
}

// Real-time property updates hook
export function usePropertyUpdates(onUpdate: (propertyId: string, update: unknown) => void) {
  const { status } = useWebSocket('/ws/properties', {
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'property_update') {
          onUpdate(data.property_id, data.update);
        }
      } catch {
        // Ignore parse errors
      }
    },
  });

  return status;
}

// Real-time notifications hook
export function useNotifications(onNotification: (notification: unknown) => void) {
  const { status } = useWebSocket('/ws/notifications', {
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          onNotification(data.payload);
        }
      } catch {
        // Ignore parse errors
      }
    },
  });

  return status;
}
