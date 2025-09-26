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
  notifications: Notification[];
  toasts: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  showToast: (toast: Omit<Notification, 'id' | 'timestamp' | 'persistent'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}
