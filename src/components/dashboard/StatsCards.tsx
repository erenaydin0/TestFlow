'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react';
import { formatDuration } from '@/utils/dateUtils';
import { useI18n } from '@/hooks';

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

function StatsCards({ stats, loading = false }: StatsCardsProps) {
  const { t } = useI18n();
  const [animatedStats, setAnimatedStats] = useState({
    totalExecutions: 0,
    completedExecutions: 0,
    failedExecutions: 0,
    successRate: 0
  });
  const prevStatsRef = useRef(stats);

  // Counter animation effect - only animate when individual values change
  useEffect(() => {
    if (loading) return;

    const duration = 1000; // 1 second animation
    const steps = 60; // 60 frames
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4); // Easing function

      setAnimatedStats({
        totalExecutions: Math.round(easeOutQuart * stats.totalExecutions),
        completedExecutions: Math.round(easeOutQuart * stats.completedExecutions),
        failedExecutions: Math.round(easeOutQuart * stats.failedExecutions),
        successRate: Math.round(easeOutQuart * stats.successRate)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedStats({
          totalExecutions: stats.totalExecutions,
          completedExecutions: stats.completedExecutions,
          failedExecutions: stats.failedExecutions,
          successRate: stats.successRate
        });
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [stats.totalExecutions, stats.completedExecutions, stats.failedExecutions, stats.successRate, loading]);

  return (
    <>
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(5, 1fr)', 
      gap: '1.5rem', 
      marginBottom: '2rem' 
    }}>
      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t('dashboard.totalTests')}
            </p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--status-info)', margin: 0 }}>
              {loading ? '...' : animatedStats.totalExecutions}
            </p>
          </div>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'var(--status-info-bg)', 
            borderRadius: '0.5rem',
            transition: 'transform 0.3s ease'
          }}
          className="stat-icon">
            <BarChart3 size={20} style={{ color: 'var(--status-info)' }} />
          </div>
        </div>
      </div>

      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t('dashboard.passedTests')}
            </p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--status-success)', margin: 0 }}>
              {loading ? '...' : animatedStats.completedExecutions}
            </p>
          </div>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'var(--status-success-bg)', 
            borderRadius: '0.5rem',
            transition: 'transform 0.3s ease'
          }}
          className="stat-icon">
            <TrendingUp size={20} style={{ color: 'var(--status-success)' }} />
          </div>
        </div>
      </div>

      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t('dashboard.failedTests')}
            </p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--status-error)', margin: 0 }}>
              {loading ? '...' : animatedStats.failedExecutions}
            </p>
          </div>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'var(--status-error-bg)', 
            borderRadius: '0.5rem',
            transition: 'transform 0.3s ease'
          }}
          className="stat-icon">
            <TrendingDown size={20} style={{ color: 'var(--status-error)' }} />
          </div>
        </div>
      </div>

      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t('dashboard.averageDuration')}
            </p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--status-warning)', margin: 0 }}>
              {loading ? '...' : formatDuration(stats.avgDuration)}
            </p>
          </div>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'var(--status-warning-bg)', 
            borderRadius: '0.5rem',
            transition: 'transform 0.3s ease'
          }}
          className="stat-icon">
            <Clock size={20} style={{ color: 'var(--status-warning)' }} />
          </div>
        </div>
      </div>

      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t('dashboard.successRate')}
            </p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--status-success)', margin: 0 }}>
              {loading ? '...' : animatedStats.successRate}%
            </p>
          </div>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'var(--status-success-bg)', 
            borderRadius: '0.5rem',
            transition: 'transform 0.3s ease'
          }}
          className="stat-icon">
            <TrendingUp size={20} style={{ color: 'var(--status-success)' }} />
          </div>
        </div>
      </div>
    </div>

    <style jsx>{`
      .stat-card {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .stat-card:hover {
        transform: translateY(-4px);
      }

      .stat-card:hover .stat-icon {
        transform: scale(1.1) rotate(5deg);
      }
    `}</style>
    </>
  );
}

export default React.memo(StatsCards);
