'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import useSupabaseRealtime, { RealtimeMessage } from './useSupabaseRealtime';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface UseNotificationSocketProps {
    notifyTestStart: (testName: string, testId: string) => void;
    notifyTestSuccess: (testName: string, testId: string, duration?: number, executionId?: string) => void;
    notifyTestFailure: (testName: string, testId: string, error?: string, duration?: number, executionId?: string) => void;
    notifyWorkflowLoaded: (workflowName: string) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get active workspace ID from localStorage
 */
const getActiveWorkspaceId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('selectedWorkspaceId');
};

// ============================================================================
// Hook - Now using Supabase Realtime instead of WebSocket
// ============================================================================

export function useNotificationSocket({
    notifyTestStart,
    notifyTestSuccess,
    notifyTestFailure,
    notifyWorkflowLoaded
}: UseNotificationSocketProps) {
    // Get session to check if user is logged in
    const { data: session, status } = useSession();
    const isSessionAuthenticated = status === 'authenticated' && !!session?.user;
    
    // Track workspace ID in state
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);
    
    // Track notified executions to prevent duplicates
    const notifiedExecutions = useRef(new Map<string, Set<string>>());
    
    // Store callbacks in ref to avoid stale closures
    const callbacksRef = useRef({ notifyTestStart, notifyTestSuccess, notifyTestFailure, notifyWorkflowLoaded });
    callbacksRef.current = { notifyTestStart, notifyTestSuccess, notifyTestFailure, notifyWorkflowLoaded };

    // Update workspace ID when session changes or on mount
    useEffect(() => {
        if (!isSessionAuthenticated) {
            setWorkspaceId(null);
            return;
        }
        
        const updateWorkspaceId = () => {
            const wsId = getActiveWorkspaceId();
            if (wsId) {
                setWorkspaceId(wsId);
            }
        };
        
        // Check immediately
        updateWorkspaceId();
        
        // Listen for localStorage changes (workspace switch)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'selectedWorkspaceId') {
                updateWorkspaceId();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // Also poll periodically for workspace changes (same-tab changes don't trigger storage events)
        const pollInterval = setInterval(updateWorkspaceId, 2000);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(pollInterval);
        };
    }, [isSessionAuthenticated]);

    // Handle execution changes from Supabase Realtime
    const handleExecutionChange = useCallback((message: RealtimeMessage) => {
        const execution = message.data;
        const executionId = execution?.id;
        
        if (!executionId) return;
        
        // Initialize tracking for this execution
        if (!notifiedExecutions.current.has(executionId)) {
            notifiedExecutions.current.set(executionId, new Set());
        }
        const notifiedStates = notifiedExecutions.current.get(executionId)!;
        
        const workflowName = execution.workflowName || 'Test Execution';
        const status = execution.status;
        
        // Calculate duration if available
        const duration = execution.endTime && execution.startTime
            ? new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()
            : undefined;

        // Handle based on event type and status
        if (message.type === 'INSERT') {
            // New execution created (queued, pending, or running)
            if (!notifiedStates.has('started') && (status === 'queued' || status === 'running' || status === 'pending')) {
                notifiedStates.add('started');
                console.log('[Supabase Realtime] Execution queued/started:', workflowName, status);
                callbacksRef.current.notifyTestStart(workflowName, executionId);
            }
        } else if (message.type === 'UPDATE') {
            const oldStatus = message.oldData?.status;
            
            // Started: status changed to 'running'
            if (status === 'running' && oldStatus !== 'running' && !notifiedStates.has('started')) {
                notifiedStates.add('started');
                console.log('[Supabase Realtime] Execution started:', workflowName);
                callbacksRef.current.notifyTestStart(workflowName, executionId);
            }
            
            // Completed successfully
            if (status === 'completed' && !notifiedStates.has('completed')) {
                notifiedStates.add('completed');
                console.log('[Supabase Realtime] Execution completed:', workflowName);
                callbacksRef.current.notifyTestSuccess(workflowName, executionId, duration, executionId);
            }
            
            // Failed
            if (status === 'failed' && !notifiedStates.has('failed')) {
                notifiedStates.add('failed');
                console.log('[Supabase Realtime] Execution failed:', workflowName);
                callbacksRef.current.notifyTestFailure(
                    workflowName, 
                    executionId, 
                    execution.error || 'Test failed',
                    duration,
                    executionId
                );
            }
            
            // Cancelled
            if (status === 'cancelled' && !notifiedStates.has('cancelled')) {
                notifiedStates.add('cancelled');
                console.log('[Supabase Realtime] Execution cancelled:', workflowName);
                callbacksRef.current.notifyTestFailure(
                    workflowName, 
                    executionId, 
                    'Test iptal edildi',
                    duration,
                    executionId
                );
            }
        }

        // Clean up old entries periodically
        if (notifiedExecutions.current.size > 100) {
            const entries = Array.from(notifiedExecutions.current.entries());
            notifiedExecutions.current.clear();
            entries.slice(-50).forEach(([key, value]) => {
                notifiedExecutions.current.set(key, value);
            });
        }
    }, []);

    // Handle test changes (e.g., new test imported)
    const handleTestChange = useCallback((message: RealtimeMessage) => {
        if (message.type === 'INSERT') {
            const test = message.data;
            if (test?.name) {
                console.log('[Supabase Realtime] New test created:', test.name);
                // Could add notification here if desired
            }
        }
    }, []);

    // Use Supabase Realtime hook
    const { isConnected, lastMessage, connect } = useSupabaseRealtime({
        workspaceId,
        onExecutionChange: handleExecutionChange,
        onTestChange: handleTestChange
    });

    return {
        isConnected,
        isConnecting: false, // Supabase handles this internally
        isAuthenticated: isConnected,
        lastMessage,
        connect
    };
}
