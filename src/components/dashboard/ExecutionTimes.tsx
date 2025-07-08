import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getChartColors, getTextColors, getBorderColors, getBgColors } from '@/lib/chartUtils';

interface ExecutionTimeData {
  suite: string;
  time: number;
}

interface ExecutionTimesProps {
  data: ExecutionTimeData[];
}

export default function ExecutionTimes({ data }: ExecutionTimesProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Çalışma Süreleri
      </h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
            <XAxis dataKey="suite" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-primary)', 
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                color: 'var(--text-primary)'
              }} 
            />
            <Bar dataKey="time" fill="var(--chart-warning)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 