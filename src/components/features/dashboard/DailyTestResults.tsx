import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { getChartColors, getTextColors, getBorderColors, getBgColors } from '@/lib/chartUtils';

interface DailyResult {
  date: string;
  passed: number;
  failed: number;
  total: number;
}

interface DailyTestResultsProps {
  data: DailyResult[];
}

export default function DailyTestResults({ data }: DailyTestResultsProps) {
  const colors = getChartColors();
  const textColors = getTextColors();
  const borderColors = getBorderColors();
  const bgColors = getBgColors();

  return (
    <div className="card h-fit">
      <h3 className="text-lg font-semibold mb-4" style={{ color: textColors.primary }}>
        Günlük Test Sonuçları
      </h3>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={borderColors.primary} />
            <XAxis 
              dataKey="date" 
              stroke={textColors.secondary}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke={textColors.secondary} tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: bgColors.primary, 
                border: `1px solid ${borderColors.primary}`,
                borderRadius: '0.5rem',
                color: textColors.primary,
                fontSize: '14px'
              }}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('tr-TR');
              }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const total = payload[0].payload.total;
                  return (
                    <div 
                      style={{ 
                        backgroundColor: bgColors.primary, 
                        border: `1px solid ${borderColors.primary}`,
                        borderRadius: '0.5rem',
                        padding: '12px',
                        color: textColors.primary,
                        fontSize: '14px'
                      }}
                    >
                      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
                        {label ? new Date(label).toLocaleDateString('tr-TR') : ''}
                      </p>
                      {payload.map((entry, index) => (
                        <p key={index} style={{ margin: '4px 0', color: entry.color }}>
                          {`${entry.name}: ${entry.value}`}
                        </p>
                      ))}
                      <div style={{ 
                        marginTop: '8px', 
                        paddingTop: '8px', 
                        borderTop: `1px solid ${borderColors.primary}`,
                        color: '#ffffff',
                        fontWeight: 'bold'
                      }}>
                        Toplam: {total}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="passed" 
              stackId="1" 
              stroke={colors.success} 
              fill={colors.success} 
              fillOpacity={0.6}
              name="Başarılı"
            />
            <Area 
              type="monotone" 
              dataKey="failed" 
              stackId="1" 
              stroke={colors.error} 
              fill={colors.error} 
              fillOpacity={0.6}
              name="Başarısız"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 