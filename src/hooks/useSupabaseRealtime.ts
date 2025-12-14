'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface RealtimeMessage {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  oldData?: any;
  timestamp: string;
}

export interface RealtimeOptions {
  workspaceId: string | null;
  onExecutionChange?: (payload: RealtimeMessage) => void;
  onTestChange?: (payload: RealtimeMessage) => void;
  onScheduledTestChange?: (payload: RealtimeMessage) => void;
}

export interface RealtimeHookReturn {
  isConnected: boolean;
  lastMessage: RealtimeMessage | null;
  disconnect: () => void;
  connect: () => void;
}

// ============================================================================
// Supabase client (singleton)
// ============================================================================

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient && typeof window !== 'undefined') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (url && anonKey) {
      supabaseClient = createClient(url, anonKey);
    }
  }
  return supabaseClient;
}

// ============================================================================
// useSupabaseRealtime Hook
// ============================================================================

function useSupabaseRealtime(options: RealtimeOptions): RealtimeHookReturn {
  const { workspaceId, onExecutionChange, onTestChange, onScheduledTestChange } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const callbacksRef = useRef({ onExecutionChange, onTestChange, onScheduledTestChange });
  
  // Update callbacks ref
  callbacksRef.current = { onExecutionChange, onTestChange, onScheduledTestChange };

  const createMessage = useCallback((eventType: 'INSERT' | 'UPDATE' | 'DELETE', table: string, payload: any): RealtimeMessage => {
    return {
      type: eventType,
      table,
      data: payload.new || payload,
      oldData: payload.old,
      timestamp: new Date().toISOString()
    };
  }, []);

  const connect = useCallback(() => {
    if (!workspaceId || typeof window === 'undefined') {
      console.log('[Supabase Realtime] No workspaceId or not in browser');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('[Supabase Realtime] Client not available');
      return;
    }

    // Clean up existing channels
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    console.log('[Supabase Realtime] Connecting for workspace:', workspaceId);

    // Subscribe to Execution changes
    const executionChannel = supabase
      .channel(`executions:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Execution',
          filter: `workspaceId=eq.${workspaceId}`
        },
        (payload) => {
          console.log('[Supabase Realtime] Execution change:', payload.eventType);
          const message = createMessage(payload.eventType as any, 'Execution', payload);
          setLastMessage(message);
          callbacksRef.current.onExecutionChange?.(message);
        }
      )
      .subscribe((status) => {
        console.log('[Supabase Realtime] Execution channel status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    channelsRef.current.push(executionChannel);

    // Subscribe to Test changes
    const testChannel = supabase
      .channel(`tests:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Test',
          filter: `workspaceId=eq.${workspaceId}`
        },
        (payload) => {
          console.log('[Supabase Realtime] Test change:', payload.eventType);
          const message = createMessage(payload.eventType as any, 'Test', payload);
          setLastMessage(message);
          callbacksRef.current.onTestChange?.(message);
        }
      )
      .subscribe();

    channelsRef.current.push(testChannel);

    // Subscribe to ScheduledTest changes
    const scheduledChannel = supabase
      .channel(`scheduled:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ScheduledTest',
          filter: `workspaceId=eq.${workspaceId}`
        },
        (payload) => {
          console.log('[Supabase Realtime] ScheduledTest change:', payload.eventType);
          const message = createMessage(payload.eventType as any, 'ScheduledTest', payload);
          setLastMessage(message);
          callbacksRef.current.onScheduledTestChange?.(message);
        }
      )
      .subscribe();

    channelsRef.current.push(scheduledChannel);

  }, [workspaceId, createMessage]);

  const disconnect = useCallback(() => {
    console.log('[Supabase Realtime] Disconnecting...');
    
    const supabase = getSupabaseClient();
    if (supabase) {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
    }
    channelsRef.current = [];
    setIsConnected(false);
  }, []);

  // Effect to handle connection based on workspaceId changes
  useEffect(() => {
    if (workspaceId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [workspaceId, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    disconnect,
    connect
  };
}

export default useSupabaseRealtime;

// ============================================================================
// Individual table hooks for convenience
// ============================================================================

export function useExecutionRealtime(workspaceId: string | null, onUpdate?: (data: any) => void) {
  return useSupabaseRealtime({
    workspaceId,
    onExecutionChange: onUpdate ? (msg) => onUpdate(msg.data) : undefined
  });
}

export function useTestRealtime(workspaceId: string | null, onUpdate?: (data: any) => void) {
  return useSupabaseRealtime({
    workspaceId,
    onTestChange: onUpdate ? (msg) => onUpdate(msg.data) : undefined
  });
}

export function useScheduledTestRealtime(workspaceId: string | null, onUpdate?: (data: any) => void) {
  return useSupabaseRealtime({
    workspaceId,
    onScheduledTestChange: onUpdate ? (msg) => onUpdate(msg.data) : undefined
  });
}

