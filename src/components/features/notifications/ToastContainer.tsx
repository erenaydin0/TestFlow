'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { useNotifications } from '@/contexts';
import { Notification } from '@/types/notifications';

interface ToastProps {
  notification: Notification;
  onRemove: (id: string) => void;
  index?: number;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const getIconStyle = (type: 'success' | 'error' | 'warning' | 'info') => {
  switch (type) {
    case 'success': return { backgroundColor: 'var(--status-success)', borderColor: 'var(--status-success)' };
    case 'error': return { backgroundColor: 'var(--status-error)', borderColor: 'var(--status-error)' };
    case 'warning': return { backgroundColor: 'var(--status-warning)', borderColor: 'var(--status-warning)' };
    case 'info': return { backgroundColor: 'var(--status-info)', borderColor: 'var(--status-info)' };
  }
};

const getBgStyle = (type: 'success' | 'error' | 'warning' | 'info') => {
  switch (type) {
    case 'success': return { backgroundColor: 'var(--status-success-bg)', borderColor: 'var(--status-success)' };
    case 'error': return { backgroundColor: 'var(--status-error-bg)', borderColor: 'var(--status-error)' };
    case 'warning': return { backgroundColor: 'var(--status-warning-bg)', borderColor: 'var(--status-warning)' };
    case 'info': return { backgroundColor: 'var(--status-info-bg)', borderColor: 'var(--status-info)' };
  }
};

function Toast({ notification, onRemove, index = 0 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const Icon = iconMap[notification.type];

  useEffect(() => {
    // Staggered animation for multiple toasts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 100);
    
    return () => clearTimeout(timer);
  }, [index]);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  return (
    <div
      style={{
        transform: isVisible && !isRemoving ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)',
        opacity: isVisible && !isRemoving ? 1 : 0,
        transition: 'all 300ms ease-in-out',
        pointerEvents: 'auto',
        width: '100%',
        boxShadow: 'var(--shadow-lg)',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        backdropFilter: 'blur(4px)',
        border: '1px solid',
        transformOrigin: 'top right',
        ...getBgStyle(notification.type)
      }}
    >
      <div style={{ position: 'relative' }}>
        <div style={{ padding: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ flexShrink: 0, marginTop: '0.125rem' }}>
              <Icon 
                size={20} 
                style={{ 
                  color: 'white', 
                  borderRadius: '9999px', 
                  padding: '0.125rem',
                  ...getIconStyle(notification.type)
                }} 
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: 0
              }}>
                {notification.title}
              </p>
              <p style={{ 
                marginTop: '0.25rem', 
                fontSize: '0.875rem', 
                color: 'var(--text-primary)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                margin: '0.25rem 0 0 0'
              }}>
                {notification.message}
              </p>
            </div>
            <div style={{ flexShrink: 0 }}>
              <button
                style={{
                  display: 'inline-flex',
                  padding: '0.25rem',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '0.375rem',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={handleRemove}
              >
                <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>Kapat</span>
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        {notification.autoClose && notification.duration && (
          <div style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            height: '0.25rem', 
            backgroundColor: 'var(--bg-tertiary)' 
          }}>
            <div
              style={{
                height: '100%',
                transition: 'all ease-linear',
                animation: `shrink ${notification.duration}ms linear`,
                animationFillMode: 'forwards',
                transformOrigin: 'left center',
                ...getIconStyle(notification.type)
              }}
            />
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
}

function ToastContainer() {
  const { toasts, removeNotification } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-[4.5rem] right-4 left-4 sm:left-auto z-[1001] pointer-events-none">
      <div className="flex flex-col space-y-3 sm:w-96 sm:ml-auto">
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            notification={toast}
            onRemove={removeNotification}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

export default ToastContainer;