import { getStatusColor, getStatusText } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  // Boş status için hiçbir şey render etme
  if (!status || status.trim() === '') {
    return null;
  }

  const colorClasses = getStatusColor(status);
  const text = getStatusText(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${colorClasses} ${sizeClasses}`}>
      {text}
    </span>
  );
} 