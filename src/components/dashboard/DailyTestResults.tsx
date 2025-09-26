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