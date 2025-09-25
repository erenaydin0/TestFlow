'use client';

import { useNotifications } from '@/lib/notification-context';
import { Toast } from './Toast';

export function ToastContainer() {
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
