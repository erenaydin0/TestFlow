'use client';

import { useState, useEffect } from 'react';
import { X, Sun, Moon, Monitor, Settings, Palette, Code, Globe } from 'lucide-react';
import { useTheme, useBrowserSettings, useI18n } from '@/contexts';
import { IconButton } from '@/components/ui';
import { useModal } from '@/hooks/ui';
import { LanguageSelector } from '@/components/common';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'browser' | 'appearance' | 'language';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('browser');
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
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
    { value: 'chromium', label: 'Chrome/Chromium' },
    { value: 'firefox', label: 'Firefox' },
    { value: 'webkit', label: 'Safari/WebKit' },
    { value: 'msedge', label: 'Microsoft Edge' }
  ];

  const themeOptions = [
    { value: 'light', label: t('common.light'), icon: Sun },
    { value: 'dark', label: t('common.dark'), icon: Moon },
    { value: 'system', label: t('common.system'), icon: Monitor }
  ];

  const tabs = [
    { id: 'browser' as TabType, label: t('settings.browser'), icon: Code },
    { id: 'appearance' as TabType, label: t('settings.appearance'), icon: Palette },
    { id: 'language' as TabType, label: t('settings.language'), icon: Globe }
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



  const renderBrowserSettings = () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Varsayılan Tarayıcı */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '0.75rem'
          }}>
            {t('settings.defaultBrowser')}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {browserOptions.map((browser) => {
              const Icon = browser;
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
                    backgroundColor: isSelected ? 'var(--color-selected)' : 'var(--bg-tertiary)',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    border: `2px solid ${isSelected ? 'var(--color-selected)' : 'var(--border-primary)'}`,
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
                  {browser.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Test Seçenekleri */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '0.75rem'
          }}>
            {t('settings.testOptions')}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
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
              {t('settings.headlessMode')}
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
              {t('settings.videoRecording')}
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
              {t('settings.screenshots')}
            </span>
          </label>
          </div>
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

  const renderLanguageSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '0.75rem'
        }}>
          {t('settings.selectLanguage')}
        </label>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-primary)'
        }}>
          <Globe size={20} color="var(--text-secondary)" />
          <div style={{ flex: 1 }}>
            <LanguageSelector />
          </div>
        </div>
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          marginTop: '0.5rem',
          marginBottom: 0
        }}>
          {t('settings.languageDescription')}
        </p>
      </div>
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
            borderBottom: '1px solid var(--border-primary)',
            height: '73px',
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1
            }}>
              {t('common.settings')}
            </h2>
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
                    backgroundColor: isActive ? 'var(--color-selected)' : 'transparent',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    border: isActive ? '2px solid var(--color-selected)' : '2px solid transparent',
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
            borderBottom: '1px solid var(--border-primary)',
            height: '73px',
            boxSizing: 'border-box'
          }}>
            <div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                lineHeight: 1
              }}>
                {(() => {
                  const currentTab = tabs.find(tab => tab.id === activeTab);
                  const Icon = currentTab?.icon || Settings;
                  return (
                    <>
                      <Icon size={20} />
                      {currentTab?.label} {t('settings.settings')}
                    </>
                  );
                })()}
              </h3>
            </div>
            <IconButton
              icon={X}
              variant="ghost"
              size="md"
              tooltip={t('common.close')}
              onClick={onClose}
            />
          </div>

          {/* Content */}
          <div style={{ 
            flex: 1,
            padding: '1.5rem',
            overflow: 'auto'
          }}>
            {activeTab === 'browser' && renderBrowserSettings()}
            {activeTab === 'appearance' && renderAppearanceSettings()}
            {activeTab === 'language' && renderLanguageSettings()}
          </div>
        </div>
      </div>
    </div>
  );
}
