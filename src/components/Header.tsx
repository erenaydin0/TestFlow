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
  const { theme, setTheme } = useTheme();
  const userPanelRef = useRef<HTMLDivElement>(null);

  // Panel dışına tıklandığında kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userPanelRef.current && !userPanelRef.current.contains(event.target as Node)) {
        setIsUserPanelOpen(false);
      }
    }

    if (isUserPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserPanelOpen]);

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
          <button style={{ 
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
          }}>
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
      `}</style>
    </header>
  );
} 