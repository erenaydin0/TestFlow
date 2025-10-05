import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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
  browserType?: string; // Gerçek browser type değeri (chromium, firefox, webkit, msedge)
}

interface TestSuiteDistributionProps {
  testSuiteData: TestSuite[];
  browserData: BrowserDistribution[];
}

export default function TestSuiteDistribution({ testSuiteData, browserData }: TestSuiteDistributionProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0); // 0: Test Dağılımı, 1: Tarayıcı Dağılımı
  const [legendPage, setLegendPage] = useState(0); // Legend sayfalama
  
  const ITEMS_PER_PAGE = 4; // Sayfa başına gösterilecek item sayısı
  
  const pages = [
    { title: 'Test Grubu Dağılımı', data: testSuiteData, link: '/tests' },
    { title: 'Tarayıcı Dağılımı', data: browserData, link: '/reports' }
  ];
  
  const currentData = pages[currentPage].data;
  const totalValue = currentData.reduce((sum, item) => sum + item.value, 0);
  
  // Legend sayfalama hesaplamaları
  const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);
  const startIndex = legendPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = currentData.slice(startIndex, endIndex);
  
  // Sayfa değiştiğinde legend sayfasını sıfırla
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setLegendPage(0);
  };

  // Item'a tıklandığında ilgili sayfaya filtre ile yönlendir
  const handleItemClick = (item: TestSuite | BrowserDistribution) => {
    if (currentPage === 0) {
      // Test Grubu Dağılımı - Reports sayfasına yönlendir
      router.push(`/reports?suite=${encodeURIComponent(item.name)}`);
    } else {
      // Tarayıcı Dağılımı - Reports sayfasına yönlendir
      // browserType varsa onu kullan, yoksa name'i kullan
      const browserValue = (item as BrowserDistribution).browserType || item.name;
      router.push(`/reports?browser=${encodeURIComponent(browserValue)}`);
    }
  };
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalValue) * 100).toFixed(1);
      
      return (
        <div 
          style={{ 
            backgroundColor: 'var(--bg-primary)', 
            border: '1px solid var(--border-primary)',
            borderRadius: '0.5rem',
            padding: '12px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            minWidth: '180px',
            zIndex: 9999,
            position: 'relative'
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', fontSize: '14px' }}>
            {data.name}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Toplam:</span>
            <span style={{ fontWeight: '600' }}>{data.value}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Oran:</span>
            <span style={{ fontWeight: '600', color: data.payload.color }}>%{percentage}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {pages[currentPage].title}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage === 0 ? 1 : 0)}
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
                onClick={() => handlePageChange(index)}
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor: index === currentPage ? 'var(--border-secondary)' : 'var(--border-primary)'
                }}
              />
            ))}
          </div>
          <button
            onClick={() => handlePageChange(currentPage === 1 ? 0 : 1)}
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
        <div className="flex-shrink-0 relative">
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
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Ortadaki toplam değer */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {totalValue}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Toplam
            </div>
          </div>
        </div>
        
        {/* Legend - Sağ taraf */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ height: '340px' }}>
          <div className="space-y-2 flex-1">
            {paginatedData.map((item, index) => {
              const percentage = ((item.value / totalValue) * 100).toFixed(1);
              return (
                <div 
                  key={startIndex + index} 
                  onClick={() => handleItemClick(item)}
                  className="flex items-center justify-between p-2 rounded-lg transition-all duration-200 cursor-pointer"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
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
                  <span 
                    className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 ml-2"
                    style={{ 
                      backgroundColor: `${item.color}15`,
                      color: item.color
                    }}
                  >
                    %{percentage}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Legend Sayfalama */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setLegendPage(Math.max(0, legendPage - 1))}
                disabled={legendPage === 0}
                className="p-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {legendPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setLegendPage(Math.min(totalPages - 1, legendPage + 1))}
                disabled={legendPage === totalPages - 1}
                className="p-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Toplam istatistik */}
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
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