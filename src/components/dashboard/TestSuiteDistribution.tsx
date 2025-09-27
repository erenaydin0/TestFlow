import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface TestSuite {
  name: string;
  value: number;
  color: string;
}

interface BrowserDistribution {
  name: string;
  value: number;
  color: string;
}

interface TestSuiteDistributionProps {
  testSuiteData: TestSuite[];
  browserData: BrowserDistribution[];
}

export default function TestSuiteDistribution({ testSuiteData, browserData }: TestSuiteDistributionProps) {
  const [currentPage, setCurrentPage] = useState(0); // 0: Test Dağılımı, 1: Tarayıcı Dağılımı
  
  const pages = [
    { title: 'Test Dağılımı', data: testSuiteData },
    { title: 'Tarayıcı Dağılımı', data: browserData }
  ];
  
  const currentData = pages[currentPage].data;
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {pages[currentPage].title}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage === 0 ? 1 : 0)}
            disabled={currentPage === 0}
            className="p-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)'
            }}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex gap-1">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor: index === currentPage ? 'var(--border-secondary)' : 'var(--border-primary)'
                }}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(currentPage === 1 ? 0 : 1)}
            disabled={currentPage === 1}
            className="p-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)'
            }}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Grafik - Sol taraf */}
        <div className="flex-shrink-0">
          <div className="h-[300px] w-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {currentData.map((entry, index) => (
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
            {currentData.map((item, index) => (
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
                    {item.value} {currentPage === 0 ? 'test' : 'çalıştırma'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Toplam istatistik */}
          <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Toplam {currentPage === 0 ? 'Test' : 'Çalıştırma'}
              </span>
              <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {currentData.reduce((sum, item) => sum + item.value, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 