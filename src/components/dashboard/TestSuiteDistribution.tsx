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
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Test Dağılımı
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-primary)', 
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                color: 'var(--text-primary)'
              }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {item.name}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 