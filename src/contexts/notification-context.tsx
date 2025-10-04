'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Notification, NotificationContextType } from '@/types/notifications';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// localStorage anahtarları
const NOTIFICATIONS_STORAGE_KEY = 'testflow_notifications';
const ID_COUNTER_STORAGE_KEY = 'testflow_notification_counter';

// localStorage yardımcı fonksiyonları
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
        // Date objelerini geri dönüştür
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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Counter for unique IDs to prevent duplicates
  const [idCounter, setIdCounter] = useState(0);

  // Component mount edildiğinde localStorage'dan verileri yükle
  useEffect(() => {
    const loadedNotifications = loadNotificationsFromStorage();
    const loadedCounter = loadCounterFromStorage();
    
    setNotifications(loadedNotifications);
    setIdCounter(loadedCounter);
    setIsInitialized(true);
  }, []);

  // Bildirimler değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (isInitialized) {
      saveNotificationsToStorage(notifications);
    }
  }, [notifications, isInitialized]);

  // Counter değiştiğinde localStorage'a kaydet
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
    // Check for recent duplicates (same type, title, and testId/executionId in last 5 seconds)
    const now = new Date();
    const isDuplicate = notifications.some(existing => 
      existing.type === notification.type &&
      existing.title === notification.title &&
      existing.testId === notification.testId &&
      existing.executionId === notification.executionId &&
      (now.getTime() - existing.timestamp.getTime()) < 5000 // 5 seconds
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

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep max 50 notifications
  }, [notifications, generateUniqueId]);

  const showToast = useCallback((toast: Omit<Notification, 'id' | 'timestamp' | 'persistent'>) => {
    // Check for recent duplicate toasts (same type, title, message in last 3 seconds)
    const now = new Date();
    const isDuplicate = toasts.some(existing => 
      existing.type === toast.type &&
      existing.title === toast.title &&
      existing.message === toast.message &&
      existing.testId === toast.testId &&
      existing.executionId === toast.executionId &&
      (now.getTime() - existing.timestamp.getTime()) < 3000 // 3 seconds
    );

    if (isDuplicate) {
      console.log('Duplicate toast atlandı:', toast.title, toast.message);
      return;
    }
    
    console.log('Yeni toast ekleniyor:', toast.title, toast.message);

    const newToast: Notification = {
      ...toast,
      id: generateUniqueId('toast'),
      timestamp: new Date(),
      persistent: false,
      autoClose: toast.autoClose ?? true,
      duration: toast.duration ?? 5000
    };

    setToasts(prev => [...prev.slice(-4), newToast]); // Keep max 5 toasts

    // Otomatik kaldırma
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
    // localStorage'ı da temizle
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

  // Toast'ları otomatik temizleme
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

  const value: NotificationContextType = {
    notifications,
    toasts,
    addNotification,
    showToast,
    removeNotification,
    clearAllNotifications,
    markAsRead,
    markAllAsRead
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
