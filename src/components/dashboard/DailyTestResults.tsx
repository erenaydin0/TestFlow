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
    <div className="card">
      <h3 className="text-lg font-semibold mb-4" style={{ color: textColors.primary }}>
        Günlük Test Sonuçları
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={borderColors.primary} />
            <XAxis dataKey="date" stroke={textColors.secondary} />
            <YAxis stroke={textColors.secondary} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: bgColors.primary, 
                border: `1px solid ${borderColors.primary}`,
                borderRadius: '0.5rem',
                color: textColors.primary
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="passed" 
              stackId="1" 
              stroke={colors.success} 
              fill={colors.success} 
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="failed" 
              stackId="1" 
              stroke={colors.error} 
              fill={colors.error} 
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 