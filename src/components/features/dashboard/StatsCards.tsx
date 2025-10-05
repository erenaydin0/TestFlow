'use client';

import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface StatsCardsProps {
  stats: {
    totalExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    avgDuration: number;
    successRate: number;
  };
  loading?: boolean;
}

export default function StatsCards({ stats, loading = false }: StatsCardsProps) {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(5, 1fr)', 
      gap: '1.5rem', 
      marginBottom: '2rem' 
    }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Toplam Test
            </p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--status-info)', margin: 0 }}>
              {loading ? '...' : stats.totalExecutions}
            </p>
          </div>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'var(--status-info-bg)', 
            borderRadius: '0.5rem' 
          }}>
            <BarChart3 size={20} style={{ color: 'var(--status-info)' }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Başarılı
            </p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--status-success)', margin: 0 }}>
              {loading ? '...' : stats.completedExecutions}
            </p>
          </div>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'var(--status-success-bg)', 
            borderRadius: '0.5rem' 
          }}>
            <TrendingUp size={20} style={{ color: 'var(--status-success)' }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Başarısız
            </p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--status-error)', margin: 0 }}>
              {loading ? '...' : stats.failedExecutions}
            </p>
          </div>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'var(--status-error-bg)', 
            borderRadius: '0.5rem' 
          }}>
            <TrendingDown size={20} style={{ color: 'var(--status-error)' }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Ortalama Süre
            </p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--status-warning)', margin: 0 }}>
              {loading ? '...' : formatDuration(stats.avgDuration)}
            </p>
          </div>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'var(--status-warning-bg)', 
            borderRadius: '0.5rem' 
          }}>
            <Clock size={20} style={{ color: 'var(--status-warning)' }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Başarı Oranı
            </p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--status-success)', margin: 0 }}>
              {loading ? '...' : stats.successRate}%
            </p>
          </div>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'var(--status-success-bg)', 
            borderRadius: '0.5rem' 
          }}>
            <TrendingUp size={20} style={{ color: 'var(--status-success)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
