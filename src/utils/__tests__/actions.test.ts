import { describe, it, expect, vi } from 'vitest';
import { getActionByType, getTranslatedActionByType, availableActions } from '../actions';
import { MousePointer, Type, Clock } from 'lucide-react';

describe('actions utilities', () => {
  const mockTranslation = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'testSteps.navigate': 'Navigate',
      'testSteps.click': 'Click',
      'testSteps.input': 'Input',
      'testSteps.wait': 'Wait',
      'testSteps.verify': 'Verify',
    };
    return translations[key] || key;
  });

  describe('getActionByType', () => {
    it('should return action for valid type', () => {
      const action = getActionByType('navigate');
      expect(action).toBeDefined();
      expect(action?.type).toBe('navigate');
    });

    it('should return undefined for invalid type', () => {
      const action = getActionByType('invalid-type');
      expect(action).toBeUndefined();
    });

    it('should return action with correct structure', () => {
      const action = getActionByType('click');
      expect(action).toHaveProperty('type');
      expect(action).toHaveProperty('icon');
      expect(action).toHaveProperty('color');
      expect(action).toHaveProperty('category');
      expect(action).toHaveProperty('fields');
    });
  });

  describe('getTranslatedActionByType', () => {
    it('should return translated action for valid type', () => {
      const action = getTranslatedActionByType('navigate', mockTranslation);
      expect(action).toBeDefined();
      expect(action?.type).toBe('navigate');
    });

    it('should return undefined for invalid type', () => {
      const action = getTranslatedActionByType('invalid-type', mockTranslation);
      expect(action).toBeUndefined();
    });

    it('should use translation function for title', () => {
      const action = getTranslatedActionByType('navigate', mockTranslation);
      expect(mockTranslation).toHaveBeenCalled();
    });
  });

  describe('availableActions', () => {
    it('should have actions array', () => {
      expect(Array.isArray(availableActions)).toBe(true);
      expect(availableActions.length).toBeGreaterThan(0);
    });

    it('should have required action types', () => {
      const types = availableActions.map(a => a.type);
      expect(types).toContain('navigate');
      expect(types).toContain('click');
      expect(types).toContain('input');
    });

    it('should have valid action structure', () => {
      availableActions.forEach(action => {
        expect(action).toHaveProperty('type');
        expect(action).toHaveProperty('icon');
        expect(action).toHaveProperty('color');
        expect(action).toHaveProperty('category');
        expect(action).toHaveProperty('fields');
        expect(Array.isArray(action.fields)).toBe(true);
      });
    });

    it('should have valid categories', () => {
      const validCategories = ['navigation', 'interaction', 'input', 'validation', 'utility', 'advanced'];
      availableActions.forEach(action => {
        expect(validCategories).toContain(action.category);
      });
    });
  });
});

