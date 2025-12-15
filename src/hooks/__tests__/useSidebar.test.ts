import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSidebar } from '../useSidebar';

describe('useSidebar', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Reset global state
    vi.resetModules();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSidebar());
    
    // Check that the hook returns expected properties
    expect(result.current.isCollapsed).toBeDefined();
    expect(result.current.isModalOpen).toBeDefined();
    // Default state might be loaded from localStorage, so check for valid boolean
    expect(typeof result.current.isCollapsed).toBe('boolean');
    expect(typeof result.current.isModalOpen).toBe('boolean');
  });

  it('should set collapsed state', () => {
    const { result } = renderHook(() => useSidebar());
    
    act(() => {
      result.current.setIsCollapsed(true);
    });

    expect(result.current.isCollapsed).toBe(true);
  });

  it('should set modal open state', () => {
    const { result } = renderHook(() => useSidebar());
    
    act(() => {
      result.current.setIsModalOpen(true);
    });

    expect(result.current.isModalOpen).toBe(true);
  });

  it('should sync state across multiple instances', () => {
    const { result: result1 } = renderHook(() => useSidebar());
    const { result: result2 } = renderHook(() => useSidebar());
    
    act(() => {
      result1.current.setIsCollapsed(true);
    });

    expect(result1.current.isCollapsed).toBe(true);
    expect(result2.current.isCollapsed).toBe(true);
  });
});

