import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';

import { getChartColors, getTextColors, getBorderColors, getBgColors } from '@/lib/chartUtils';

interface DailyResult {
  date: string;
  passed: number;
  failed: number;
  total: number;
}

interface DailyTestResultsProps {
  data: DailyResult[];
  onDateRangeChange?: (days: number) => void;
}

type DateRange = 7 | 14 | 30 | 60;

export default function DailyTestResults({ data, onDateRangeChange }: DailyTestResultsProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>(14);
  const colors = getChartColors();
  const textColors = getTextColors();
  const borderColors = getBorderColors();
  const bgColors = getBgColors();

  const dateRanges: { value: DateRange; label: string }[] = [
    { value: 7, label: '7 Gün' },
    { value: 14, label: '14 Gün' },
    { value: 30, label: '30 Gün' },
    { value: 60, label: '60 Gün' }
  ];

  const handleRangeChange = (range: DateRange) => {
    setSelectedRange(range);
    onDateRangeChange?.(range);
  };

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: textColors.primary }}>
          Günlük Test Sonuçları
        </h3>
        <div className="flex items-center gap-2">
          <Calendar size={16} style={{ color: textColors.secondary }} />
          <div className="flex gap-1">
            {dateRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => handleRangeChange(range.value)}
                className="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
                style={{
                  backgroundColor: selectedRange === range.value ? 'var(--accent-primary)' : 'transparent',
                  color: selectedRange === range.value ? 'white' : textColors.secondary,
                  border: `1px solid ${selectedRange === range.value ? 'var(--accent-primary)' : borderColors.primary}`
                }}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={borderColors.primary} />
            <XAxis 
              dataKey="date" 
              stroke={textColors.secondary}
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={10}
              tickFormatter={(value) => {
                const date = new Date(value);
                const day = date.getDate();
                const month = date.toLocaleDateString('tr-TR', { month: 'short' });
                return `${day} ${month}`;
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
                  const date = label ? new Date(label) : null;
                  const formattedDate = date ? date.toLocaleDateString('tr-TR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    weekday: 'long'
                  }) : '';
                  
                  return (
                    <div 
                      style={{ 
                        backgroundColor: bgColors.primary, 
                        border: `1px solid ${borderColors.primary}`,
                        borderRadius: '0.5rem',
                        padding: '12px',
                        color: textColors.primary,
                        fontSize: '13px',
                        minWidth: '200px'
                      }}
                    >
                      <p style={{ margin: '0 0 10px 0', fontWeight: '600', fontSize: '14px' }}>
                        {formattedDate}
                      </p>
                      {payload.map((entry, index) => (
                        <div key={index} style={{ 
                          margin: '6px 0', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ 
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%', 
                              backgroundColor: entry.color,
                              display: 'inline-block'
                            }} />
                            {entry.name}
                          </span>
                          <span style={{ fontWeight: '600', color: entry.color }}>
                            {entry.value}
                          </span>
                        </div>
                      ))}
                      <div style={{ 
                        marginTop: '10px', 
                        paddingTop: '10px', 
                        borderTop: `1px solid ${borderColors.primary}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: '600'
                      }}>
                        <span>Toplam</span>
                        <span style={{ color: textColors.primary }}>{total}</span>
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