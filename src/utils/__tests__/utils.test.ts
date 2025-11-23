import { describe, it, expect } from 'vitest';
import { formatDuration, formatDate, getConsistentColorFromString } from '../utils';

describe('formatDuration', () => {
  it('should format milliseconds correctly', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('should format seconds correctly', () => {
    expect(formatDuration(1000)).toBe('1s');
    expect(formatDuration(5000)).toBe('5s');
    expect(formatDuration(59000)).toBe('59s');
  });

  it('should format minutes and seconds correctly', () => {
    expect(formatDuration(60000)).toBe('1m 0s');
    expect(formatDuration(125000)).toBe('2m 5s');
    expect(formatDuration(3661000)).toBe('61m 1s');
  });
});

describe('formatDate', () => {
  it('should format date in Turkish locale', () => {
    const date = new Date('2024-01-15T14:30:00');
    const formatted = formatDate(date, 'tr');
    expect(formatted).toContain('2024');
    expect(formatted).toContain('15');
  });

  it('should format date in English locale', () => {
    const date = new Date('2024-01-15T14:30:00');
    const formatted = formatDate(date, 'en');
    expect(formatted).toContain('2024');
    expect(formatted).toContain('15');
  });

  it('should use Turkish as default locale', () => {
    const date = new Date('2024-01-15T14:30:00');
    const formatted = formatDate(date);
    expect(formatted).toBeTruthy();
  });
});

describe('getConsistentColorFromString', () => {
  it('should return a valid color code', () => {
    const color = getConsistentColorFromString('test');
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should return the same color for the same string', () => {
    const color1 = getConsistentColorFromString('test-string');
    const color2 = getConsistentColorFromString('test-string');
    expect(color1).toBe(color2);
  });

  it('should return different colors for different strings', () => {
    const color1 = getConsistentColorFromString('test-1');
    const color2 = getConsistentColorFromString('test-2');
    expect(color1).not.toBe(color2);
  });

  it('should handle empty string', () => {
    const color = getConsistentColorFromString('');
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should handle special characters', () => {
    const color = getConsistentColorFromString('test@#$%^&*()');
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

