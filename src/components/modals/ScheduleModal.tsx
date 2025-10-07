'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Calendar } from 'lucide-react';
import { ScheduledTest, Test, ScheduleFrequency } from '@/types/test';
import { Button } from '@/components/ui';
import { CustomSelect } from '@/components/common';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Partial<ScheduledTest>) => void;
  schedule?: ScheduledTest;
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

export function ScheduleModal({ isOpen, onClose, onSave, schedule }: ScheduleModalProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
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

  // Testleri yükle
  useEffect(() => {
    if (!isOpen) return;
    
    const loadTests = async () => {
      try {
        setLoadingTests(true);
        const response = await fetch('http://localhost:3001/api/tests');
        if (!response.ok) throw new Error('Testler yüklenemedi');
        const data = await response.json();
        setTests(data);
      } catch (error) {
        console.error('Testler yüklenirken hata:', error);
      } finally {
        setLoadingTests(false);
      }
    };
    
    loadTests();
  }, [isOpen]);

  // Schedule değiştiğinde form'u güncelle
  useEffect(() => {
    if (!isOpen) return;
    
    if (schedule) {
      setSelectedTest(schedule.testId);
      setFrequency(schedule.frequency);
      setCronExpression(schedule.schedule);
      
      // Cron'dan değerleri parse et
      const parts = schedule.schedule.split(' ');
      if (parts.length >= 5) {
        const [min, hr, day, month, weekday] = parts;
        
        if (schedule.frequency === 'daily' || schedule.frequency === 'weekly' || schedule.frequency === 'monthly') {
          setMinute(min);
          setHour(hr);
        }
        
        if (schedule.frequency === 'weekly' && weekday !== '*') {
          setSelectedDays(weekday.split(',').map(d => parseInt(d)));
        }
        
        if (schedule.frequency === 'monthly' && day !== '*') {
          setSelectedMonthDays(day.split(',').map(d => parseInt(d)));
        }
        
        if (schedule.frequency === 'custom') {
          if (hr.includes(',')) {
            setCustomType('hours');
            setSelectedHours(hr.split(',').map(h => parseInt(h)));
          } else if (hr.includes('/')) {
            setCustomType('interval');
            const interval = parseInt(hr.split('/')[1]);
            setCustomInterval(interval);
          }
        }
      }
    } else {
      // Reset form
      setSelectedTest('');
      setFrequency('daily');
      setHour('09');
      setMinute('00');
      setSelectedDays([1]);
      setSelectedMonthDays([1]);
      setSelectedHours([9]);
      setCustomInterval(6);
      setCustomType('hours');
      setCronExpression('0 9 * * *');
    }
  }, [schedule, isOpen]);

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
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '1rem',
        padding: '1.25rem',
        width: '90%',
        maxWidth: '900px',
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
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

        <form onSubmit={handleSubmit} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1,
          minHeight: 0
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '2rem',
            flex: 1,
            overflow: 'auto',
            minHeight: 0
          }}>
            {/* Sol Kolon */}
            <div>
              {/* Test Seçimi */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem'
                }}>
                  Hangi testi zamanlamak istiyorsunuz?
                </label>
                <CustomSelect
                  value={selectedTest}
                  onChange={(value) => setSelectedTest(value)}
                  options={[
                    { value: '', label: 'Test Seçin' },
                    ...tests.map(test => ({
                      value: test.id,
                      label: `${test.name} (${test.suite})`
                    }))
                  ]}
                  placeholder="Test Seçin"
                  style={{
                    opacity: schedule ? 0.6 : 1,
                    pointerEvents: schedule ? 'none' : 'auto'
                  }}
                />
              </div>

              {/* Frekans Seçimi */}
              <div style={{ marginBottom: '1.5rem' }}>
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '0.5rem' 
            }}>
              {FREQUENCY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(opt.value)}
                  style={{
                    padding: '0.625rem 0.75rem',
                    border: `2px solid ${frequency === opt.value ? 'var(--border-secondary)' : 'var(--border-primary)'}`,
                    borderRadius: '0.375rem',
                    backgroundColor: frequency === opt.value ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: frequency === opt.value ? 'var(--primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '0.875rem'
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
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
            </div>

            {/* Sağ Kolon */}
            <div>
          {/* Saat Seçimi - Hourly hariç */}
          {frequency !== 'hourly' && frequency !== 'custom' && (
            <div style={{ marginBottom: '1.5rem' }}>
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
            <div style={{ marginBottom: '1.5rem' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Hafta içi günler */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { value: 1, label: 'Pzt' },
                    { value: 2, label: 'Sal' },
                    { value: 3, label: 'Çar' },
                    { value: 4, label: 'Per' },
                    { value: 5, label: 'Cum' }
                  ].map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: `2px solid ${selectedDays.includes(day.value) ? 'var(--primary)' : 'var(--border-primary)'}`,
                        borderRadius: '0.5rem',
                        backgroundColor: selectedDays.includes(day.value) ? 'var(--accent-primary)' : 'var(--bg-secondary)',
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
                {/* Hafta sonu günler */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { value: 6, label: 'Cmt' },
                    { value: 0, label: 'Paz' }
                  ].map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: `2px solid ${selectedDays.includes(day.value) ? 'var(--primary)' : 'var(--border-primary)'}`,
                        borderRadius: '0.5rem',
                        backgroundColor: selectedDays.includes(day.value) ? 'var(--accent-primary)' : 'var(--bg-secondary)',
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
            </div>
          )}

          {/* Aylık - Gün Seçimi */}
          {frequency === 'monthly' && (
            <div style={{ marginBottom: '1.5rem' }}>
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
                gap: '0.35rem',
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
                      padding: '0.25rem',
                      border: `2px solid ${selectedMonthDays.includes(day) ? 'var(--primary)' : 'var(--border-primary)'}`,
                      borderRadius: '0.25rem',
                      backgroundColor: selectedMonthDays.includes(day) ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      color: selectedMonthDays.includes(day) ? 'white' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      minHeight: '28px'
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
            <div style={{ marginBottom: '1.5rem' }}>
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
                      backgroundColor: customType === 'hours' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
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
                      backgroundColor: customType === 'interval' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
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
                    gap: '0.375rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: '0.5rem',
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
                          padding: '0.5rem',
                          border: `2px solid ${selectedHours.includes(value) ? 'var(--primary)' : 'var(--border-primary)'}`,
                          borderRadius: '0.25rem',
                          backgroundColor: selectedHours.includes(value) ? 'var(--accent-primary)' : 'var(--bg-primary)',
                          color: selectedHours.includes(value) ? 'white' : 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
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
                          backgroundColor: customInterval === interval ? 'var(--accent-primary)' : 'var(--bg-secondary)',
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
            </div>
          </div>

          {/* Butonlar ve Özet */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            paddingTop: '1rem',
            marginTop: 'auto',
            borderTop: '1px solid var(--border-primary)',
            flexShrink: 0
          }}>
            {/* Sol: Zamanlama Özeti */}
            <div style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-primary)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flex: 1
            }}>
              <Clock size={16} style={{ color: 'var(--primary)' }} />
              {getCronDescription()}
            </div>
            
            {/* Sağ: Butonlar */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button variant="secondary" onClick={onClose} type="button">
                İptal
              </Button>
              <Button variant="primary" type="submit">
                {schedule ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
