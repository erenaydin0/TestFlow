interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

// Cosmic status yönetimi - tüm renkler ve yazılar burada
const STATUS_CONFIG = {
  completed: { color: 'var(--status-success)', text: 'Başarılı' },
  failed: { color: 'var(--status-error)', text: 'Başarısız' },
  running: { color: 'var(--status-warning)', text: 'Çalışıyor' },
  queued: { color: 'var(--text-secondary)', text: 'Sırada' },
  cancelled: { color: 'var(--text-secondary)', text: 'İptal Edildi' },
  passed: { color: 'var(--status-success)', text: 'Başarılı' },
  pending: { color: 'var(--text-secondary)', text: 'Beklemede' },
  active: { color: 'var(--status-success)', text: 'Aktif' },
  paused: { color: 'var(--status-warning)', text: 'Duraklatıldı' },
  disabled: { color: 'var(--text-secondary)', text: 'Devre Dışı' }
} as const;

// Export edilebilir utility fonksiyonlar
export const getStatusColor = (status: string): string => {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || 'var(--text-secondary)';
};

export const getStatusText = (status: string): string => {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.text || status;
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  // Boş status için hiçbir şey render etme
  if (!status || status.trim() === '') {
    return null;
  }

  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  const color = config?.color || 'var(--text-secondary)';
  const text = config?.text || status;

  return (
    <span style={{
      padding: size === 'sm' ? '0.125rem 0.375rem' : '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: size === 'sm' ? '0.625rem' : '0.75rem',
      fontWeight: 500,
      backgroundColor: `${color}20`,
      color: color
    }}>
      {text}
    </span>
  );
}
