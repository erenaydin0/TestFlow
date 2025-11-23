import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useI18n } from '../useI18n';

// Mock useRouter
const mockRouter = {
  refresh: vi.fn(),
  push: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock fetch for translations
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  text: () => Promise.resolve('{"test": {"key": "Test Value"}}'),
});

describe('useI18n', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should provide translation function', async () => {
    const { result, waitFor } = renderHook(() => useI18n());
    
    await waitFor(() => {
      expect(result.current.t).toBeDefined();
    });
    
    expect(typeof result.current.t).toBe('function');
  });

  it('should translate keys', async () => {
    const { result, waitFor } = renderHook(() => useI18n());
    
    await waitFor(() => {
      expect(result.current.t).toBeDefined();
    });
    
    const translated = result.current.t('test.key');
    expect(translated).toBe('Test Value');
  });

  it('should provide current language', async () => {
    const { result, waitFor } = renderHook(() => useI18n());
    
    await waitFor(() => {
      expect(result.current.locale).toBeDefined();
    });
    
    expect(result.current.locale).toBe('tr');
  });

  it('should change language', async () => {
    const { result, waitFor } = renderHook(() => useI18n());
    
    await waitFor(() => {
      expect(result.current.setLocale).toBeDefined();
    });
    
    await act(async () => {
      await result.current.setLocale('en');
    });

    expect(mockRouter.refresh).toHaveBeenCalled();
  });
});

