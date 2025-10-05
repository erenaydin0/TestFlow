import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

import { StatusBadge } from '@/components/common';
import { formatDuration, formatRelativeTime } from '@/lib/utils';

interface RecentTest {
  id: number;
  executionId?: string;
  name: string;
  status: 'passed' | 'failed' | 'running';
  duration: number;
  lastRun: Date;
  environment: string;
}

interface RecentTestsProps {
  data: RecentTest[];
}

export default function RecentTests({ data }: RecentTestsProps) {
  const router = useRouter();

  const handleTestClick = (test: RecentTest) => {
    if (test.executionId) {
      router.push(`/reports?executionId=${test.executionId}`);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Son Testler
        </h3>
        <button
          onClick={() => router.push('/reports')}
          className="flex items-center gap-1 text-sm font-medium transition-colors duration-200"
          style={{ 
            color: 'var(--accent-primary)',
            padding: '0.375rem 0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--accent-primary)',
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--accent-primary)';
          }}
        >
          Tümünü Göster
          <ArrowRight size={14} />
        </button>
      </div>
      {data.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
          <p>Henüz test çalıştırılmamış</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {data.map((test) => (
            <div 
              key={test.id} 
              className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-opacity-80 transition-all duration-200 min-w-0"
              style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderColor: 'var(--border-primary)' 
              }}
              onClick={() => handleTestClick(test)}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <StatusBadge status={test.status} size="sm" />
                <div className="min-w-0 flex-1">
                  <p 
                    className="text-sm font-medium truncate" 
                    style={{ color: 'var(--text-primary)' }}
                    title={test.name}
                  >
                    {test.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {test.status === 'running' ? 'Çalışıyor...' : formatRelativeTime(test.lastRun)}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {test.status === 'running' ? 'Devam ediyor' : formatDuration(test.duration)}
                </p>
                <p 
                  className="text-xs truncate max-w-[80px]" 
                  style={{ color: 'var(--text-tertiary)' }}
                  title={test.environment}
                >
                  {test.environment}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 