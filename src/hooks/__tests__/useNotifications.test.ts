import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useNotifications from '../useNotifications';

// Mock useI18n
vi.mock('../useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

// Mock next-auth useSession
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'test-user-id' } },
    status: 'authenticated',
  }),
}));

// Mock useNotificationSocket
vi.mock('../useNotificationSocket', () => ({
  useNotificationSocket: () => ({
    isConnected: false,
    isConnecting: false,
    lastMessage: null,
    reconnect: vi.fn(),
  }),
}));

describe('useNotifications', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with empty notifications', async () => {
    const { result } = renderHook(() => useNotifications());
    
    expect(result.current.notifications).toBeDefined();
    
    expect(Array.isArray(result.current.notifications)).toBe(true);
  });

  it('should add notification', async () => {
    const { result } = renderHook(() => useNotifications());
    
    expect(result.current.addNotification).toBeDefined();

    act(() => {
      result.current.addNotification({
        type: 'info',
        title: 'Test Notification',
        message: 'Test message',
      });
    });

    expect(result.current.notifications.length).toBeGreaterThan(0);
    expect(result.current.notifications[0].title).toBe('Test Notification');
  });

  it('should show toast', async () => {
    const { result } = renderHook(() => useNotifications());
    
    expect(result.current.showToast).toBeDefined();

    act(() => {
      result.current.showToast({
        type: 'success',
        title: 'Success',
        message: 'Operation completed',
      });
    });

    expect(result.current.toasts.length).toBeGreaterThan(0);
  });

  it('should remove notification', async () => {
    const { result } = renderHook(() => useNotifications());
    
    expect(result.current.addNotification).toBeDefined();

    let notificationId: string;
    
    await act(async () => {
      result.current.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test',
      });
    });

    await waitFor(() => {
      expect(result.current.notifications.length).toBeGreaterThan(0);
    });

    notificationId = result.current.notifications[0].id;

    await act(async () => {
      result.current.removeNotification(notificationId);
    });

    await waitFor(() => {
      expect(result.current.notifications.find(n => n.id === notificationId)).toBeUndefined();
    });
  });

  it('should mark notification as read', async () => {
    const { result } = renderHook(() => useNotifications());
    
    expect(result.current.addNotification).toBeDefined();

    let notificationId: string;
    
    await act(async () => {
      result.current.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test',
      });
    });

    await waitFor(() => {
      expect(result.current.notifications.length).toBeGreaterThan(0);
    });

    notificationId = result.current.notifications[0].id;

    await act(async () => {
      result.current.markAsRead(notificationId);
    });

    await waitFor(() => {
      const notification = result.current.notifications.find(n => n.id === notificationId);
      expect(notification?.read).toBe(true);
    });
  });

  it('should clear all notifications', async () => {
    const { result } = renderHook(() => useNotifications());
    
    expect(result.current.addNotification).toBeDefined();

    act(() => {
      result.current.addNotification({
        type: 'info',
        title: 'Test 1',
        message: 'Test',
      });
      result.current.addNotification({
        type: 'info',
        title: 'Test 2',
        message: 'Test',
      });
    });

    expect(result.current.notifications.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearAllNotifications();
    });

    expect(result.current.notifications.length).toBe(0);
  });
});

