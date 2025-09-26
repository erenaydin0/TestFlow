'use client';

import { useState } from 'react';
import { Bell, X, CheckCircle, XCircle, AlertCircle, Info, Trash2, Check, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '@/lib/notification-context';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colorMap = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, removeNotification, clearAllNotifications, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: any) => {
    // Bildirimi okundu olarak işaretle
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // ExecutionId varsa direkt o execution'ın modalını aç
    if (notification.executionId) {
      setIsOpen(false); // Panel'ı kapat
      router.push(`/reports?executionId=${notification.executionId}`);
    } else if (notification.testId) {
      // Test ID'si varsa reports sayfasında arama yap
      setIsOpen(false); // Panel'ı kapat
      router.push(`/reports?testId=${notification.testId}`);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bildirimler
              </h3>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && (
                  <>
                    {/* Tümünü Okundu İşaretle */}
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                        title="Tümünü Okundu İşaretle"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Tümünü Temizle */}
                    <button
                      onClick={clearAllNotifications}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                      title="Tümünü Temizle"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Henüz bildirim yok</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => {
                    const Icon = iconMap[notification.type];
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 transition-colors ${
                          notification.executionId || notification.testId 
                            ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        } ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        onClick={() => {
                          if (notification.executionId || notification.testId) {
                            handleNotificationClick(notification);
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${colorMap[notification.type]}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-md font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-100 dark:text-gray-100 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {notification.executionId || notification.testId}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {formatDistanceToNow(notification.timestamp, { 
                                addSuffix: true,
                                locale: tr
                              })}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {/* Okundu İşaretle */}
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                title="Okundu İşaretle"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            
                            {/* Sil */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              title="Bildirimi Sil"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
