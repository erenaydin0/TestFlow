import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettingsModal } from '../useSettingsModal';

describe('useSettingsModal', () => {
  beforeEach(() => {
    // Reset global state by creating new instances
    vi.resetModules();
  });

  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useSettingsModal());
    
    expect(result.current.isSettingsOpen).toBe(false);
  });

  it('should open settings modal', () => {
    const { result } = renderHook(() => useSettingsModal());
    
    act(() => {
      result.current.openSettingsModal();
    });

    expect(result.current.isSettingsOpen).toBe(true);
  });

  it('should close settings modal', () => {
    const { result } = renderHook(() => useSettingsModal());
    
    act(() => {
      result.current.openSettingsModal();
      result.current.closeSettingsModal();
    });

    expect(result.current.isSettingsOpen).toBe(false);
  });

  it('should sync state across multiple instances', () => {
    const { result: result1 } = renderHook(() => useSettingsModal());
    const { result: result2 } = renderHook(() => useSettingsModal());
    
    act(() => {
      result1.current.openSettingsModal();
    });

    // Both instances should reflect the change
    expect(result1.current.isSettingsOpen).toBe(true);
    expect(result2.current.isSettingsOpen).toBe(true);
  });
});

