'use client';

import { useState, useEffect } from 'react';
import { X, Chrome, Globe, Sun, Moon, Monitor, Settings, Palette, Code } from 'lucide-react';
import { useTheme, useBrowserSettings } from '@/contexts';
import { IconButton } from '@/components/ui';
import { useModal } from '@/hooks/ui';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'general' | 'browser' | 'appearance';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const { theme, setTheme } = useTheme();
  const { 
    defaultBrowser, 
    setDefaultBrowser, 
    defaultHeadless, 
    setDefaultHeadless,
    defaultRecording,
    setDefaultRecording,
    defaultScreenshots,
    setDefaultScreenshots
  } = useBrowserSettings();

  const { isVisible, getOverlayStyle, getModalStyle } = useModal(isOpen, {
    animationDuration: 200
  });

  const browserOptions = [
    { value: 'chromium', label: 'Chrome/Chromium', icon: Chrome },
    { value: 'firefox', label: 'Firefox', icon: Globe },
    { value: 'webkit', label: 'Safari/WebKit', icon: Globe },
    { value: 'msedge', label: 'Microsoft Edge', icon: Globe }
  ];

  const themeOptions = [
    { value: 'light', label: 'Açık Tema', icon: Sun },
    { value: 'dark', label: 'Koyu Tema', icon: Moon },
    { value: 'system', label: 'Sistem', icon: Monitor }
  ];

  const tabs = [
    { id: 'general' as TabType, label: 'Genel', icon: Settings },
    { id: 'browser' as TabType, label: 'Tarayıcı', icon: Code },
    { id: 'appearance' as TabType, label: 'Görünüm', icon: Palette }
  ];

  // ESC tuşu ile kapatma ve tab navigasyonu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        setActiveTab(tabs[prevIndex].id);
      } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        setActiveTab(tabs[nextIndex].id);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, activeTab, tabs]);

  // Tab içeriklerini render eden fonksiyonlar
  const renderGeneralSettings = () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-primary)'
        }}>
          <div>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Otomatik Kaydetme
            </h4>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              margin: '0.25rem 0 0 0'
            }}>
              Test ayarlarını otomatik olarak kaydet
            </p>
          </div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              defaultChecked={true}
              style={{
                width: '1.125rem',
                height: '1.125rem',
                accentColor: '#3b82f6',
                cursor: 'pointer'
              }}
            />
          </label>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-primary)'
        }}>
          <div>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Bildirimler
            </h4>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              margin: '0.25rem 0 0 0'
            }}>
              Test tamamlandığında bildirim göster
            </p>
          </div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              defaultChecked={true}
              style={{
                width: '1.125rem',
                height: '1.125rem',
                accentColor: '#3b82f6',
                cursor: 'pointer'
              }}
            />
          </label>
        </div>
      </div>
  );

  const renderBrowserSettings = () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Varsayılan Tarayıcı */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            Varsayılan Tarayıcı
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {browserOptions.map((browser) => {
              const Icon = browser.icon;
              const isSelected = defaultBrowser === browser.value;
              
              return (
                <button
                  key={browser.value}
                  onClick={() => setDefaultBrowser(browser.value as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: isSelected ? '#3b82f6' : 'var(--bg-tertiary)',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    border: `2px solid ${isSelected ? '#3b82f6' : 'var(--border-primary)'}`,
                    boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none',
                    fontWeight: isSelected ? '600' : '500',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }
                  }}
                >
                  <Icon size={16} />
                  {browser.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Test Seçenekleri */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            padding: '0.75rem',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-primary)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }}>
            <input
              type="checkbox"
              checked={defaultHeadless}
              onChange={(e) => setDefaultHeadless(e.target.checked)}
              style={{
                width: '1.125rem',
                height: '1.125rem',
                accentColor: '#3b82f6',
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: '0.875rem',
              color: 'var(--text-primary)'
            }}>
              Headless Mod
            </span>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            padding: '0.75rem',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-primary)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }}>
            <input
              type="checkbox"
              checked={defaultRecording}
              onChange={(e) => setDefaultRecording(e.target.checked)}
              style={{
                width: '1.125rem',
                height: '1.125rem',
                accentColor: '#3b82f6',
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: '0.875rem',
              color: 'var(--text-primary)'
            }}>
              Video Kaydı
            </span>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            padding: '0.75rem',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-primary)',
            transition: 'all 0.2s ease',
            gridColumn: 'span 2'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }}>
            <input
              type="checkbox"
              checked={defaultScreenshots}
              onChange={(e) => setDefaultScreenshots(e.target.checked)}
              style={{
                width: '1.125rem',
                height: '1.125rem',
                accentColor: '#3b82f6',
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: '0.875rem',
              color: 'var(--text-primary)'
            }}>
              Ekran Görüntüleri
            </span>
          </label>
        </div>
      </div>
  );

  const renderAppearanceSettings = () => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {themeOptions.map((themeOption) => {
          const Icon = themeOption.icon;
          const isSelected = theme === themeOption.value;
          
          return (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value as any)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem',
                backgroundColor: isSelected ? '#3b82f6' : 'var(--bg-tertiary)',
                color: isSelected ? 'white' : 'var(--text-primary)',
                border: `2px solid ${isSelected ? '#3b82f6' : 'var(--border-primary)'}`,
                boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none',
                fontWeight: isSelected ? '600' : '500',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }
              }}
            >
              <Icon size={20} />
              {themeOption.label}
            </button>
          );
        })}
      </div>
  );

  if (!isVisible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        ...getOverlayStyle()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-primary)',
          width: '900px',
          height: '600px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          ...getModalStyle()
        }}
      >
        {/* Sidebar */}
        <div style={{
          width: '240px',
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-primary)',
          borderRadius: '0.75rem 0 0 0.75rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-primary)'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Ayarlar
            </h2>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              margin: '0.25rem 0 0 0'
            }}>
              Uygulama ayarlarını yönetin
            </p>
          </div>

          {/* Navigation */}
          <div style={{ 
            flex: 1,
            padding: '1rem'
          }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: isActive ? '#3b82f6' : 'transparent',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    border: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? '600' : '500',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    textAlign: 'left',
                    marginBottom: '0.5rem',
                    boxShadow: isActive ? '0 0 0 1px rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header with close button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-primary)'
          }}>
            <div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {(() => {
                  const currentTab = tabs.find(tab => tab.id === activeTab);
                  const Icon = currentTab?.icon || Settings;
                  return (
                    <>
                      <Icon size={20} />
                      {currentTab?.label} Ayarları
                    </>
                  );
                })()}
              </h3>
            </div>
            <IconButton
              icon={X}
              variant="ghost"
              size="md"
              tooltip="Kapat"
              onClick={onClose}
            />
          </div>

          {/* Content */}
          <div style={{ 
            flex: 1,
            padding: '1.5rem',
            overflow: 'auto'
          }}>
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'browser' && renderBrowserSettings()}
            {activeTab === 'appearance' && renderAppearanceSettings()}
          </div>
        </div>
      </div>
    </div>
  );
}
