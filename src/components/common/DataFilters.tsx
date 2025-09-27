'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Filter, Chrome, Globe } from 'lucide-react';
import MultiSelect from '@/components/MultiSelect';
import { BrowserType } from '@/types';

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
            <button
              onClick={clearAllFilters}
              style={{
                marginLeft: 'auto',
                padding: '0.25rem 0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <X size={12} />
              Temizle
            </button>
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
          <select
            value={filters.status || ''}
            onChange={(e) => updateFilter('status', e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          >
            <option value="">Tüm Durumlar</option>
            {availableOptions.statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )}

        {/* Date Range */}
        {showDateRange && (
          <select
            value={filters.dateRange || ''}
            onChange={(e) => updateFilter('dateRange', e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          >
            <option value="">Tüm Tarihler</option>
            <option value="today">Bugün</option>
            <option value="yesterday">Dün</option>
            <option value="last7days">Son 7 Gün</option>
            <option value="last30days">Son 30 Gün</option>
          </select>
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
          <select
            value={filters.status || ''}
            onChange={(e) => updateFilter('status', e.target.value)}
            style={{
              padding: '0.375rem 0.5rem',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              minWidth: '120px',
              outline: 'none'
            }}
          >
            <option value="">Tüm Durumlar</option>
            {availableOptions.statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )}

        {/* Date Range */}
        {showDateRange && (
          <select
            value={filters.dateRange || ''}
            onChange={(e) => updateFilter('dateRange', e.target.value)}
            style={{
              padding: '0.375rem 0.5rem',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              minWidth: '120px',
              outline: 'none'
            }}
          >
            <option value="">Tüm Tarihler</option>
            <option value="today">Bugün</option>
            <option value="yesterday">Dün</option>
            <option value="last7days">Son 7 Gün</option>
            <option value="last30days">Son 30 Gün</option>
          </select>
        )}

        {/* Suite Filter */}
        <MultiSelect
          options={availableOptions.suites}
          selectedValues={filters.suite}
          onChange={(values) => updateFilter('suite', values)}
          placeholder="Tüm Test Grupları"
          className="min-w-[120px]"
        />

        {/* Tags Filter */}
        <MultiSelect
          options={availableOptions.tags}
          selectedValues={filters.tags}
          onChange={(values) => updateFilter('tags', values)}
          placeholder="Tüm Etiketler"
          className="min-w-[120px]"
        />

        {/* Browser Filter */}
        <MultiSelect
          options={availableOptions.browsers}
          selectedValues={filters.browserType}
          onChange={(values) => updateFilter('browserType', values)}
          placeholder="Tüm Tarayıcılar"
          className="min-w-[120px]"
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
          <button
            onClick={clearAllFilters}
            style={{
              marginLeft: 'auto',
              padding: '0.375rem 0.75rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              e.currentTarget.style.borderColor = '#dc2626';
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-primary)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <X size={12} />
            Filtreleri Temizle
          </button>
        )}
      </div>
    </div>
  );
};

export default DataFilters;
