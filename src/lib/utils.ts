import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Şimdi';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} dakika önce`;
  } else if (diffInHours < 24) {
    return `${diffInHours} saat önce`;
  } else if (diffInDays < 7) {
    return `${diffInDays} gün önce`;
  } else {
    return formatDate(date);
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'passed':
      return 'text-success-600 bg-success-50';
    case 'failed':
      return 'text-error-600 bg-error-50';
    case 'pending':
      return 'text-warning-600 bg-warning-50';
    case 'running':
      return 'text-primary-600 bg-primary-50';
    case 'active':
      return 'text-success-600 bg-success-50';
    case 'paused':
      return 'text-warning-600 bg-warning-50';
    case 'disabled':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'passed':
      return 'Başarılı';
    case 'failed':
      return 'Başarısız';
    case 'pending':
      return 'Beklemede';
    case 'running':
      return 'Çalışıyor';
    case 'active':
      return 'Aktif';
    case 'paused':
      return 'Duraklatıldı';
    case 'disabled':
      return 'Devre Dışı';
    default:
      return status;
  }
} 