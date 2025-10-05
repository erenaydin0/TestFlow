'use client';

import { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { tr } from 'date-fns/locale/tr';
import { Calendar, X } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

// Türkçe locale'i kaydet
registerLocale('tr', tr);

interface DateRangeFilterProps {
  startDate?: string;
  endDate?: string;
  onDateChange: (startDate: string, endDate: string) => void;
  onClear: () => void;
}

type QuickSelect = 'today' | 'yesterday' | 'last7days' | 'last14days' | 'last30days' | 'custom';

export default function DateRangeFilter({ startDate, endDate, onDateChange, onClear }: DateRangeFilterProps) {
  const [start, setStart] = useState<Date | null>(startDate ? new Date(startDate) : null);
  const [end, setEnd] = useState<Date | null>(endDate ? new Date(endDate) : null);
  const [showCalendar, setShowCalendar] = useState(false);

  // Props değiştiğinde state'i güncelle
  useEffect(() => {
    setStart(startDate ? new Date(startDate) : null);
    setEnd(endDate ? new Date(endDate) : null);
  }, [startDate, endDate]);

  // Tarihi YYYY-MM-DD formatına çevir (timezone sorununu önlemek için)
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const quickSelections = [
    { value: 'today' as QuickSelect, label: 'Bugün' },
    { value: 'yesterday' as QuickSelect, label: 'Dün' },
    { value: 'last7days' as QuickSelect, label: 'Son 7 Gün' },
    { value: 'last14days' as QuickSelect, label: 'Son 14 Gün' },
    { value: 'last30days' as QuickSelect, label: 'Son 30 Gün' }
  ];

  const handleQuickSelect = (quick: QuickSelect) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let newStart: Date;
    let newEnd: Date = new Date(today);

    switch (quick) {
      case 'today':
        newStart = new Date(today);
        break;
      case 'yesterday':
        newStart = new Date(today);
        newStart.setDate(today.getDate() - 1);
        newEnd = new Date(newStart);
        break;
      case 'last7days':
        newStart = new Date(today);
        newStart.setDate(today.getDate() - 6);
        break;
      case 'last14days':
        newStart = new Date(today);
        newStart.setDate(today.getDate() - 13);
        break;
      case 'last30days':
        newStart = new Date(today);
        newStart.setDate(today.getDate() - 29);
        break;
      default:
        return;
    }

    setStart(newStart);
    setEnd(newEnd);
    onDateChange(formatDateToString(newStart), formatDateToString(newEnd));
    setShowCalendar(false);
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [newStart, newEnd] = dates;
    setStart(newStart);
    setEnd(newEnd);
    
    if (newStart && newEnd) {
      onDateChange(formatDateToString(newStart), formatDateToString(newEnd));
      setShowCalendar(false);
    }
  };

  const handleClear = () => {
    setStart(null);
    setEnd(null);
    onClear();
    setShowCalendar(false);
  };

  const formatDateRange = () => {
    if (!start) return 'Tarih Seç';
    if (!end || start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return `${start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  return (
    <div className="relative">
      {/* Date Picker Button */}
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
        style={{
          backgroundColor: (start || end) ? 'var(--accent-primary)' : 'transparent',
          border: '1px solid var(--border-primary)',
          color: (start || end) ? 'white' : 'var(--text-secondary)'
        }}
      >
        <Calendar size={16} />
        <span style={{ minWidth: '120px', textAlign: 'left' }}>{formatDateRange()}</span>
      </button>

      {/* Calendar Popup */}
      {showCalendar && (
        <>
          <div 
            className="absolute top-full left-0 mt-2 z-50 flex gap-4"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: '1rem'
            }}
          >
            {/* Calendar */}
            <div>
              <DatePicker
                selected={start}
                onChange={handleDateChange}
                startDate={start}
                endDate={end}
                selectsRange
                inline
                locale="tr"
                dateFormat="dd/MM/yyyy"
                maxDate={new Date()}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                calendarClassName="custom-datepicker-calendar"
              />
            </div>

            {/* Quick Selections */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                minWidth: '140px',
                paddingLeft: '1rem',
                borderLeft: '1px solid var(--border-primary)'
              }}
            >
              <div 
                style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '600', 
                  color: 'var(--text-secondary)',
                  marginBottom: '0.25rem'
                }}
              >
                Hızlı Seçim
              </div>
              {quickSelections.map((quick) => (
                <button
                  key={quick.value}
                  onClick={() => handleQuickSelect(quick.value)}
                  className="px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 text-left"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {quick.label}
                </button>
              ))}
              
              {/* Clear Button */}
              {(start || end) && (
                <button
                  onClick={handleClear}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 mt-2"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--error-primary)',
                    border: '1px solid var(--error-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--error-primary)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--error-primary)';
                  }}
                >
                  <X size={14} />
                  Temizle
                </button>
              )}
            </div>
          </div>

          {/* Click outside to close calendar */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowCalendar(false)}
          />
        </>
      )}
    </div>
  );
}
