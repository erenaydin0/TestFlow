'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';

import { MultiSelect, CustomSelect } from './';
import DateRangeFilter from './DateRangeFilter';
import { Button } from '@/components';
import { BrowserType } from '@/types';
import { useI18n } from '@/contexts';
import { BASIC_BROWSER_OPTIONS } from '@/lib/browserUtils';

interface FilterState {
  search: string;
  status?: string;
  suite: string[];
  tags: string[];
  browserType: BrowserType[];
  dateRange?: string;
  specificDate?: string; // Belirli bir tarih (YYYY-MM-DD formatında)
  startDate?: string; // Tarih aralığı başlangıcı
  endDate?: string; // Tarih aralığı bitişi
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

const browserOptions = BASIC_BROWSER_OPTIONS;

const DataFilters: React.FC<DataFiltersProps> = ({
  filters,
  onFiltersChange,
  availableOptions,
  showDateRange = false,
  showStatus = false,
  searchPlaceholder,
  className = ""
}) => {
  const { t } = useI18n();
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
      dateRange: '',
      specificDate: '',
      startDate: '',
      endDate: ''
    });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.status ||
    filters.suite.length > 0 ||
    filters.tags.length > 0 ||
    filters.browserType.length > 0 ||
    filters.dateRange ||
    filters.specificDate ||
    filters.startDate ||
    filters.endDate;

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
            {t('filters.filters')}
          </span>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="xs"
              icon={X}
              onClick={clearAllFilters}
              style={{ marginLeft: 'auto' }}
            >
              {t('filters.clear')}
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
            placeholder={searchPlaceholder || t('searchPlaceholders.search')}
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
              { value: '', label: t('common.allStatuses') },
              ...availableOptions.statuses.map(status => ({
                value: status,
                label: status
              }))
            ]}
            placeholder={t('common.allStatuses')}
          />
        )}

        {/* Date Range Filter */}
        {showDateRange && (
          <DateRangeFilter
            startDate={filters.startDate || filters.specificDate}
            endDate={filters.endDate || filters.specificDate}
            onDateChange={(start, end) => {
              onFiltersChange({
                ...filters,
                startDate: start,
                endDate: end,
                specificDate: start === end ? start : '', // Tek gün seçilirse specificDate'e de koy
                dateRange: '' // Eski dateRange'i temizle
              });
            }}
            onClear={() => {
              onFiltersChange({
                ...filters,
                startDate: '',
                endDate: '',
                specificDate: '',
                dateRange: ''
              });
            }}
          />
        )}

        {/* Suite Filter */}
        <MultiSelect
          options={availableOptions.suites}
          selectedValues={filters.suite}
          onChange={(values) => updateFilter('suite', values)}
          placeholder={t('common.allTestGroups')}
          className="min-w-full"
        />

        {/* Tags Filter */}
        <MultiSelect
          options={availableOptions.tags}
          selectedValues={filters.tags}
          onChange={(values) => updateFilter('tags', values)}
          placeholder={t('common.allTags')}
          className="min-w-full"
        />

        {/* Browser Filter */}
        <MultiSelect
          options={availableOptions.browsers}
          selectedValues={filters.browserType}
          onChange={(values) => updateFilter('browserType', values)}
          placeholder={t('common.allBrowsers')}
          className="min-w-full"
          renderOption={(browser) => {
            const option = browserOptions.find((opt: any) => opt.value === browser);
            if (!option) return browser;
            const IconComponent = option.icon;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {IconComponent && <IconComponent size={14} style={{ color: option.color }} />}
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
            placeholder={searchPlaceholder || t('searchPlaceholders.search')}
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
              { value: 'completed', label: t('status.passed') },
              { value: 'failed', label: t('status.failed') },
            ]}
            placeholder={t('common.allStatuses')}
            className="min-w-[120px]"
          />
        )}

        {/* Date Range Filter */}
        {showDateRange && (
          <DateRangeFilter
            startDate={filters.startDate || filters.specificDate}
            endDate={filters.endDate || filters.specificDate}
            onDateChange={(start, end) => {
              onFiltersChange({
                ...filters,
                startDate: start,
                endDate: end,
                specificDate: start === end ? start : '',
                dateRange: ''
              });
            }}
            onClear={() => {
              onFiltersChange({
                ...filters,
                startDate: '',
                endDate: '',
                specificDate: '',
                dateRange: ''
              });
            }}
          />
        )}

        {/* Suite Filter */}
        <MultiSelect
          options={availableOptions.suites}
          selectedValues={filters.suite}
          onChange={(values) => updateFilter('suite', values)}
          placeholder={t('common.allTestGroups')}
          className="min-w-[150px]"
        />

        {/* Tags Filter */}
        <MultiSelect
          options={availableOptions.tags}
          selectedValues={filters.tags}
          onChange={(values) => updateFilter('tags', values)}
          placeholder={t('common.allTags')}
          className="min-w-[150px]"
        />

        {/* Browser Filter */}
        <MultiSelect
          options={availableOptions.browsers}
          selectedValues={filters.browserType}
          onChange={(values) => updateFilter('browserType', values)}
          placeholder={t('common.allBrowsers')}
          className="min-w-[150px]"
          renderOption={(browser) => {
            const option = browserOptions.find((opt: any) => opt.value === browser);
            if (!option) return browser;
            const IconComponent = option.icon;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {IconComponent && <IconComponent size={14} style={{ color: option.color }} />}
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
            {t('filters.clearFilters')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default DataFilters;
