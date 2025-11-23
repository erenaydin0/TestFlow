import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDropdown, useModal, useUnsavedChanges } from '../useUIInteractions';
import { TestStep } from '@/types';

// Mock useRouter
const mockRouter = {
  push: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock useI18n
vi.mock('../useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('useDropdown', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useDropdown());
    
    expect(result.current.isOpen).toBe(false);
    expect(result.current.isClosing).toBe(false);
  });

  it('should toggle dropdown', () => {
    const { result } = renderHook(() => useDropdown());
    
    act(() => {
      result.current.handleToggle();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('should close dropdown', () => {
    const { result } = renderHook(() => useDropdown());
    
    act(() => {
      result.current.handleToggle();
      result.current.handleClose();
    });

    expect(result.current.isClosing).toBe(true);
  });

  it('should call onClose callback', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useDropdown({ onClose }));
    
    act(() => {
      result.current.handleToggle();
      result.current.handleClose();
    });

    // Wait for animation to complete
    setTimeout(() => {
      expect(onClose).toHaveBeenCalled();
    }, 200);
  });
});

describe('useModal', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useModal());
    
    expect(result.current.isVisible).toBe(false);
    expect(result.current.isClosing).toBe(false);
  });

  it('should open modal', () => {
    const { result } = renderHook(() => useModal());
    
    act(() => {
      result.current.openModal();
    });

    expect(result.current.isVisible).toBe(true);
  });

  it('should close modal', () => {
    const { result } = renderHook(() => useModal());
    
    act(() => {
      result.current.openModal();
      result.current.closeModal();
    });

    expect(result.current.isClosing).toBe(true);
  });
});

describe('useUnsavedChanges', () => {
  const mockSteps: TestStep[] = [
    {
      id: 'step-1',
      type: 'navigate',
      config: { url: 'https://example.com' },
    },
  ];

  it('should initialize with no unsaved changes', () => {
    const { result } = renderHook(() =>
      useUnsavedChanges({
        testSteps: mockSteps,
        canUndo: false,
      })
    );

    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should detect unsaved changes', () => {
    const { result, rerender } = renderHook(
      ({ testSteps }) =>
        useUnsavedChanges({
          testSteps,
          canUndo: true,
        }),
      {
        initialProps: { testSteps: mockSteps },
      }
    );

    const newSteps = [
      ...mockSteps,
      {
        id: 'step-2',
        type: 'click',
        config: { selector: 'button' },
      },
    ];

    rerender({ testSteps: newSteps });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('should handle navigation with unsaved changes', () => {
    const { result, rerender } = renderHook(
      ({ testSteps }) =>
        useUnsavedChanges({
          testSteps,
          canUndo: true,
        }),
      {
        initialProps: { testSteps: mockSteps },
      }
    );

    const newSteps = [...mockSteps, { id: 'step-2', type: 'click', config: {} }];
    rerender({ testSteps: newSteps });

    act(() => {
      result.current.handleNavigation('/tests');
    });

    expect(result.current.showUnsavedDialog).toBe(true);
    expect(result.current.pendingNavigation).toBe('/tests');
  });

  it('should confirm navigation', () => {
    const { result } = renderHook(() =>
      useUnsavedChanges({
        testSteps: mockSteps,
        canUndo: true,
      })
    );

    act(() => {
      result.current.handleNavigation('/tests');
      result.current.confirmNavigation();
    });

    expect(result.current.showUnsavedDialog).toBe(false);
    expect(mockRouter.push).toHaveBeenCalledWith('/tests');
  });

  it('should cancel navigation', () => {
    const { result } = renderHook(() =>
      useUnsavedChanges({
        testSteps: mockSteps,
        canUndo: true,
      })
    );

    act(() => {
      result.current.handleNavigation('/tests');
      result.current.cancelNavigation();
    });

    expect(result.current.showUnsavedDialog).toBe(false);
    expect(result.current.pendingNavigation).toBeNull();
  });

  it('should mark as saved', () => {
    const { result, rerender } = renderHook(
      ({ testSteps }) =>
        useUnsavedChanges({
          testSteps,
          canUndo: true,
        }),
      {
        initialProps: { testSteps: mockSteps },
      }
    );

    const newSteps = [...mockSteps, { id: 'step-2', type: 'click', config: {} }];
    rerender({ testSteps: newSteps });

    expect(result.current.hasUnsavedChanges).toBe(true);

    act(() => {
      result.current.markAsSaved();
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
  });
});

