'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useI18n } from '@/contexts';
import { useWebSocket } from '@/hooks';
import { API_URL, config } from '@/utils/config';
import { Notification } from '@/types/notifications';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface UseNotificationsReturn {
  // Notification state
  notifications: Notification[];
  toasts: Notification[];
  
  // Core notification functions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  showToast: (toast: Omit<Notification, 'id' | 'timestamp' | 'persistent'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  
  // Manual notification functions
  notifyTestStart: (testName: string, testId: string) => void;
  notifyTestSuccess: (testName: string, testId: string, duration?: number, executionId?: string) => void;
  notifyTestFailure: (testName: string, testId: string, error?: string, duration?: number, executionId?: string) => void;
  notifyTestSaved: (testName: string, testId: string) => void;
  notifyTestScheduled: (testName: string, testId: string, scheduleTime: string) => void;
  notifyTestImported: (testName: string, testId: string) => void;
  notifyExecutionStart: (workflowName: string, executionId: string) => void;
  notifyExecutionComplete: (workflowName: string, executionId: string, status: 'completed' | 'failed', duration?: number) => void;
  notifyTestDeleted: (testName: string, testId: string) => void;
  notifyTestDuplicated: (testName: string, testId: string) => void;
  notifyWorkflowLoaded: (workflowName: string) => void;
  
  // Real-time notification state
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: any;
  reconnect: () => void;
}

// ============================================================================
// useNotifications Hook
// ============================================================================

// Storage keys
const NOTIFICATIONS_STORAGE_KEY = 'testflow_notifications';
const ID_COUNTER_STORAGE_KEY = 'testflow_notification_counter';

// Storage helper functions
const saveNotificationsToStorage = (notifications: Notification[]) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    }
  } catch (error) {
    console.warn('Bildirimler localStorage\'a kaydedilemedi:', error);
  }
};

const loadNotificationsFromStorage = (): Notification[] => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((notification: any) => ({
          ...notification,
          timestamp: new Date(notification.timestamp)
        }));
      }
    }
  } catch (error) {
    console.warn('Bildirimler localStorage\'dan yüklenemedi:', error);
  }
  return [];
};

const saveCounterToStorage = (counter: number) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ID_COUNTER_STORAGE_KEY, counter.toString());
    }
  } catch (error) {
    console.warn('Sayaç localStorage\'a kaydedilemedi:', error);
  }
};

const loadCounterFromStorage = (): number => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(ID_COUNTER_STORAGE_KEY);
      return stored ? parseInt(stored, 10) : 0;
    }
  } catch (error) {
    console.warn('Sayaç localStorage\'dan yüklenemedi:', error);
  }
  return 0;
};

function useNotifications() {
  const { t } = useI18n();
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [idCounter, setIdCounter] = useState(0);

  // ============================================================================
  // Core Notification Functions
  // ============================================================================

  // Initialize notifications from storage
  useEffect(() => {
    const loadedNotifications = loadNotificationsFromStorage();
    const loadedCounter = loadCounterFromStorage();
    
    setNotifications(loadedNotifications);
    setIdCounter(loadedCounter);
    setIsInitialized(true);
  }, []);

  // Save notifications to storage
  useEffect(() => {
    if (isInitialized) {
      saveNotificationsToStorage(notifications);
    }
  }, [notifications, isInitialized]);

  // Save counter to storage
  useEffect(() => {
    if (isInitialized) {
      saveCounterToStorage(idCounter);
    }
  }, [idCounter, isInitialized]);

  const generateUniqueId = useCallback((prefix: string) => {
    const timestamp = Date.now();
    const counter = idCounter;
    setIdCounter(prev => prev + 1);
    return `${prefix}-${timestamp}-${counter}`;
  }, [idCounter]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const now = new Date();
    const isDuplicate = notifications.some(existing => 
      existing.type === notification.type &&
      existing.title === notification.title &&
      existing.testId === notification.testId &&
      existing.executionId === notification.executionId &&
      (now.getTime() - existing.timestamp.getTime()) < 5000
    );

    if (isDuplicate) {
      console.log('Skipping duplicate notification:', notification.title);
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: generateUniqueId('notif'),
      timestamp: new Date(),
      persistent: notification.persistent ?? true,
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
  }, [notifications, generateUniqueId]);

  const showToast = useCallback((toast: Omit<Notification, 'id' | 'timestamp' | 'persistent'>) => {
    const now = new Date();
    const isDuplicate = toasts.some(existing => 
      existing.type === toast.type &&
      existing.title === toast.title &&
      existing.message === toast.message &&
      existing.testId === toast.testId &&
      existing.executionId === toast.executionId &&
      (now.getTime() - existing.timestamp.getTime()) < 3000
    );

    if (isDuplicate) {
      console.log('Duplicate toast atlandı:', toast.title, toast.message);
      return;
    }

    const newToast: Notification = {
      ...toast,
      id: generateUniqueId('toast'),
      timestamp: new Date(),
      persistent: false,
      autoClose: toast.autoClose ?? true,
      duration: toast.duration ?? 5000
    };

    setToasts(prev => [...prev.slice(-4), newToast]);

    if (newToast.autoClose) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, newToast.duration);
    }
  }, [toasts, generateUniqueId]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('localStorage temizlenemedi:', error);
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Auto-cleanup toasts
  useEffect(() => {
    const interval = setInterval(() => {
      setToasts(prev => prev.filter(toast => {
        if (!toast.autoClose) return true;
        const elapsed = Date.now() - toast.timestamp.getTime();
        return elapsed < (toast.duration || 5000);
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // Manual Notification Functions
  // ============================================================================

  const notifyTestStart = (testName: string, testId: string) => {
    showToast({
      type: 'info',
      title: t('notifications.testStart'),
      message: t('notifications.testStartMessage', { testName }),
      testId,
      autoClose: true,
      duration: 3000
    });

    addNotification({
      type: 'info',
      title: t('notifications.testStart'),
      message: t('notifications.testStartMessage', { testName }),
      testId,
      persistent: true
    });
  };

  const notifyTestSuccess = (testName: string, testId: string, duration?: number, executionId?: string) => {
    const durationText = duration ? t('notifications.withDuration', { duration: (duration / 1000).toFixed(1) }) : '';
    
    showToast({
      type: 'success',
      title: t('notifications.testSuccess'),
      message: t('notifications.testSuccessMessage', { testName }) + durationText,
      testId,
      executionId,
      autoClose: true,
      duration: 5000
    });

    addNotification({
      type: 'success',
      title: t('notifications.testSuccess'),
      message: t('notifications.testSuccessMessage', { testName }) + durationText,
      testId,
      executionId,
      persistent: true
    });
  };

  const notifyTestFailure = (testName: string, testId: string, error?: string, duration?: number, executionId?: string) => {
    const durationText = duration ? t('notifications.withDuration', { duration: (duration / 1000).toFixed(1) }) : '';
    const errorText = error ? t('notifications.withError', { error }) : '';
    
    showToast({
      type: 'error',
      title: t('notifications.testFailed'),
      message: t('notifications.testFailedMessage', { testName }) + durationText + errorText,
      testId,
      executionId,
      autoClose: true,
      duration: 8000
    });

    addNotification({
      type: 'error',
      title: t('notifications.testFailed'),
      message: t('notifications.testFailedMessage', { testName }) + durationText + errorText,
      testId,
      executionId,
      persistent: true
    });
  };

  const notifyTestSaved = (testName: string, testId: string) => {
    showToast({
      type: 'success',
      title: t('notifications.testSaved'),
      message: t('notifications.testSavedMessage', { testName }),
      testId,
      autoClose: true,
      duration: 3000
    });
  };

  const notifyTestScheduled = (testName: string, testId: string, scheduleTime: string) => {
    showToast({
      type: 'info',
      title: t('notifications.testScheduled'),
      message: t('notifications.testScheduledMessage', { testName, scheduleTime }),
      testId,
      autoClose: true,
      duration: 4000
    });

    addNotification({
      type: 'info',
      title: t('notifications.testScheduled'),
      message: t('notifications.testScheduledMessage', { testName, scheduleTime }),
      testId,
      persistent: true
    });
  };

  const notifyTestImported = (testName: string, testId: string) => {
    showToast({
      type: 'success',
      title: t('notifications.testImported'),
      message: t('notifications.testImportedMessage', { testName }),
      testId,
      autoClose: true,
      duration: 3000
    });
  };

  const notifyExecutionStart = (workflowName: string, executionId: string) => {
    showToast({
      type: 'info',
      title: t('notifications.executionStarted'),
      message: t('notifications.executionStartedMessage', { workflowName }),
      executionId,
      autoClose: true,
      duration: 3000
    });

    addNotification({
      type: 'info',
      title: t('notifications.executionStarted'),
      message: t('notifications.executionStartedMessage', { workflowName }),
      executionId,
      persistent: true
    });
  };

  const notifyExecutionComplete = (workflowName: string, executionId: string, status: 'completed' | 'failed', duration?: number) => {
    const durationText = duration ? t('notifications.withDuration', { duration: (duration / 1000).toFixed(1) }) : '';
    const isSuccess = status === 'completed';
    
    showToast({
      type: isSuccess ? 'success' : 'error',
      title: isSuccess ? t('notifications.executionCompleted') : t('notifications.executionFailed'),
      message: (isSuccess ? t('notifications.executionCompletedMessage', { workflowName }) : t('notifications.executionFailedMessage', { workflowName })) + durationText,
      executionId,
      autoClose: true,
      duration: isSuccess ? 5000 : 8000
    });

    addNotification({
      type: isSuccess ? 'success' : 'error',
      title: isSuccess ? t('notifications.executionCompleted') : t('notifications.executionFailed'),
      message: (isSuccess ? t('notifications.executionCompletedMessage', { workflowName }) : t('notifications.executionFailedMessage', { workflowName })) + durationText,
      executionId,
      persistent: true
    });
  };

  const notifyTestDeleted = (testName: string, testId: string) => {
    showToast({
      type: 'info',
      title: t('notifications.testDeleted'),
      message: t('notifications.testDeletedMessage', { testName }),
      testId,
      autoClose: true,
      duration: 3000
    });
    addNotification({
      type: 'info',
      title: t('notifications.testDeleted'),
      message: t('notifications.testDeletedMessage', { testName }),
      testId,
      persistent: true
    });
  };

  const notifyTestDuplicated = (testName: string, testId: string) => {
    showToast({
      type: 'success',
      title: t('notifications.testDuplicated'),
      message: t('notifications.testDuplicatedMessage', { testName }),
      testId,
      autoClose: true,
      duration: 3000
    });
  };

  const notifyWorkflowLoaded = (workflowName: string) => {
    showToast({
      type: 'success',
      title: t('notifications.workflowLoaded'),
      message: t('notifications.workflowLoadedMessage', { workflowName }),
      autoClose: true,
      duration: 3000
    });
  };

  // ============================================================================
  // Real-time Notification Setup
  // ============================================================================

  // WebSocket bağlantısını sadece browser'da dene
  const wsUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_WS_URL || config.wsUrl) : '';
  const { isConnected, isConnecting, lastMessage, connect } = useWebSocket(wsUrl, {
    autoConnect: typeof window !== 'undefined',
    reconnectAttempts: 5,
    reconnectInterval: 3000
  });

  // ============================================================================
  // Real-time Message Processing
  // ============================================================================

  // Processed message IDs to prevent duplicates
  const processedMessageIds = useRef(new Set<string>());
  
  // Track execution states to prevent duplicate notifications
  const executionStates = useRef(new Map<string, Set<string>>());
  
  // Track last processed message to prevent rapid duplicates
  const lastProcessedMessage = useRef<string | null>(null);

  useEffect(() => {
    if (!lastMessage) return;

    // Create a unique ID for this message
    const messageId = `${lastMessage.type}-${lastMessage.data.executionId}`;
    
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
          
          const executionId = lastMessage.data.executionId;
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
          break;

        case 'step:started':
          console.log(`Step started: ${lastMessage.data.step?.type} in execution ${lastMessage.data.executionId}`);
          break;

        case 'step:completed':
          console.log(`Step completed: Progress ${lastMessage.data.progress}% in execution ${lastMessage.data.executionId}`);
          break;

        case 'step:failed':
          console.warn(`Step failed: ${lastMessage.data.error} in execution ${lastMessage.data.executionId}`);
          break;

        case 'execution:completed':
          console.log('Execution completed message:', lastMessage.data);
          
          const completedExecutionId = lastMessage.data.executionId;
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
          
          if (lastMessage.data.execution) {
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
          
          const failedExecutionId = lastMessage.data.executionId;
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
          
          if (lastMessage.data.execution) {
            const failedExecution = lastMessage.data.execution;
            const duration = failedExecution.endTime && failedExecution.startTime 
              ? new Date(failedExecution.endTime).getTime() - new Date(failedExecution.startTime).getTime()
              : undefined;
            
            notifyTestFailure(
              failedExecution.workflowName, 
              failedExecutionId, 
              lastMessage.data.error || failedExecution.error,
              duration
            );
          } else {
            notifyTestFailure('Test Execution', failedExecutionId, lastMessage.data.error || 'Unknown error');
          }
          break;

        case 'execution:cancelled':
          console.log('Execution cancelled message:', lastMessage.data);
          
          if (lastMessage.data.execution) {
            notifyTestFailure(
              lastMessage.data.execution.workflowName, 
              lastMessage.data.executionId, 
              'Test iptal edildi'
            );
          } else if (lastMessage.data.executionId) {
            notifyTestFailure('Test Execution', lastMessage.data.executionId, 'Test iptal edildi');
          }
          break;

        case 'execution:deleted':
          console.log(`Execution deleted: ${lastMessage.data?.executionId || 'unknown'}`);
          break;

        default:
          console.log('Unknown WebSocket message type:', lastMessage.type, lastMessage.data);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      console.error('Message was:', lastMessage);
    }
  }, [lastMessage, notifyTestSuccess, notifyTestFailure]);

  // ============================================================================
  // Cleanup Effects
  // ============================================================================

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

  // ============================================================================
  // Return Combined Interface
  // ============================================================================

  return {
    // Notification state
    notifications,
    toasts,
    
    // Core notification functions
    addNotification,
    showToast,
    removeNotification,
    clearAllNotifications,
    markAsRead,
    markAllAsRead,
    
    // Manual notification functions
    notifyTestStart,
    notifyTestSuccess,
    notifyTestFailure,
    notifyTestSaved,
    notifyTestScheduled,
    notifyTestImported,
    notifyExecutionStart,
    notifyExecutionComplete,
    notifyTestDeleted,
    notifyTestDuplicated,
    notifyWorkflowLoaded,
    
    // Real-time notification state
    isConnected,
    isConnecting,
    lastMessage,
    reconnect: connect
  };
}

export default useNotifications;
