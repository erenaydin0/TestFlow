'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useWebSocket } from '@/hooks';
import { config } from '@/utils/config';

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
// Hook
// ============================================================================

export function useNotificationSocket({
    notifyTestStart,
    notifyTestSuccess,
    notifyTestFailure,
    notifyWorkflowLoaded
}: UseNotificationSocketProps) {
    // Get session to check if user is logged in and get accessToken
    const { data: session, status } = useSession();
    const isSessionAuthenticated = status === 'authenticated' && !!session?.user;
    
    // Get accessToken from session (added in auth.ts callback)
    const accessToken = (session as any)?.accessToken as string | undefined;
    
    // Track auth credentials in state to properly trigger re-renders
    const [authCredentials, setAuthCredentials] = useState<{ token: string | null; workspaceId: string | null }>({
        token: null,
        workspaceId: null
    });
    
    // Effect to update auth credentials when session changes or component mounts
    useEffect(() => {
        if (!isSessionAuthenticated || !accessToken) {
            setAuthCredentials({ token: null, workspaceId: null });
            return;
        }
        
        const updateCredentials = () => {
            const workspaceId = getActiveWorkspaceId();
            
            console.log('[NotificationSocket] Auth credentials check:', {
                hasSession: isSessionAuthenticated,
                hasToken: !!accessToken,
                hasWorkspaceId: !!workspaceId,
                tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : null,
                workspaceId
            });
            
            // Only update if we have both
            if (accessToken && workspaceId) {
                setAuthCredentials({ token: accessToken, workspaceId });
            }
        };
        
        // Check immediately
        updateCredentials();
        
        // Listen for localStorage changes (workspace switch)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'selectedWorkspaceId') {
                updateCredentials();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [isSessionAuthenticated, accessToken]);
    
    // WebSocket connection with authentication
    const wsUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_WS_URL || config.wsUrl) : '';
    const { isConnected, isConnecting, isAuthenticated, lastMessage, connect } = useWebSocket(wsUrl, {
        autoConnect: true,
        reconnectAttempts: 5,
        reconnectInterval: config.wsReconnectInterval,
        auth: authCredentials
    });

    // Processed message IDs to prevent duplicates
    const processedMessageIds = useRef(new Set<string>());

    // Track execution states to prevent duplicate notifications
    const executionStates = useRef(new Map<string, Set<string>>());

    // Track last processed message to prevent rapid duplicates
    const lastProcessedMessage = useRef<string | null>(null);

    // Process incoming messages
    useEffect(() => {
        if (!lastMessage) return;
        
        // Skip if not authenticated (server-side filtering handles workspace isolation)
        if (!isAuthenticated) {
            return;
        }

        // Create a unique ID for this message
        const messageId = `${lastMessage.type}-${lastMessage.data?.executionId || 'unknown'}`;

        // Skip if this is the exact same message as the last one
        if (lastProcessedMessage.current === messageId) {
            return;
        }

        // Skip if already processed
        if (processedMessageIds.current.has(messageId)) {
            return;
        }

        // Mark as processed
        processedMessageIds.current.add(messageId);
        lastProcessedMessage.current = messageId;

        // Clean old message IDs (keep only last 20)
        if (processedMessageIds.current.size > 20) {
            const idsArray = Array.from(processedMessageIds.current);
            processedMessageIds.current.clear();
            idsArray.slice(-10).forEach(id => processedMessageIds.current.add(id));
        }

        try {
            switch (lastMessage.type) {
                case 'execution:started':
                    console.log('Execution started message:', lastMessage.data);

                    const executionId = lastMessage.data?.executionId;
                    if (!executionId) break;

                    // Check if already notified for this execution
                    if (!executionStates.current.has(executionId)) {
                        executionStates.current.set(executionId, new Set());
                    }

                    const states = executionStates.current.get(executionId)!;
                    if (states.has('started')) {
                        console.log('Already notified start for execution:', executionId);
                        break;
                    }

                    states.add('started');

                    // Trigger test start notification
                    if (lastMessage.data?.execution) {
                        const execution = lastMessage.data.execution;
                        notifyTestStart(execution.workflowName, executionId);
                    } else {
                        notifyTestStart('Test Execution', executionId);
                    }
                    break;

                case 'execution:scheduled':
                    console.log('Execution scheduled message:', lastMessage.data);

                    if (lastMessage.data?.execution?.workflowName) {
                        notifyWorkflowLoaded(lastMessage.data.execution.workflowName);
                    }
                    break;

                case 'step:started':
                    console.log(`Step started: ${lastMessage.data?.step?.type} in execution ${lastMessage.data?.executionId}`);
                    break;

                case 'step:completed':
                    console.log(`Step completed: Progress ${lastMessage.data?.progress}% in execution ${lastMessage.data?.executionId}`);
                    break;

                case 'step:failed':
                    console.warn(`Step failed: ${lastMessage.data?.error} in execution ${lastMessage.data?.executionId}`);
                    break;

                case 'execution:completed':
                    console.log('Execution completed message:', lastMessage.data);

                    const completedExecutionId = lastMessage.data?.executionId;
                    if (!completedExecutionId) break;

                    // Check if already notified completion for this execution
                    if (!executionStates.current.has(completedExecutionId)) {
                        executionStates.current.set(completedExecutionId, new Set());
                    }

                    const completedStates = executionStates.current.get(completedExecutionId)!;
                    if (completedStates.has('completed')) {
                        console.log('Already notified completion for execution:', completedExecutionId);
                        break;
                    }

                    completedStates.add('completed');

                    // Clean up all messages for this execution to prevent further duplicates
                    const completedExecutionMessagePrefix = `-${completedExecutionId}`;
                    const completedMessagesToRemove = Array.from(processedMessageIds.current)
                        .filter(id => id.includes(completedExecutionMessagePrefix));
                    completedMessagesToRemove.forEach(id => processedMessageIds.current.delete(id));

                    if (lastMessage.data?.execution) {
                        const completedExecution = lastMessage.data.execution;
                        const duration = completedExecution.endTime && completedExecution.startTime
                            ? new Date(completedExecution.endTime).getTime() - new Date(completedExecution.startTime).getTime()
                            : undefined;

                        notifyTestSuccess(
                            completedExecution.workflowName,
                            completedExecutionId,
                            duration
                        );
                    } else {
                        notifyTestSuccess('Test Execution', completedExecutionId);
                    }
                    break;

                case 'execution:failed':
                    console.log('Execution failed message:', lastMessage.data);

                    const failedExecutionId = lastMessage.data?.executionId;
                    if (!failedExecutionId) break;

                    // Check if already notified failure for this execution
                    if (!executionStates.current.has(failedExecutionId)) {
                        executionStates.current.set(failedExecutionId, new Set());
                    }

                    const failedStates = executionStates.current.get(failedExecutionId)!;
                    if (failedStates.has('failed')) {
                        console.log('Already notified failure for execution:', failedExecutionId);
                        break;
                    }

                    failedStates.add('failed');

                    // Clean up all messages for this execution to prevent further duplicates
                    const failedExecutionMessagePrefix = `-${failedExecutionId}`;
                    const failedMessagesToRemove = Array.from(processedMessageIds.current)
                        .filter(id => id.includes(failedExecutionMessagePrefix));
                    failedMessagesToRemove.forEach(id => processedMessageIds.current.delete(id));

                    if (lastMessage.data?.execution) {
                        const failedExecution = lastMessage.data.execution;
                        const duration = failedExecution.endTime && failedExecution.startTime
                            ? new Date(failedExecution.endTime).getTime() - new Date(failedExecution.startTime).getTime()
                            : undefined;

                        notifyTestFailure(
                            failedExecution.workflowName,
                            failedExecutionId,
                            lastMessage.data?.error || failedExecution.error,
                            duration
                        );
                    } else {
                        notifyTestFailure('Test Execution', failedExecutionId, lastMessage.data?.error || 'Unknown error');
                    }
                    break;

                case 'execution:cancelled':
                    console.log('Execution cancelled message:', lastMessage.data);

                    if (lastMessage.data?.execution) {
                        notifyTestFailure(
                            lastMessage.data.execution.workflowName,
                            lastMessage.data.executionId,
                            'Test iptal edildi'
                        );
                    } else if (lastMessage.data?.executionId) {
                        notifyTestFailure('Test Execution', lastMessage.data.executionId, 'Test iptal edildi');
                    }
                    break;

                case 'execution:deleted':
                    console.log(`Execution deleted: ${lastMessage.data?.executionId || 'unknown'}`);
                    break;

                default:
                    // Ignore auth messages and unknown types silently
                    if (!lastMessage.type?.startsWith('auth:')) {
                        console.log('Unknown WebSocket message type:', lastMessage.type);
                    }
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
            console.error('Message was:', lastMessage);
        }
    }, [lastMessage, notifyTestSuccess, notifyTestFailure, notifyTestStart, notifyWorkflowLoaded, isAuthenticated]);

    // Clean up old execution states periodically
    useEffect(() => {
        const interval = setInterval(() => {
            if (executionStates.current.size > 50) {
                // Keep only the last 25 executions
                const entries = Array.from(executionStates.current.entries());
                executionStates.current.clear();
                entries.slice(-25).forEach(([key, value]) => {
                    executionStates.current.set(key, value);
                });
            }
        }, 60000); // Every minute

        return () => clearInterval(interval);
    }, []);

    return {
        isConnected,
        isConnecting,
        isAuthenticated,
        lastMessage,
        connect
    };
}
