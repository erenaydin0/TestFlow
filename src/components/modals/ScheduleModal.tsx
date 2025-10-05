'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Calendar } from 'lucide-react';
import { ScheduledTest, Test, ScheduleFrequency } from '@/types/test';
import { Button } from '@/components/ui';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Partial<ScheduledTest>) => void;
  schedule?: ScheduledTest;
  tests: Test[];
}

const FREQUENCY_OPTIONS: { value: ScheduleFrequency; label: string; description: string }[] = [
  { value: 'hourly', label: 'Her Saat', description: 'Her saat başı çalışır' },
  { value: 'daily', label: 'Her Gün', description: 'Belirlediğiniz saatte her gün' },
  { value: 'weekly', label: 'Haftalık', description: 'Haftanın belirli günlerinde' },
  { value: 'monthly', label: 'Aylık', description: 'Ayın belirli günlerinde' },
  { value: 'custom', label: 'Özel', description: 'Belirli saatlerde çalıştır' }
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, '0')}:00`
}));

export function ScheduleModal({ isOpen, onClose, onSave, schedule, tests }: ScheduleModalProps) {
  const [selectedTest, setSelectedTest] = useState(schedule?.testId || '');
  const [frequency, setFrequency] = useState<ScheduleFrequency>(schedule?.frequency || 'daily');
  
  // Zamanlama detayları
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // Haftalık için
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([1]); // Aylık için
  const [selectedHours, setSelectedHours] = useState<number[]>([9]); // Özel için - belirli saatler
  const [customInterval, setCustomInterval] = useState<number>(6); // Özel için - saat aralığı
  const [customType, setCustomType] = useState<'hours' | 'interval'>('hours'); // Özel tip
  const [cronExpression, setCronExpression] = useState('0 9 * * *');

  // Cron ifadesini otomatik oluştur
  useEffect(() => {
    let cron = '';
    switch (frequency) {
      case 'hourly':
        cron = '0 * * * *';
        break;
      case 'daily':
        cron = `${minute} ${hour} * * *`;
        break;
      case 'weekly':
        cron = `${minute} ${hour} * * ${selectedDays.sort().join(',')}`;
        break;
      case 'monthly':
        cron = `${minute} ${hour} ${selectedMonthDays.sort().join(',')} * *`;
        break;
      case 'custom':
        if (customType === 'hours') {
          // Belirli saatlerde: "0 9,14,18 * * *"
          cron = `0 ${selectedHours.sort((a, b) => a - b).join(',')} * * *`;
        } else {
          // Belirli aralıklarla: "0 */6 * * *"
          cron = `0 */${customInterval} * * *`;
        }
        break;
    }
    setCronExpression(cron);
  }, [frequency, hour, minute, selectedDays, selectedMonthDays, selectedHours, customInterval, customType]);
  
  // Cron ifadesini açıklama olarak göster
  const getCronDescription = () => {
    switch (frequency) {
      case 'hourly':
        return 'Her saat başı çalışacak';
      case 'daily':
        return `Her gün saat ${hour}:${minute}'de çalışacak`;
      case 'weekly':
        const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const days = selectedDays.map(d => dayNames[d]).join(', ');
        return `Her hafta ${days} günleri saat ${hour}:${minute}'de çalışacak`;
      case 'monthly':
        return `Her ayın ${selectedMonthDays.join(', ')}. günlerinde saat ${hour}:${minute}'de çalışacak`;
      case 'custom':
        if (customType === 'hours') {
          const hours = selectedHours.sort((a, b) => a - b).map(h => `${h.toString().padStart(2, '0')}:00`).join(', ');
          return `Her gün saat ${hours}'de çalışacak`;
        } else {
          return `Her ${customInterval} saatte bir çalışacak`;
        }
      default:
        return '';
    }
  };
  
  const toggleHour = (hour: number) => {
    setSelectedHours(prev => 
      prev.includes(hour) 
        ? prev.filter(h => h !== hour)
        : [...prev, hour]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const test = tests.find(t => t.id === selectedTest);
    if (!test) return;

    onSave({
      testId: selectedTest,
      name: test.name,
      description: test.description,
      frequency,
      schedule: cronExpression,
      suite: test.suite,
      environment: 'production',
      status: 'active',
      enabled: true,
      notifyOnFailure: true,
      retryOnFailure: true,
      maxRetries: 3
    });
    
    onClose();
  };
  
  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };
  
  const toggleMonthDay = (day: number) => {
    setSelectedMonthDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {schedule ? 'Zamanlamayı Düzenle' : 'Yeni Zamanlama'}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Test Seçimi */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem'
            }}>
              Hangi testi zamanlamak istiyorsunuz?
            </label>
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              required
              disabled={!!schedule}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border-primary)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9375rem',
                outline: 'none',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}
            >
              <option value="">Test Seçin</option>
              {tests.map(test => (
                <option key={test.id} value={test.id}>
                  {test.name} ({test.suite})
                </option>
              ))}
            </select>
          </div>

          {/* Frekans Seçimi */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem'
            }}>
              Ne sıklıkla çalışsın?
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem' 
            }}>
              {FREQUENCY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(opt.value)}
                  style={{
                    padding: '1rem',
                    border: `2px solid ${frequency === opt.value ? 'var(--primary)' : 'var(--border-primary)'}`,
                    borderRadius: '0.5rem',
                    backgroundColor: frequency === opt.value ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                    color: frequency === opt.value ? 'var(--primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (frequency !== opt.value) {
                      e.currentTarget.style.borderColor = 'var(--text-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (frequency !== opt.value) {
                      e.currentTarget.style.borderColor = 'var(--border-primary)';
                    }
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Saat Seçimi - Hourly hariç */}
          {frequency !== 'hourly' && frequency !== 'custom' && (
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.75rem'
              }}>
                <Clock size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Saat kaçta çalışsın?
              </label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hour}
                    onChange={(e) => setHour(e.target.value.padStart(2, '0'))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '1.25rem',
                      textAlign: 'center',
                      outline: 'none'
                    }}
                  />
                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                    Saat
                  </div>
                </div>
                <span style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>:</span>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minute}
                    onChange={(e) => setMinute(e.target.value.padStart(2, '0'))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '1.25rem',
                      textAlign: 'center',
                      outline: 'none'
                    }}
                  />
                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                    Dakika
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Haftalık - Gün Seçimi */}
          {frequency === 'weekly' && (
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.75rem'
              }}>
                <Calendar size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Hangi günler?
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { value: 1, label: 'Pzt' },
                  { value: 2, label: 'Sal' },
                  { value: 3, label: 'Çar' },
                  { value: 4, label: 'Per' },
                  { value: 5, label: 'Cum' },
                  { value: 6, label: 'Cmt' },
                  { value: 0, label: 'Paz' }
                ].map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    style={{
                      flex: 1,
                      minWidth: '60px',
                      padding: '0.75rem',
                      border: `2px solid ${selectedDays.includes(day.value) ? 'var(--primary)' : 'var(--border-primary)'}`,
                      borderRadius: '0.5rem',
                      backgroundColor: selectedDays.includes(day.value) ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: selectedDays.includes(day.value) ? 'white' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Aylık - Gün Seçimi */}
          {frequency === 'monthly' && (
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.75rem'
              }}>
                <Calendar size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Ayın hangi günleri?
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.5rem',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '0.5rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem'
              }}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleMonthDay(day)}
                    style={{
                      padding: '0.5rem',
                      border: `2px solid ${selectedMonthDays.includes(day) ? 'var(--primary)' : 'var(--border-primary)'}`,
                      borderRadius: '0.375rem',
                      backgroundColor: selectedMonthDays.includes(day) ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: selectedMonthDays.includes(day) ? 'white' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Özel Zamanlama */}
          {frequency === 'custom' && (
            <div style={{ marginBottom: '2rem' }}>
              {/* Özel Tip Seçimi */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem'
                }}>
                  Nasıl zamanlamak istersiniz?
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setCustomType('hours')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: `2px solid ${customType === 'hours' ? 'var(--primary)' : 'var(--border-primary)'}`,
                      borderRadius: '0.5rem',
                      backgroundColor: customType === 'hours' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                      color: customType === 'hours' ? 'var(--primary)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    Belirli Saatlerde
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomType('interval')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: `2px solid ${customType === 'interval' ? 'var(--primary)' : 'var(--border-primary)'}`,
                      borderRadius: '0.5rem',
                      backgroundColor: customType === 'interval' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                      color: customType === 'interval' ? 'var(--primary)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    Belirli Aralıklarla
                  </button>
                </div>
              </div>

              {/* Belirli Saatlerde */}
              {customType === 'hours' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0.75rem'
                  }}>
                    <Clock size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Hangi saatlerde çalışsın?
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '0.5rem',
                    maxHeight: '280px',
                    overflowY: 'auto',
                    padding: '0.75rem',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--bg-secondary)'
                  }}>
                    {HOUR_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleHour(value)}
                        style={{
                          padding: '0.625rem',
                          border: `2px solid ${selectedHours.includes(value) ? 'var(--primary)' : 'var(--border-primary)'}`,
                          borderRadius: '0.375rem',
                          backgroundColor: selectedHours.includes(value) ? 'var(--primary)' : 'var(--bg-primary)',
                          color: selectedHours.includes(value) ? 'white' : 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                    Çoklu seçim yapabilirsiniz. Örn: 09:00, 14:00, 18:00
                  </p>
                </div>
              )}

              {/* Belirli Aralıklarla */}
              {customType === 'interval' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0.75rem'
                  }}>
                    <Clock size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Kaç saatte bir çalışsın?
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {[2, 3, 4, 6, 8, 12].map(interval => (
                      <button
                        key={interval}
                        type="button"
                        onClick={() => setCustomInterval(interval)}
                        style={{
                          flex: '1 1 calc(33.333% - 0.5rem)',
                          minWidth: '100px',
                          padding: '1rem',
                          border: `2px solid ${customInterval === interval ? 'var(--primary)' : 'var(--border-primary)'}`,
                          borderRadius: '0.5rem',
                          backgroundColor: customInterval === interval ? 'var(--primary)' : 'var(--bg-secondary)',
                          color: customInterval === interval ? 'white' : 'var(--text-primary)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '1rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        {interval} Saat
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.75rem' }}>
                    Test her {customInterval} saatte bir otomatik olarak çalışacak
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Özet */}
          <div style={{ 
            marginBottom: '2rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-primary)'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem'
            }}>
              Zamanlama Özeti
            </div>
            <div style={{ 
              fontSize: '0.9375rem', 
              color: 'var(--text-primary)',
              fontWeight: 500
            }}>
              {getCronDescription()}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-tertiary)',
              marginTop: '0.5rem',
              fontFamily: 'monospace'
            }}>
              Cron: {cronExpression}
            </div>
          </div>

          {/* Butonlar */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-primary)'
          }}>
            <Button variant="secondary" onClick={onClose} type="button">
              İptal
            </Button>
            <Button variant="primary" type="submit">
              {schedule ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
