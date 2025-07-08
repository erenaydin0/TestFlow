import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getChartColors, getTextColors, getBorderColors, getBgColors } from '@/lib/chartUtils';

interface SuccessRateData {
  week: string;
  rate: number;
}

interface SuccessRateTrendProps {
  data: SuccessRateData[];
}

export default function SuccessRateTrend({ data }: SuccessRateTrendProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Başarı Oranı Trendi
      </h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
            <XAxis dataKey="week" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-primary)', 
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                color: 'var(--text-primary)'
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="rate" 
              stroke="var(--chart-primary)" 
              strokeWidth={3}
              dot={{ fill: 'var(--chart-primary)', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 