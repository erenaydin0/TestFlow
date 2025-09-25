'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
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

const colorMap = {
  success: 'bg-green-500 border-green-600',
  error: 'bg-red-500 border-red-600',
  warning: 'bg-yellow-500 border-yellow-600',
  info: 'bg-blue-500 border-blue-600',
};

const bgColorMap = {
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
};

export function Toast({ notification, onRemove, index = 0 }: ToastProps) {
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
      className={`
        transform transition-all duration-300 ease-in-out pointer-events-auto
        ${isVisible && !isRemoving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
        w-full shadow-lg rounded-lg overflow-hidden backdrop-blur-sm
        ${bgColorMap[notification.type]} border
      `}
      style={{
        transformOrigin: 'top right'
      }}
    >
      <div className="relative">
        <div className="p-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Icon className={`h-5 w-5 text-white rounded-full p-0.5 ${colorMap[notification.type]}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {notification.message}
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                className="inline-flex p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={handleRemove}
              >
                <span className="sr-only">Kapat</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        {notification.autoClose && notification.duration && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-600">
            <div
              className={`h-full ${colorMap[notification.type]} transition-all ease-linear`}
              style={{
                animation: `shrink ${notification.duration}ms linear`,
                animationFillMode: 'forwards',
                transformOrigin: 'left center'
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
