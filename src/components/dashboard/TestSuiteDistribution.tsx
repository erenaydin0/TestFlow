import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface TestSuite {
  name: string;
  value: number;
  color: string;
}

interface TestSuiteDistributionProps {
  data: TestSuite[];
}

export default function TestSuiteDistribution({ data }: TestSuiteDistributionProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          style={{ 
            backgroundColor: 'var(--bg-primary)', 
            border: '1px solid var(--border-primary)',
            borderRadius: '0.5rem',
            padding: '8px 12px',
            color: 'var(--text-primary)',
            fontSize: '14px'
          }}
        >
          <p style={{ margin: 0, color: 'var(--text-primary)' }}>
            {`${payload[0].name}: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
        Test Dağılımı
      </h3>
      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Grafik - Sol taraf */}
        <div className="flex-shrink-0">
          <div className="h-[300px] w-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Legend - Sağ taraf */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0 flex-1">
                  <div 
                    className="text-sm font-medium truncate" 
                    style={{ color: 'var(--text-primary)' }}
                    title={item.name}
                  >
                    {item.name}
                  </div>
                  <div 
                    className="text-xs" 
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.value} test
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Toplam istatistik */}
          <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Toplam Test
              </span>
              <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {data.reduce((sum, item) => sum + item.value, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 