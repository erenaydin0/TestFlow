import { TestTube, CheckCircle, XCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { getChartColors } from '@/lib/chartUtils';

interface StatCard {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  trendColor: string;
  bgColor: string;
  iconColor: string;
}



export default function StatsCards() {
  const colors = getChartColors();
  
  const statsConfig = [
    {
      title: 'Toplam Test',
      value: '156',
      icon: <TestTube size={20} />,
      trend: '+12%',
      trendColor: colors.success,
      bgColor: '#eff6ff',
      iconColor: colors.primary
    },
    {
      title: 'Başarılı',
      value: '142',
      icon: <CheckCircle size={20} />,
      trend: '+8%',
      trendColor: colors.success,
      bgColor: '#f0fdf4',
      iconColor: colors.success
    },
    {
      title: 'Başarısız',
      value: '8',
      icon: <XCircle size={20} />,
      trend: '-3%',
      trendColor: colors.error,
      bgColor: '#fef2f2',
      iconColor: colors.error
    },
    {
      title: 'Başarı Oranı',
      value: '91%',
      icon: <BarChart3 size={20} />,
      trend: '+2%',
      trendColor: colors.success,
      bgColor: '#fef3c7',
      iconColor: colors.warning
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsConfig.map((stat, index) => (
        <div key={index} className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{stat.title}</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
            </div>
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: stat.bgColor }}
            >
              <div style={{ color: stat.iconColor }}>
                {stat.icon}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={12} color={stat.trendColor} />
            <span className="text-xs" style={{ color: stat.trendColor }}>
              {stat.trend}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>son hafta</span>
          </div>
        </div>
      ))}
    </div>
  );
} 