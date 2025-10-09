'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Notification, NotificationContextType } from '@/types/notifications';

// UI Context Interface
interface UIContextType {
  // Sidebar
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;

  // Settings Modal
  isSettingsOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;

  // Notifications
  notifications: Notification[];
  toasts: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  showToast: (toast: Omit<Notification, 'id' | 'timestamp' | 'persistent'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

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

export function UIProvider({ children }: { children: ReactNode }) {
  // Sidebar State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [idCounter, setIdCounter] = useState(0);

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

  // Settings Modal Functions
  const openSettingsModal = () => setIsSettingsOpen(true);
  const closeSettingsModal = () => setIsSettingsOpen(false);

  // Notification Functions
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

  return (
    <UIContext.Provider value={{
      // Sidebar
      isCollapsed,
      setIsCollapsed,
      isModalOpen,
      setIsModalOpen,
      
      // Settings Modal
      isSettingsOpen,
      openSettingsModal,
      closeSettingsModal,
      
      // Notifications
      notifications,
      toasts,
      addNotification,
      showToast,
      removeNotification,
      clearAllNotifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

// Individual hooks for backward compatibility
export function useSidebar() {
  const { isCollapsed, setIsCollapsed, isModalOpen, setIsModalOpen } = useUI();
  return { isCollapsed, setIsCollapsed, isModalOpen, setIsModalOpen };
}

export function useSettingsModal() {
  const { isSettingsOpen, openSettingsModal, closeSettingsModal } = useUI();
  return { isSettingsOpen, openSettingsModal, closeSettingsModal };
}

export function useNotifications() {
  const { 
    notifications, 
    toasts, 
    addNotification, 
    showToast, 
    removeNotification, 
    clearAllNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useUI();
  return { 
    notifications, 
    toasts, 
    addNotification, 
    showToast, 
    removeNotification, 
    clearAllNotifications, 
    markAsRead, 
    markAllAsRead 
  };
}
