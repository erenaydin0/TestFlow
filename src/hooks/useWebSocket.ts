'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface WebSocketHookReturn {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  disconnect: () => void;
  connect: () => void;
}

export function useWebSocket(url: string, options?: {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}): WebSocketHookReturn {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000
  } = options || {};

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!url || typeof window === 'undefined') {
      console.log('WebSocket: URL not available or not in browser');
      return;
    }

    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);

    try {
      console.log('WebSocket: Attempting to connect to', url);
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectCount.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          console.log('Raw WebSocket message:', event.data);
          const parsed = JSON.parse(event.data);
          console.log('Parsed WebSocket message:', parsed);
          
          // Backend'den gelen mesajlar doğrudan obje olarak geliyor
          // Bizim WebSocketMessage interface'ine uygun hale getir
          const message: WebSocketMessage = {
            type: parsed.type || 'unknown',
            data: parsed, // Tüm parsed data'yı data olarak ver
            timestamp: new Date().toISOString()
          };
          
          setLastMessage(message);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
          console.error('Raw message was:', event.data);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          url: url
        });
        setIsConnected(false);
        setIsConnecting(false);

        // Otomatik yeniden bağlanma
        if (reconnectCount.current < reconnectAttempts) {
          reconnectCount.current++;
          console.log(`WebSocket reconnect attempt ${reconnectCount.current}/${reconnectAttempts} in ${reconnectInterval}ms`);
          
          reconnectTimeoutId.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          console.log('WebSocket max reconnect attempts reached');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket URL:', url);
        console.error('WebSocket readyState:', ws.current?.readyState);
        setIsConnecting(false);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnecting(false);
    }
  }, [url, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
      reconnectTimeoutId.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    reconnectCount.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    lastMessage,
    sendMessage,
    disconnect,
    connect
  };
}
