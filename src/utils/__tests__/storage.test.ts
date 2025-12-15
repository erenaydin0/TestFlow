import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getItem, setItem, removeItem, onStorageChange } from '../storage';

describe('storage utilities', () => {
  // Store original localStorage before tests
  const originalLocalStorage = window.localStorage;

  beforeEach(() => {
    // Create a fresh localStorage-like object using Map
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
    vi.clearAllMocks();
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

  describe('getItem', () => {
    it('should return default value when key does not exist', () => {
      const result = getItem('non-existent-key', 'default');
      expect(result).toBe('default');
    });

    it('should return default value when localStorage is empty', () => {
      localStorage.setItem('test-key', '');
      const result = getItem('test-key', 'default');
      expect(result).toBe('default');
    });

    it('should return parsed value when key exists', () => {
      const testValue = { name: 'test', count: 42 };
      localStorage.setItem('test-key', JSON.stringify(testValue));
      const result = getItem('test-key', {});
      expect(result).toEqual(testValue);
      expect((result as any).name).toBe('test');
      expect((result as any).count).toBe(42);
    });

    it('should return default value for null string', () => {
      localStorage.setItem('test-key', 'null');
      const result = getItem('test-key', 'default');
      expect(result).toBe('default');
    });

    it('should return default value for undefined string', () => {
      localStorage.setItem('test-key', 'undefined');
      const result = getItem('test-key', 'default');
      expect(result).toBe('default');
    });

    it('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('test-key', 'invalid-json{');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = getItem('test-key', 'default');
      expect(result).toBe('default');
      // console.error should be called when JSON parsing fails
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle SSR environment', () => {
      // Mock window as undefined
      const originalWindow = global.window;
      // @ts-expect-error - intentionally setting to undefined for SSR test
      global.window = undefined;
      
      const result = getItem('test-key', 'default');
      expect(result).toBe('default');
      
      global.window = originalWindow;
    });
  });

  describe('setItem', () => {
    it('should store value in localStorage', () => {
      const testValue = { name: 'test', count: 42 };
      setItem('test-key', testValue);
      const stored = localStorage.getItem('test-key');
      expect(stored).toBeTruthy();
      if (stored) {
        expect(JSON.parse(stored)).toEqual(testValue);
      }
    });

    it('should handle string values', () => {
      setItem('test-key', 'simple-string');
      const stored = localStorage.getItem('test-key');
      expect(stored).toBeTruthy();
      if (stored) {
        expect(JSON.parse(stored)).toBe('simple-string');
      }
    });

    it('should handle number values', () => {
      setItem('test-key', 42);
      const stored = localStorage.getItem('test-key');
      expect(stored).toBeTruthy();
      if (stored) {
        expect(JSON.parse(stored)).toBe(42);
      }
    });

    it('should handle errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      setItem('test-key', 'value');
      expect(consoleSpy).toHaveBeenCalled();

      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });

    it('should handle SSR environment', () => {
      const originalWindow = global.window;
      // @ts-expect-error - intentionally setting to undefined for SSR test
      global.window = undefined;
      
      // Should not throw error
      expect(() => setItem('test-key', 'value')).not.toThrow();
      
      global.window = originalWindow;
    });
  });

  describe('removeItem', () => {
    it('should remove item from localStorage', () => {
      localStorage.setItem('test-key', 'value');
      removeItem('test-key');
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('should handle non-existent keys gracefully', () => {
      expect(() => removeItem('non-existent-key')).not.toThrow();
    });

    it('should handle errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      removeItem('test-key');
      expect(consoleSpy).toHaveBeenCalled();

      localStorage.removeItem = originalRemoveItem;
      consoleSpy.mockRestore();
    });

    it('should handle SSR environment', () => {
      const originalWindow = global.window;
      // @ts-expect-error - intentionally setting to undefined for SSR test
      global.window = undefined;
      
      expect(() => removeItem('test-key')).not.toThrow();
      
      global.window = originalWindow;
    });
  });

  describe('onStorageChange', () => {
    it('should return cleanup function', () => {
      const cleanup = onStorageChange('test-key', () => {});
      expect(typeof cleanup).toBe('function');
    });

    it('should call callback when storage changes', () => {
      const callback = vi.fn();
      onStorageChange('test-key', callback);

      const event = new StorageEvent('storage', {
        key: 'test-key',
        newValue: JSON.stringify({ value: 'test' }),
      });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith({ value: 'test' });
    });

    it('should not call callback for other keys', () => {
      const callback = vi.fn();
      onStorageChange('test-key', callback);

      const event = new StorageEvent('storage', {
        key: 'other-key',
        newValue: JSON.stringify({ value: 'test' }),
      });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle null values', () => {
      const callback = vi.fn();
      onStorageChange('test-key', callback);

      const event = new StorageEvent('storage', {
        key: 'test-key',
        newValue: null,
      });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should handle invalid JSON gracefully', () => {
      const callback = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      onStorageChange('test-key', callback);

      const event = new StorageEvent('storage', {
        key: 'test-key',
        newValue: 'invalid-json{',
      });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith(null);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should cleanup event listener', () => {
      const callback = vi.fn();
      const cleanup = onStorageChange('test-key', callback);
      cleanup();

      const event = new StorageEvent('storage', {
        key: 'test-key',
        newValue: JSON.stringify({ value: 'test' }),
      });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle SSR environment', () => {
      const originalWindow = global.window;
      // @ts-expect-error - intentionally setting to undefined for SSR test
      global.window = undefined;
      
      const cleanup = onStorageChange('test-key', () => {});
      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();
      
      global.window = originalWindow;
    });
  });
});

