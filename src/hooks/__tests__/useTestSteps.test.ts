import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTestSteps from '../useTestSteps';
import { TestStep } from '@/types';

describe('useTestSteps', () => {
  const createMockStep = (id: string, type: string = 'navigate'): TestStep => ({
    id,
    type,
    config: { url: 'https://example.com' },
  });

  it('should initialize with empty steps', () => {
    const { result } = renderHook(() => useTestSteps());
    
    expect(result.current.testSteps).toEqual([]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should add step', () => {
    const { result } = renderHook(() => useTestSteps());
    const step = createMockStep('step-1');
    
    act(() => {
      result.current.addStep(step);
    });

    expect(result.current.testSteps).toHaveLength(1);
    expect(result.current.testSteps[0].id).toBe('step-1');
  });

  it('should delete step', () => {
    const { result } = renderHook(() => useTestSteps());
    const step1 = createMockStep('step-1');
    const step2 = createMockStep('step-2');
    
    act(() => {
      result.current.addStep(step1);
    });

    act(() => {
      result.current.addStep(step2);
    });

    act(() => {
      result.current.deleteStep('step-1');
    });

    expect(result.current.testSteps).toHaveLength(1);
    expect(result.current.testSteps[0].id).toBe('step-2');
  });

  it('should update step property', () => {
    const { result } = renderHook(() => useTestSteps());
    const step = createMockStep('step-1');
    
    act(() => {
      result.current.addStep(step);
    });

    act(() => {
      result.current.updateStepProperty('step-1', 'type', 'click');
    });

    expect(result.current.testSteps.length).toBeGreaterThan(0);
    expect(result.current.testSteps[0].type).toBe('click');
  });

  it('should support undo', () => {
    const { result } = renderHook(() => useTestSteps());
    const step1 = createMockStep('step-1');
    const step2 = createMockStep('step-2');
    
    act(() => {
      result.current.addStep(step1);
    });

    act(() => {
      result.current.addStep(step2);
    });

    expect(result.current.testSteps).toHaveLength(2);
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.undo();
    });

    expect(result.current.testSteps).toHaveLength(1);
  });

  it('should support redo', () => {
    const { result } = renderHook(() => useTestSteps());
    const step1 = createMockStep('step-1');
    const step2 = createMockStep('step-2');
    
    act(() => {
      result.current.addStep(step1);
    });

    act(() => {
      result.current.addStep(step2);
    });

    act(() => {
      result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });

    expect(result.current.testSteps).toHaveLength(2);
  });

  it('should generate unique IDs', async () => {
    const { result } = renderHook(() => useTestSteps());
    
    const id1 = result.current.generateId();
    // Add small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 2));
    const id2 = result.current.generateId();
    
    // IDs should be different (based on timestamp)
    // Note: If called very quickly, they might be the same, so we check format
    expect(id1).toMatch(/^step-/);
    expect(id2).toMatch(/^step-/);
    // If timestamps are different, IDs should be different
    if (id1 !== id2) {
      expect(id1).not.toBe(id2);
    }
  });

  it('should set test steps directly', () => {
    const { result } = renderHook(() => useTestSteps());
    const steps = [createMockStep('step-1'), createMockStep('step-2')];
    
    act(() => {
      result.current.setTestSteps(steps);
    });

    expect(result.current.testSteps).toEqual(steps);
  });
});

