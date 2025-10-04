'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  X, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Trash2, 
  Check, 
  CheckCircle2 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

import { useNotifications, useTheme } from '@/contexts';

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

function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, removeNotification, clearAllNotifications, markAsRead, markAllAsRead } = useNotifications();
  const { theme } = useTheme();
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
        style={{
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        padding: '0.5rem 1rem',
        paddingLeft: '1rem',
        borderLeft: '1px solid var(--border-primary)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '0.5rem',
        transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
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
          <div className={`absolute right-0 top-full mt-2 w-96 rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden ${
            document.documentElement.classList.contains('dark') 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              document.documentElement.classList.contains('dark') 
                ? 'border-gray-700' 
                : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                document.documentElement.classList.contains('dark') 
                  ? 'text-white' 
                  : 'text-gray-900'
              }`}>
                Bildirimler
              </h3>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && (
                  <>
                    {/* Tümünü Okundu İşaretle */}
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className={`p-1 ${
                          document.documentElement.classList.contains('dark')
                            ? 'text-gray-400 hover:text-gray-200'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        title="Tümünü Okundu İşaretle"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Tümünü Temizle */}
                    <button
                      onClick={clearAllNotifications}
                      className={`p-1 ${
                        document.documentElement.classList.contains('dark')
                          ? 'text-gray-400 hover:text-gray-200'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title="Tümünü Temizle"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className={`${
                    document.documentElement.classList.contains('dark')
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className={`p-8 text-center ${
                  document.documentElement.classList.contains('dark')
                    ? 'text-gray-400'
                    : 'text-gray-500'
                }`}>
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Henüz bildirim yok</p>
                </div>
              ) : (
                <div className={`divide-y ${
                  document.documentElement.classList.contains('dark')
                    ? 'divide-gray-700'
                    : 'divide-gray-200'
                }`}>
                  {notifications.map((notification) => {
                    const Icon = iconMap[notification.type];
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 transition-colors ${
                          notification.executionId || notification.testId 
                            ? 'cursor-pointer' 
                            : ''
                        } ${
                          document.documentElement.classList.contains('dark')
                            ? 'hover:bg-gray-700/50'
                            : 'hover:bg-gray-50'
                        } ${
                          !notification.read 
                            ? document.documentElement.classList.contains('dark')
                              ? 'bg-blue-900/20'
                              : 'bg-blue-50'
                            : ''
                        }`}
                        onClick={() => {
                          if (notification.executionId || notification.testId) {
                            handleNotificationClick(notification);
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${colorMap[notification.type]}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-md font-medium ${
                              document.documentElement.classList.contains('dark')
                                ? 'text-white'
                                : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-1 ${
                              document.documentElement.classList.contains('dark')
                                ? 'text-gray-100'
                                : 'text-gray-900'
                            }`}>
                              {notification.message}
                            </p>
                            <p className={`text-xs mt-1 ${
                              document.documentElement.classList.contains('dark')
                                ? 'text-gray-400'
                                : 'text-gray-600'
                            }`}>
                              {notification.executionId || notification.testId}
                            </p>
                            <p className={`text-xs mt-2 ${
                              document.documentElement.classList.contains('dark')
                                ? 'text-gray-500'
                                : 'text-gray-500'
                            }`}>
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
                                className={`${
                                  document.documentElement.classList.contains('dark')
                                    ? 'text-gray-400 hover:text-gray-200'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
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
                              className={`${
                                document.documentElement.classList.contains('dark')
                                  ? 'text-gray-400 hover:text-gray-200'
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
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

export default NotificationPanel;
