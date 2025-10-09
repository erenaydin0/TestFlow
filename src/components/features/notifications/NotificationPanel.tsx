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

import { useNotifications, useTheme, useI18n } from '@/contexts';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const getColorStyle = (type: 'success' | 'error' | 'warning' | 'info') => {
  switch (type) {
    case 'success': return { color: 'var(--status-success)' };
    case 'error': return { color: 'var(--status-error)' };
    case 'warning': return { color: 'var(--status-warning)' };
    case 'info': return { color: 'var(--status-info)' };
  }
};

function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, removeNotification, clearAllNotifications, markAsRead, markAllAsRead } = useNotifications();
  const { theme } = useTheme();
  const { t } = useI18n();
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
          <span style={{
            position: 'absolute',
            top: '-0.25rem',
            right: '-0.25rem',
            backgroundColor: 'var(--status-error)',
            color: 'white',
            fontSize: '0.75rem',
            borderRadius: '9999px',
            height: '1.25rem',
            width: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
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
          <div 
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '0.5rem',
              width: '24rem',
              borderRadius: '0.75rem',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-primary)',
              zIndex: 50,
              maxHeight: '24rem',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-primary)'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem',
              borderBottom: '1px solid var(--border-primary)'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginLeft: '0.3rem'
              }}>
                Bildirimler
              </h3>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && (
                  <>
                    {/* Tümünü Okundu İşaretle */}
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        style={{
                          padding: '0.25rem',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          borderRadius: '0.25rem',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        title={t('notifications.markAllRead')}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    
                    {/* Tümünü Temizle */}
                    <button
                      onClick={clearAllNotifications}
                      style={{
                        padding: '0.25rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        borderRadius: '0.25rem',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                      title={t('notifications.clearAll')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    borderRadius: '0.25rem',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div style={{ maxHeight: '20rem', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-tertiary)'
                }}>
                  <Bell style={{ 
                    width: '3rem', 
                    height: '3rem', 
                    margin: '0 auto 1rem', 
                    opacity: 0.3 
                  }} />
                  <p>Henüz bildirim yok</p>
                </div>
              ) : (
                <div style={{
                  borderTop: '1px solid var(--border-primary)'
                }}>
                  {notifications.map((notification) => {
                    const Icon = iconMap[notification.type];
                    return (
                      <div
                        key={notification.id}
                        style={{
                          padding: '0.75rem',
                          cursor: (notification.executionId || notification.testId) ? 'pointer' : 'default',
                          backgroundColor: !notification.read ? 'var(--status-info-bg)' : 'transparent',
                          borderBottom: '1px solid var(--border-primary)',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = !notification.read 
                            ? 'var(--status-info-bg)' 
                            : 'var(--bg-tertiary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = !notification.read 
                            ? 'var(--status-info-bg)' 
                            : 'transparent';
                        }}
                        onClick={() => {
                          if (notification.executionId || notification.testId) {
                            handleNotificationClick(notification);
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <Icon size={20} style={{ marginTop: '0.125rem', flexShrink: 0, ...getColorStyle(notification.type) }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              margin: 0
                            }}>
                              {notification.title}
                            </p>
                            <p style={{
                              fontSize: '0.875rem',
                              marginTop: '0.25rem',
                              color: 'var(--text-secondary)',
                              margin: '0.25rem 0 0 0'
                            }}>
                              {notification.message}
                            </p>
                            <p style={{
                              fontSize: '0.75rem',
                              marginTop: '0.25rem',
                              color: 'var(--text-tertiary)',
                              fontFamily: 'monospace',
                              margin: '0.25rem 0 0 0'
                            }}>
                              {notification.executionId || notification.testId}
                            </p>
                            <p style={{
                              fontSize: '0.75rem',
                              marginTop: '0.5rem',
                              color: 'var(--text-tertiary)',
                              margin: '0.5rem 0 0 0'
                            }}>
                              {formatDistanceToNow(notification.timestamp, { 
                                addSuffix: true,
                                locale: tr
                              })}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {/* Okundu İşaretle */}
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  padding: '0.25rem',
                                  borderRadius: '0.25rem',
                                  transition: 'color 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                title={t('notifications.markAsRead')}
                              >
                                <Check size={16} />
                              </button>
                            )}
                            
                            {/* Sil */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                borderRadius: '0.25rem',
                                transition: 'color 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                              title="Bildirimi Sil"
                            >
                              <X size={16} />
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
