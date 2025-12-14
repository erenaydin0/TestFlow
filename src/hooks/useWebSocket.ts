'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { config } from '@/utils/config';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface WebSocketAuthOptions {
  token: string | null;
  workspaceId: string | null;
}

export interface WebSocketHookOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  auth?: WebSocketAuthOptions;
}

export interface WebSocketHookReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  disconnect: () => void;
  connect: () => void;
}

// ============================================================================
// useWebSocket Hook
// ============================================================================

function useWebSocket(url: string, options?: WebSocketHookOptions): WebSocketHookReturn {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = config.wsReconnectInterval,
    auth
  } = options || {};

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);
  
  // Store auth options in ref to avoid stale closures
  const authRef = useRef(auth);
  authRef.current = auth;

  const connect = useCallback(() => {
    if (!url || typeof window === 'undefined') {
      // Silently skip when URL is not available (expected in serverless mode)
      return;
    }

    // Don't connect without auth credentials
    if (!authRef.current?.token || !authRef.current?.workspaceId) {
      console.log('WebSocket: Auth credentials not available, skipping connection');
      return;
    }

    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket: Already connected');
      return;
    }

    // Clean up previous connection
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    console.log(`WebSocket: Attempting connection ${reconnectCount.current + 1}/${reconnectAttempts + 1}`);
    setIsConnecting(true);
    setIsAuthenticated(false);

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket: Connection opened, sending auth...');
        
        // Send auth message immediately after connection
        if (ws.current && authRef.current?.token && authRef.current?.workspaceId) {
          ws.current.send(JSON.stringify({
            type: 'auth',
            token: authRef.current.token,
            workspaceId: authRef.current.workspaceId
          }));
        } else {
          console.error('WebSocket: No auth credentials available');
          ws.current?.close();
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          
          // Handle auth:success message
          if (parsed.type === 'auth:success') {
            console.log('WebSocket: Authentication successful', {
              clientId: parsed.clientId,
              userId: parsed.userId,
              workspaceId: parsed.workspaceId
            });
            setIsConnected(true);
            setIsConnecting(false);
            setIsAuthenticated(true);
            reconnectCount.current = 0;
            return;
          }

          // Handle other messages
          const message: WebSocketMessage = {
            type: parsed.type || 'unknown',
            data: parsed,
            timestamp: new Date().toISOString()
          };
          
          setLastMessage(message);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        setIsConnected(false);
        setIsConnecting(false);
        setIsAuthenticated(false);

        // Handle auth-related close codes
        if (event.code === 4001) {
          console.warn('WebSocket: Auth timeout');
          return; // Don't reconnect on auth timeout
        }
        if (event.code === 4002) {
          console.warn('WebSocket: Invalid token');
          return; // Don't reconnect on invalid token
        }
        if (event.code === 4003) {
          console.warn('WebSocket: Workspace ID required');
          return; // Don't reconnect on missing workspace
        }

        // Auto-reconnect for other close reasons
        if (reconnectCount.current < reconnectAttempts && authRef.current?.token) {
          reconnectCount.current++;
          console.log(`WebSocket: Reconnect attempt ${reconnectCount.current}/${reconnectAttempts} in ${reconnectInterval}ms`);
          
          reconnectTimeoutId.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          console.log('WebSocket: Max reconnect attempts reached or no auth');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
        setIsConnected(false);
        setIsAuthenticated(false);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnecting(false);
    }
  }, [url, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    console.log('WebSocket: Manual disconnect requested');
    
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
      reconnectTimeoutId.current = null;
    }

    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      
      ws.current.close();
      ws.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsAuthenticated(false);
    reconnectCount.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN && isAuthenticated) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected or not authenticated');
    }
  }, [isAuthenticated]);

  // Track previous auth to detect changes
  const prevAuthRef = useRef<{ token: string | null; workspaceId: string | null } | null>(null);
  
  // Effect to handle connection based on auth changes
  useEffect(() => {
    const hasValidAuth = auth?.token && auth?.workspaceId;
    const prevAuth = prevAuthRef.current;
    const hadValidAuth = prevAuth?.token && prevAuth?.workspaceId;
    
    // Check if auth actually changed
    const authChanged = prevAuth === null || 
      prevAuth.token !== auth?.token || 
      prevAuth.workspaceId !== auth?.workspaceId;
    
    // Update ref
    prevAuthRef.current = auth ? { token: auth.token, workspaceId: auth.workspaceId } : null;
    
    if (!authChanged) {
      return; // No change, don't do anything
    }
    
    console.log('[WebSocket] Auth changed:', {
      hasValidAuth,
      hadValidAuth,
      hasToken: !!auth?.token,
      hasWorkspaceId: !!auth?.workspaceId
    });
    
    if (autoConnect && hasValidAuth) {
      connect();
    } else if (hadValidAuth && !hasValidAuth) {
      // Only disconnect if we previously had valid auth and now we don't
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, auth?.token, auth?.workspaceId, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    isAuthenticated,
    lastMessage,
    sendMessage,
    disconnect,
    connect
  };
}

export default useWebSocket;
