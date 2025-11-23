import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTheme from '../useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    // Clean up
    if (typeof window !== 'undefined') {
      document.documentElement.removeAttribute('data-theme');
    }
  });

  it('should initialize with default theme', () => {
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.theme).toBeDefined();
    expect(['light', 'dark', 'cosmic']).toContain(result.current.theme);
  });

  it('should set theme', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
  });

  it('should toggle theme', () => {
    const { result } = renderHook(() => useTheme());
    
    const initialTheme = result.current.theme;
    
    act(() => {
      result.current.toggleTheme();
    });

    // Theme should change
    expect(result.current.theme).not.toBe(initialTheme);
  });

  it('should persist theme to localStorage', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.setTheme('dark');
    });

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      expect(stored).toBe('dark');
    }
  });
});

