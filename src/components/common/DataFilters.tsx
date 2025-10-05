'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Filter, Chrome, Globe } from 'lucide-react';

import { MultiSelect, CustomSelect } from './';
import { Button } from '@/components/ui';
import { BrowserType, TestFilters, ExecutionFilters } from '@/types';

interface FilterState {
  search: string;
  status?: string;
  suite: string[];
  tags: string[];
  browserType: BrowserType[];
  dateRange?: string;
}

interface DataFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableOptions: {
    suites: string[];
    tags: string[];
    statuses?: string[];
    browsers: BrowserType[];
  };
  showDateRange?: boolean;
  showStatus?: boolean;
  searchPlaceholder?: string;
  className?: string;
}

const browserOptions = [
  { value: 'chromium' as BrowserType, label: 'Chrome', icon: Chrome, color: '#4285F4' },
  { value: 'firefox' as BrowserType, label: 'Firefox', icon: Globe, color: '#FF7139' },
  { value: 'webkit' as BrowserType, label: 'Safari', icon: Globe, color: '#007AFF' },
  { value: 'msedge' as BrowserType, label: 'Edge', icon: Globe, color: '#0078D4' }
];

const DataFilters: React.FC<DataFiltersProps> = ({
  filters,
  onFiltersChange,
  availableOptions,
  showDateRange = false,
  showStatus = false,
  searchPlaceholder = "Test ara...",
  className = ""
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      suite: [],
      tags: [],
      browserType: [],
      dateRange: ''
    });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.status ||
    filters.suite.length > 0 ||
    filters.tags.length > 0 ||
    filters.browserType.length > 0 ||
    filters.dateRange;

  return (
    <div className={`data-filters ${className}`}>
      {/* Mobile Filters */}
      <div style={{ 
        display: isMobile ? 'flex' : 'none',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            Filtreler
          </span>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="xs"
              icon={X}
              onClick={clearAllFilters}
              style={{ marginLeft: 'auto' }}
            >
              Temizle
            </Button>
          )}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--text-secondary)' 
            }} 
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.5rem',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Status Filter */}
        {showStatus && availableOptions.statuses && (
          <CustomSelect
            value={filters.status || ''}
            onChange={(value) => updateFilter('status', value)}
            options={[
              { value: '', label: 'Tüm Durumlar' },
              ...availableOptions.statuses.map(status => ({
                value: status,
                label: status
              }))
            ]}
            placeholder="Tüm Durumlar"
          />
        )}

        {/* Date Range */}
        {showDateRange && (
          <CustomSelect
            value={filters.dateRange || ''}
            onChange={(value) => updateFilter('dateRange', value)}
            options={[
              { value: '', label: 'Tüm Tarihler' },
              { value: 'today', label: 'Bugün' },
              { value: 'yesterday', label: 'Dün' },
              { value: 'last7days', label: 'Son 7 Gün' },
              { value: 'last30days', label: 'Son 30 Gün' }
            ]}
            placeholder="Tüm Tarihler"
          />
        )}

        {/* Suite Filter */}
        <MultiSelect
          options={availableOptions.suites}
          selectedValues={filters.suite}
          onChange={(values) => updateFilter('suite', values)}
          placeholder="Tüm Test Grupları"
          className="min-w-full"
        />

        {/* Tags Filter */}
        <MultiSelect
          options={availableOptions.tags}
          selectedValues={filters.tags}
          onChange={(values) => updateFilter('tags', values)}
          placeholder="Tüm Etiketler"
          className="min-w-full"
        />

        {/* Browser Filter */}
        <MultiSelect
          options={availableOptions.browsers}
          selectedValues={filters.browserType}
          onChange={(values) => updateFilter('browserType', values)}
          placeholder="Tüm Tarayıcılar"
          className="min-w-full"
          renderOption={(browser) => {
            const option = browserOptions.find(opt => opt.value === browser);
            if (!option) return browser;
            const IconComponent = option.icon;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconComponent size={14} style={{ color: option.color }} />
                <span>{option.label}</span>
              </div>
            );
          }}
        />
      </div>

      {/* Desktop Filters */}
      <div style={{ 
        display: isMobile ? 'none' : 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '200px' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--text-secondary)' 
            }} 
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            style={{
              width: '100%',
              padding: '0.375rem 0.5rem 0.375rem 2.25rem',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Status Filter */}
        {showStatus && availableOptions.statuses && (
          <CustomSelect
            value={filters.status || ''}
            onChange={(value) => updateFilter('status', value)}
            options={[
              { value: 'completed', label: 'Başarılı' },
              { value: 'failed', label: 'Başarısız' },
            ]}
            placeholder="Tüm Durumlar"
            className="min-w-[150px]"
          />
        )}

        {/* Date Range */}
        {showDateRange && (
          <CustomSelect
            value={filters.dateRange || ''}
            onChange={(value) => updateFilter('dateRange', value)}
            options={[
              { value: 'today', label: 'Bugün' },
              { value: 'yesterday', label: 'Dün' },
              { value: 'last7days', label: 'Son 7 Gün' },
              { value: 'last30days', label: 'Son 30 Gün' }
            ]}
            placeholder="Tüm Tarihler"
            className="min-w-[150px]"
          />
        )}

        {/* Suite Filter */}
        <MultiSelect
          options={availableOptions.suites}
          selectedValues={filters.suite}
          onChange={(values) => updateFilter('suite', values)}
          placeholder="Tüm Test Grupları"
          className="min-w-[150px]"
        />

        {/* Tags Filter */}
        <MultiSelect
          options={availableOptions.tags}
          selectedValues={filters.tags}
          onChange={(values) => updateFilter('tags', values)}
          placeholder="Tüm Etiketler"
          className="min-w-[150px]"
        />

        {/* Browser Filter */}
        <MultiSelect
          options={availableOptions.browsers}
          selectedValues={filters.browserType}
          onChange={(values) => updateFilter('browserType', values)}
          placeholder="Tüm Tarayıcılar"
          className="min-w-[150px]"
          renderOption={(browser) => {
            const option = browserOptions.find(opt => opt.value === browser);
            if (!option) return browser;
            const IconComponent = option.icon;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconComponent size={14} style={{ color: option.color }} />
                <span>{option.label}</span>
              </div>
            );
          }}
        />

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="xs"
            icon={X}
            onClick={clearAllFilters}
            className="min-w-[150px]"
            style={{ margin: '0' }}
          >
            Filtreleri Temizle
          </Button>
        )}
      </div>
    </div>
  );
};

export default DataFilters;
