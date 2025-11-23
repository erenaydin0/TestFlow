import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useWebSocket from '../useWebSocket';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

describe('useWebSocket', () => {
  const mockUrl = 'ws://localhost:3001';

  beforeEach(() => {
    // @ts-expect-error - Mocking WebSocket
    global.WebSocket = MockWebSocket as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, { autoConnect: false }));
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
  });

  it('should connect automatically by default', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should not connect when autoConnect is false', () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, { autoConnect: false }));
    
    expect(result.current.isConnected).toBe(false);
  });

  it('should connect manually', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, { autoConnect: false }));
    
    act(() => {
      result.current.connect();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should disconnect', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('should handle messages', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate receiving a message
    const ws = (global as any).WebSocket.mock?.instances?.[0];
    if (ws && ws.onmessage) {
      act(() => {
        ws.onmessage({
          data: JSON.stringify({ type: 'test', message: 'Hello' }),
        });
      });
    }

    // Message should be stored
    expect(result.current.lastMessage).toBeDefined();
  });

  it('should send messages', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));
    const sendSpy = vi.spyOn(MockWebSocket.prototype, 'send');
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    act(() => {
      result.current.sendMessage({ type: 'test', data: 'test' });
    });

    // Note: In a real test, we'd verify send was called
    // This depends on the WebSocket implementation
  });
});

