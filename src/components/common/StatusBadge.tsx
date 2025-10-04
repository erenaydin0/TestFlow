interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

// Merkezi status yönetimi - tüm renkler ve yazılar burada
const STATUS_CONFIG = {
  completed: { color: '#059669', text: 'Başarılı' },
  failed: { color: '#dc2626', text: 'Başarısız' },
  running: { color: '#d97706', text: 'Çalışıyor' },
  queued: { color: '#6b7280', text: 'Sırada' },
  cancelled: { color: '#9ca3af', text: 'İptal Edildi' },
  passed: { color: '#059669', text: 'Başarılı' },
  pending: { color: '#6b7280', text: 'Beklemede' },
  active: { color: '#059669', text: 'Aktif' },
  paused: { color: '#d97706', text: 'Duraklatıldı' },
  disabled: { color: '#6b7280', text: 'Devre Dışı' }
} as const;

// Export edilebilir utility fonksiyonlar
export const getStatusColor = (status: string): string => {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || '#6b7280';
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
  const color = config?.color || '#6b7280';
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
