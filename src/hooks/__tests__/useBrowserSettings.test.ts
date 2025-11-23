import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBrowserSettings } from '../useBrowserSettings';

describe('useBrowserSettings', () => {
  beforeEach(() => {
    localStorage.clear();
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
    const { result, waitFor } = renderHook(() => useBrowserSettings());
    
    // Wait for mount
    await waitFor(() => {
      expect(result.current.defaultBrowser).toBeDefined();
    });
    
    act(() => {
      result.current.setDefaultBrowser('firefox');
      result.current.setDefaultHeadless(true);
    });

    // Wait for effect to run
    await waitFor(() => {
      const stored = localStorage.getItem('browserSettings');
      expect(stored).toBeTruthy();
    });
    
    const stored = localStorage.getItem('browserSettings');
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

    const { result, waitFor } = renderHook(() => useBrowserSettings());
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.defaultBrowser).toBe('firefox');
    });
    
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

