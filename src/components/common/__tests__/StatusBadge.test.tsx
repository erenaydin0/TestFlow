import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge, { getStatusColor, getStatusText } from '../StatusBadge';

// Mock useI18n hook
vi.mock('@/hooks', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'status.passed': 'Başarılı',
        'status.failed': 'Başarısız',
        'status.running': 'Çalışıyor',
        'status.queued': 'Sırada',
        'status.cancelled': 'İptal Edildi',
        'status.pending': 'Beklemede',
        'status.active': 'Aktif',
        'status.paused': 'Duraklatıldı',
        'status.disabled': 'Devre Dışı',
      };
      return translations[key] || key;
    },
  }),
}));

describe('StatusBadge', () => {
  describe('getStatusColor', () => {
    it('should return correct color for known statuses', () => {
      expect(getStatusColor('completed')).toBe('var(--status-success)');
      expect(getStatusColor('failed')).toBe('var(--status-error)');
      expect(getStatusColor('running')).toBe('var(--status-warning)');
    });

    it('should return default color for unknown status', () => {
      expect(getStatusColor('unknown-status')).toBe('var(--text-secondary)');
    });
  });

  describe('getStatusText', () => {
    it('should return correct text for known statuses', () => {
      expect(getStatusText('completed')).toBe('Başarılı');
      expect(getStatusText('failed')).toBe('Başarısız');
      expect(getStatusText('running')).toBe('Çalışıyor');
    });

    it('should return status name for unknown status', () => {
      expect(getStatusText('unknown-status')).toBe('unknown-status');
    });
  });

  describe('StatusBadge Component', () => {
    it('should render with correct status', () => {
      render(<StatusBadge status="completed" />);
      expect(screen.getByText('Başarılı')).toBeInTheDocument();
    });

    it('should not render for empty status', () => {
      const { container } = render(<StatusBadge status="" />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render for whitespace-only status', () => {
      const { container } = render(<StatusBadge status="   " />);
      expect(container.firstChild).toBeNull();
    });

    it('should render with different sizes', () => {
      const { container: containerSm } = render(<StatusBadge status="completed" size="sm" />);
      const { container: containerMd } = render(<StatusBadge status="completed" size="md" />);
      const { container: containerLg } = render(<StatusBadge status="completed" size="lg" />);

      expect(containerSm.firstChild).toBeInTheDocument();
      expect(containerMd.firstChild).toBeInTheDocument();
      expect(containerLg.firstChild).toBeInTheDocument();
    });

    it('should render all known statuses', () => {
      const statuses = ['completed', 'failed', 'running', 'queued', 'cancelled', 'pending', 'active', 'paused', 'disabled'];
      
      statuses.forEach(status => {
        const { unmount } = render(<StatusBadge status={status} />);
        expect(screen.getByText(new RegExp('.+'))).toBeInTheDocument();
        unmount();
      });
    });
  });
});

