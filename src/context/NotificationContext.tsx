'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useI18n } from '@/hooks/useI18n';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import { config } from '@/utils/config';
import { getItem, setItem, removeItem } from '@/utils/storage';


// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    read?: boolean; // Okundu durumu
    persistent?: boolean; // Kalıcı bildirimler için
    autoClose?: boolean; // Otomatik kapanma
    duration?: number; // ms cinsinden
    testId?: string; // Test ile ilişkili bildirimler için
    executionId?: string; // Execution ile ilişkili bildirimler için
}

export interface NotificationContextType {
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

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { t } = useI18n();
    const { data: session } = useSession();

    // Get user ID from session
    const userId = (session?.user as any)?.id;

    // Storage keys - user-specific
    const storageKeys = useMemo(() => ({
        notifications: userId
            ? `${config.storageKeys.notifications}_${userId}`
            : config.storageKeys.notifications,
        idCounter: userId
            ? `${config.storageKeys.idCounter}_${userId}`
            : config.storageKeys.idCounter
    }), [userId]);

    // Notification State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [toasts, setToasts] = useState<Notification[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const idCounterRef = useRef<number>(0);
    const previousUserIdRef = useRef<string | undefined>(undefined);

    // ============================================================================
    // Core Notification Functions
    // ============================================================================

    // Initialize notifications from storage (user-specific)
    useEffect(() => {
        // If no user ID, clear notifications and wait for login
        if (!userId) {
            setNotifications([]);
            setIsInitialized(false);
            previousUserIdRef.current = undefined;
            return;
        }

        // Check if user changed
        if (previousUserIdRef.current !== userId) {
            previousUserIdRef.current = userId;

            const loadedNotifications = getItem<Notification[]>(storageKeys.notifications, []);
            // Parse dates from strings
            const parsedNotifications = loadedNotifications.map(n => ({
                ...n,
                timestamp: new Date(n.timestamp)
            }));

            const loadedCounter = getItem<number>(storageKeys.idCounter, 0);

            setNotifications(parsedNotifications);
            idCounterRef.current = loadedCounter;
            setIsInitialized(true);
        }
    }, [userId, storageKeys]);

    // Save notifications to storage (user-specific)
    useEffect(() => {
        if (isInitialized && userId) {
            setItem(storageKeys.notifications, notifications);
        }
    }, [notifications, isInitialized, userId, storageKeys]);

    // Save counter to storage periodically (user-specific)
    useEffect(() => {
        if (!isInitialized || !userId) return;

        const interval = setInterval(() => {
            setItem(storageKeys.idCounter, idCounterRef.current);
        }, config.notification.autoSaveInterval);

        return () => clearInterval(interval);
    }, [isInitialized, userId, storageKeys]);

    const generateUniqueId = useCallback((prefix: string) => {
        const timestamp = Date.now();
        const counter = idCounterRef.current;
        idCounterRef.current = counter + 1;

        // Counter'ı localStorage'a kaydet (user-specific)
        if (isInitialized && userId) {
            setItem(storageKeys.idCounter, idCounterRef.current);
        }

        return `${prefix}-${timestamp}-${counter}`;
    }, [isInitialized, userId, storageKeys]);

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
        const now = new Date();
        const isDuplicate = notifications.some(existing =>
            existing.type === notification.type &&
            existing.title === notification.title &&
            existing.testId === notification.testId &&
            existing.executionId === notification.executionId &&
            (now.getTime() - existing.timestamp.getTime()) < config.notification.duplicateCheckWindow
        );

        if (isDuplicate) {
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
            (now.getTime() - existing.timestamp.getTime()) < config.notification.toastDuplicateCheckWindow
        );

        if (isDuplicate) {
            return;
        }

        const newToast: Notification = {
            ...toast,
            id: generateUniqueId('toast'),
            timestamp: new Date(),
            persistent: false,
            autoClose: toast.autoClose ?? true,
            duration: toast.duration ?? config.notification.defaultDuration
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
        if (userId) {
            removeItem(storageKeys.notifications);
        }
    }, [userId, storageKeys]);

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
                return elapsed < (toast.duration || config.notification.defaultDuration);
            }));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // ============================================================================
    // Manual Notification Functions
    // ============================================================================

    const notifyTestStart = useCallback((testName: string, testId: string) => {
        showToast({
            type: 'info',
            title: t('notifications.testStart'),
            message: t('notifications.testStartMessage', { testName }),
            testId,
            autoClose: true,
            duration: config.notification.shortDuration
        });

        addNotification({
            type: 'info',
            title: t('notifications.testStart'),
            message: t('notifications.testStartMessage', { testName }),
            testId,
            persistent: true
        });
    }, [showToast, addNotification, t]);

    const notifyTestSuccess = useCallback((testName: string, testId: string, duration?: number, executionId?: string) => {
        console.log('[NotificationContext] notifyTestSuccess called', { testName, testId, duration, executionId });
        const durationText = duration ? t('notifications.withDuration', { duration: (duration / 1000).toFixed(1) }) : '';

        showToast({
            type: 'success',
            title: t('notifications.testSuccess'),
            message: t('notifications.testSuccessMessage', { testName }) + durationText,
            testId,
            executionId,
            autoClose: true,
            duration: config.notification.defaultDuration
        });

        addNotification({
            type: 'success',
            title: t('notifications.testSuccess'),
            message: t('notifications.testSuccessMessage', { testName }) + durationText,
            testId,
            executionId,
            persistent: true
        });
    }, [showToast, addNotification, t]);

    const notifyTestFailure = useCallback((testName: string, testId: string, error?: string, duration?: number, executionId?: string) => {
        const durationText = duration ? t('notifications.withDuration', { duration: (duration / 1000).toFixed(1) }) : '';
        const errorText = error ? t('notifications.withError', { error }) : '';

        showToast({
            type: 'error',
            title: t('notifications.testFailed'),
            message: t('notifications.testFailedMessage', { testName }) + durationText + errorText,
            testId,
            executionId,
            autoClose: true,
            duration: config.notification.longDuration
        });

        addNotification({
            type: 'error',
            title: t('notifications.testFailed'),
            message: t('notifications.testFailedMessage', { testName }) + durationText + errorText,
            testId,
            executionId,
            persistent: true
        });
    }, [showToast, addNotification, t]);

    const notifyTestSaved = useCallback((testName: string, testId: string) => {
        showToast({
            type: 'success',
            title: t('notifications.testSaved'),
            message: t('notifications.testSavedMessage', { testName }),
            testId,
            autoClose: true,
            duration: config.notification.shortDuration
        });
    }, [showToast, t]);

    const notifyTestScheduled = useCallback((testName: string, testId: string, scheduleTime: string) => {
        showToast({
            type: 'info',
            title: t('notifications.testScheduled'),
            message: t('notifications.testScheduledMessage', { testName, scheduleTime }),
            testId,
            autoClose: true,
            duration: config.notification.mediumDuration
        });

        addNotification({
            type: 'info',
            title: t('notifications.testScheduled'),
            message: t('notifications.testScheduledMessage', { testName, scheduleTime }),
            testId,
            persistent: true
        });
    }, [showToast, addNotification, t]);

    const notifyTestImported = useCallback((testName: string, testId: string) => {
        showToast({
            type: 'success',
            title: t('notifications.testImported'),
            message: t('notifications.testImportedMessage', { testName }),
            testId,
            autoClose: true,
            duration: 3000
        });
    }, [showToast, t]);

    const notifyExecutionStart = useCallback((workflowName: string, executionId: string) => {
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
    }, [showToast, addNotification, t]);

    const notifyExecutionComplete = useCallback((workflowName: string, executionId: string, status: 'completed' | 'failed', duration?: number) => {
        const durationText = duration ? t('notifications.withDuration', { duration: (duration / 1000).toFixed(1) }) : '';
        const isSuccess = status === 'completed';

        showToast({
            type: isSuccess ? 'success' : 'error',
            title: isSuccess ? t('notifications.executionCompleted') : t('notifications.executionFailed'),
            message: (isSuccess ? t('notifications.executionCompletedMessage', { workflowName }) : t('notifications.executionFailedMessage', { workflowName })) + durationText,
            executionId,
            autoClose: true,
            duration: isSuccess ? config.notification.defaultDuration : config.notification.longDuration
        });

        addNotification({
            type: isSuccess ? 'success' : 'error',
            title: isSuccess ? t('notifications.executionCompleted') : t('notifications.executionFailed'),
            message: (isSuccess ? t('notifications.executionCompletedMessage', { workflowName }) : t('notifications.executionFailedMessage', { workflowName })) + durationText,
            executionId,
            persistent: true
        });
    }, [showToast, addNotification, t]);

    const notifyTestDeleted = useCallback((testName: string, testId: string) => {
        showToast({
            type: 'info',
            title: t('notifications.testDeleted'),
            message: t('notifications.testDeletedMessage', { testName }),
            testId,
            autoClose: true,
            duration: config.notification.shortDuration
        });
        addNotification({
            type: 'info',
            title: t('notifications.testDeleted'),
            message: t('notifications.testDeletedMessage', { testName }),
            testId,
            persistent: true
        });
    }, [showToast, addNotification, t]);

    const notifyTestDuplicated = useCallback((testName: string, testId: string) => {
        showToast({
            type: 'success',
            title: t('notifications.testDuplicated'),
            message: t('notifications.testDuplicatedMessage', { testName }),
            testId,
            autoClose: true,
            duration: config.notification.shortDuration
        });
    }, [showToast, t]);

    const notifyWorkflowLoaded = useCallback((workflowName: string) => {
        showToast({
            type: 'success',
            title: t('notifications.workflowLoaded'),
            message: t('notifications.workflowLoadedMessage', { workflowName }),
            autoClose: true,
            duration: config.notification.shortDuration
        });
    }, [showToast, t]);

    // ============================================================================
    // Real-time Notification Setup
    // ============================================================================

    const { isConnected, isConnecting, lastMessage, connect } = useNotificationSocket({
        notifyTestStart,
        notifyTestSuccess,
        notifyTestFailure,
        notifyWorkflowLoaded
    });

    const value = {
        notifications,
        toasts,
        addNotification,
        showToast,
        removeNotification,
        clearAllNotifications,
        markAsRead,
        markAllAsRead,
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
        isConnected,
        isConnecting,
        lastMessage,
        reconnect: connect
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
