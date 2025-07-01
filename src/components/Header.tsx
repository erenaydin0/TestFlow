'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, Settings, Sun, Moon, Monitor, LogOut, UserCircle, TestTube, ChevronDown } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const userPanelRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  // Panel dışına tıklandığında kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userPanelRef.current && !userPanelRef.current.contains(event.target as Node)) {
        setIsUserPanelOpen(false);
      }
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
        setIsNotificationPanelOpen(false);
      }
    }

    if (isUserPanelOpen || isNotificationPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserPanelOpen, isNotificationPanelOpen]);

  const themeOptions = [
    { id: 'light', label: 'Açık', icon: Sun },
    { id: 'dark', label: 'Koyu', icon: Moon },
  ];

  return (
    <header style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: 'var(--bg-primary)', 
      borderBottom: '1px solid var(--border-primary)', 
      padding: '1rem 1.5rem',
      transition: 'all 0.3s ease',
      height: '4rem',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '100%'
      }}>
        {/* Logo and App Name Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem'
          }}>
            <div style={{ 
              padding: '0.5rem', 
              backgroundColor: '#eff6ff', 
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TestTube size={24} color="#2563eb" />
            </div>
            <div>
              <h1 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1
              }}>
                TestFlow
              </h1>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--text-tertiary)', 
              width: '1rem', 
              height: '1rem' 
            }} />
            <input
              type="text"
              placeholder="Test ara..."
              style={{
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                outline: 'none',
                width: '16rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-primary)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Notifications */}
          <div style={{ position: 'relative' }} ref={notificationPanelRef}>
            <button 
              onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
              style={{ 
                position: 'relative', 
                padding: '0.5rem', 
                color: 'var(--text-secondary)', 
                background: 'none', 
                border: 'none', 
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Bell size={20} />
              <span style={{ 
                position: 'absolute', 
                top: '0.25rem', 
                right: '0.25rem', 
                width: '0.5rem', 
                height: '0.5rem', 
                backgroundColor: '#ef4444', 
                borderRadius: '50%' 
              }}></span>
            </button>

            {/* Notification Panel */}
            <div className={`notification-panel ${isNotificationPanelOpen ? 'open' : ''}`}>
              {/* Panel Header */}
              <div style={{ 
                padding: '1rem 1rem 0.5rem 1rem',
                borderBottom: '1px solid var(--border-primary)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between' 
                }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    Bildirimler
                  </h3>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.75rem',
                    fontWeight: 500
                  }}>
                    3
                  </span>
                </div>
              </div>

              {/* Notifications List */}
              <div style={{ maxHeight: '20rem', overflowY: 'auto' }}>
                {/* Sample Notifications */}
                <div style={{ 
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '0.5rem', 
                      height: '0.5rem', 
                      backgroundColor: '#22c55e', 
                      borderRadius: '50%',
                      marginTop: '0.375rem',
                      flexShrink: 0
                    }}></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 500, 
                        color: 'var(--text-primary)',
                        margin: '0 0 0.25rem 0'
                      }}>
                        Test başarıyla tamamlandı
                      </p>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)',
                        margin: '0 0 0.25rem 0'
                      }}>
                        "Kullanıcı Kayıt Testi" 2 dakika önce tamamlandı.
                      </p>
                      <p style={{ 
                        fontSize: '0.7rem', 
                        color: 'var(--text-tertiary)',
                        margin: 0
                      }}>
                        2 dakika önce
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '0.5rem', 
                      height: '0.5rem', 
                      backgroundColor: '#ef4444', 
                      borderRadius: '50%',
                      marginTop: '0.375rem',
                      flexShrink: 0
                    }}></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 500, 
                        color: 'var(--text-primary)',
                        margin: '0 0 0.25rem 0'
                      }}>
                        Test başarısız oldu
                      </p>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)',
                        margin: '0 0 0.25rem 0'
                      }}>
                        "Login Testi" element bulunamadı hatası aldı.
                      </p>
                      <p style={{ 
                        fontSize: '0.7rem', 
                        color: 'var(--text-tertiary)',
                        margin: 0
                      }}>
                        5 dakika önce
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '0.5rem', 
                      height: '0.5rem', 
                      backgroundColor: '#f59e0b', 
                      borderRadius: '50%',
                      marginTop: '0.375rem',
                      flexShrink: 0
                    }}></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 500, 
                        color: 'var(--text-primary)',
                        margin: '0 0 0.25rem 0'
                      }}>
                        Zamanlanmış test başladı
                      </p>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)',
                        margin: '0 0 0.25rem 0'
                      }}>
                        "Günlük Regresyon Testi" çalışmaya başladı.
                      </p>
                      <p style={{ 
                        fontSize: '0.7rem', 
                        color: 'var(--text-tertiary)',
                        margin: 0
                      }}>
                        10 dakika önce
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel Footer */}
              <div style={{ 
                padding: '0.75rem 1rem',
                borderTop: '1px solid var(--border-primary)'
              }}>
                <button style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '0.375rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}>
                  Tümünü Gör
                </button>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div style={{ position: 'relative' }} ref={userPanelRef}>
            <button 
              onClick={() => setIsUserPanelOpen(!isUserPanelOpen)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                padding: '0.5rem 1rem',
                paddingLeft: '1rem',
                borderLeft: '1px solid var(--border-primary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <p style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 500, 
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  Test Kullanıcısı
                </p>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-secondary)',
                  margin: 0
                }}>
                  Admin
                </p>
              </div>
              <div style={{ 
                width: '2rem', 
                height: '2rem', 
                backgroundColor: '#eff6ff', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px solid var(--border-primary)'
              }}>
                <User size={16} color="#2563eb" />
              </div>
            </button>

            {/* User Panel */}
            <div className={`user-panel ${isUserPanelOpen ? 'open' : ''}`}>
              {/* User Info */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                padding: '1rem',
                borderBottom: '1px solid var(--border-primary)'
              }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  backgroundColor: '#eff6ff', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px solid var(--border-primary)'
                }}>
                  <UserCircle size={20} color="#2563eb" />
                </div>
                <div>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    Test Kullanıcısı
                  </p>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)',
                    margin: 0
                  }}>
                    test@example.com
                  </p>
                </div>
              </div>

              {/* Appearance Settings */}
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-primary)' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 500, 
                    color: 'var(--text-primary)'
                  }}>
                    Görünüm
                  </span>
                  
                  {/* Compact Theme Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                      style={{
                        padding: '0.25rem 1.5rem 0.25rem 0.5rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '0.25rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        appearance: 'none',
                        transition: 'all 0.2s ease',
                        minWidth: '5rem',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLSelectElement).style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLSelectElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      {themeOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    
                    {/* Custom dropdown arrow */}
                    <div style={{
                      position: 'absolute',
                      right: '0.375rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: 'var(--text-tertiary)'
                    }}>
                      <ChevronDown size={12} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div style={{ padding: '0.5rem' }}>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}>
                  <Settings size={14} />
                  <span>Ayarlar</span>
                </button>
                
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}>
                  <LogOut size={14} />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .user-panel {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          width: 16rem;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-0.5rem);
          transition: all 0.2s ease;
          z-index: 50;
        }

        .user-panel.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .notification-panel {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          width: 20rem;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-0.5rem);
          transition: all 0.2s ease;
          z-index: 50;
        }

        .notification-panel.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
      `}</style>
    </header>
  );
} 