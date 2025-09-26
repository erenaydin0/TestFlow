'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Notification, NotificationContextType } from '@/types/notifications';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);
  
  // Counter for unique IDs to prevent duplicates
  const [idCounter, setIdCounter] = useState(0);
  
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
