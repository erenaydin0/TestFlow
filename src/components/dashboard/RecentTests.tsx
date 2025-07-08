import StatusBadge from '@/components/StatusBadge';
import { formatDuration, formatRelativeTime } from '@/lib/utils';

interface RecentTest {
  id: number;
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
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Son Testler
      </h3>
      <div className="flex flex-col gap-3">
        {data.map((test) => (
          <div 
            key={test.id} 
            className="flex items-center justify-between p-3 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              borderColor: 'var(--border-primary)' 
            }}
          >
            <div className="flex items-center gap-3">
              <StatusBadge status={test.status} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {test.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {test.status === 'running' ? 'Çalışıyor...' : formatRelativeTime(test.lastRun)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {test.status === 'running' ? 'Devam ediyor' : formatDuration(test.duration)}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {test.environment}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 