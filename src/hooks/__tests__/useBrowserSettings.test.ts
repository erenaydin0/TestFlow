import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBrowserSettings } from '../useBrowserSettings';

describe('useBrowserSettings', () => {
  // Store original localStorage before tests
  const originalLocalStorage = window.localStorage;

  beforeEach(() => {
    // Restore real localStorage for these tests by removing the mock
    // Delete the mock property first
    delete (window as any).localStorage;
    
    // Create a fresh localStorage-like object using Storage API
    const storage = new Map<string, string>();
    
    const localStorageMock = {
      getItem: (key: string) => {
        return storage.get(key) || null;
      },
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
      get length() {
        return storage.size;
      },
      key: (index: number) => {
        const keys = Array.from(storage.keys());
        return keys[index] || null;
      },
    };

    // Set the mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    
    // Clear before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Restore original localStorage after tests
    if (originalLocalStorage) {
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
    }
  });

  it('should initialize with default settings', () => {
    const { result } = renderHook(() => useBrowserSettings());
    
    expect(result.current.defaultBrowser).toBe('chromium');
    expect(result.current.defaultHeadless).toBe(false);
    expect(result.current.defaultRecording).toBe(false);
    expect(result.current.defaultScreenshots).toBe(false);
  });

  it('should set default browser', () => {
    const { result } = renderHook(() => useBrowserSettings());
    
    act(() => {
      result.current.setDefaultBrowser('firefox');
    });

    expect(result.current.defaultBrowser).toBe('firefox');
  });

  it('should set default headless', () => {
    const { result } = renderHook(() => useBrowserSettings());
    
    act(() => {
      result.current.setDefaultHeadless(true);
    });

    expect(result.current.defaultHeadless).toBe(true);
  });

  it('should set default recording', () => {
    const { result } = renderHook(() => useBrowserSettings());
    
    act(() => {
      result.current.setDefaultRecording(true);
    });

    expect(result.current.defaultRecording).toBe(true);
  });

  it('should set default screenshots', () => {
    const { result } = renderHook(() => useBrowserSettings());
    
    act(() => {
      result.current.setDefaultScreenshots(true);
    });

    expect(result.current.defaultScreenshots).toBe(true);
  });

  it('should persist settings to localStorage', async () => {
    const { result } = renderHook(() => useBrowserSettings());
    
    // Wait for mount
    await waitFor(() => {
      expect(result.current.defaultBrowser).toBeDefined();
    });
    
    await act(async () => {
      result.current.setDefaultBrowser('firefox');
      result.current.setDefaultHeadless(true);
    });

    // Wait for state update and effect to run
    await waitFor(() => {
      expect(result.current.defaultBrowser).toBe('firefox');
    });

    // Wait a bit more for localStorage to be updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const stored = localStorage.getItem('browserSettings');
    expect(stored).toBeTruthy();
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.defaultBrowser).toBe('firefox');
      expect(parsed.defaultHeadless).toBe(true);
    }
  });

  it('should load settings from localStorage', async () => {
    localStorage.setItem('browserSettings', JSON.stringify({
      defaultBrowser: 'firefox',
      defaultHeadless: true,
      defaultRecording: false,
      defaultScreenshots: true,
    }));

    const { result } = renderHook(() => useBrowserSettings());
    
    // Wait for initialization - hook reads from localStorage in useEffect
    await waitFor(() => {
      expect(result.current.defaultBrowser).toBe('firefox');
    }, { timeout: 3000 });
    
    expect(result.current.defaultBrowser).toBe('firefox');
    expect(result.current.defaultHeadless).toBe(true);
    expect(result.current.defaultScreenshots).toBe(true);
  });

  it('should return getBrowserSettings function', () => {
    const { result } = renderHook(() => useBrowserSettings());
    
    const settings = result.current.getBrowserSettings();
    expect(settings).toHaveProperty('defaultBrowser');
    expect(settings).toHaveProperty('defaultHeadless');
    expect(settings).toHaveProperty('defaultRecording');
    expect(settings).toHaveProperty('defaultScreenshots');
  });
});

