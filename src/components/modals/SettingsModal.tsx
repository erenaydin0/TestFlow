'use client';

import { useEffect } from 'react';
import { X, Settings, Palette, Code, Globe } from 'lucide-react';
import { useTheme, useBrowserSettings, useI18n, useSidebar, useSettingsModal } from '@/contexts';
import { Theme } from '@/types';
import { IconButton } from '@/components';
import { useModal } from '@/hooks';
import { CustomSelect } from '@/components/common';
import { SETTINGS_BROWSER_OPTIONS } from '@/utils/browserUtils';

export default function SettingsModal() {
  const { isSettingsOpen, closeSettingsModal } = useSettingsModal();
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const { setIsModalOpen } = useSidebar();
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

  const { isVisible, getOverlayStyle, getModalStyle } = useModal(isSettingsOpen, {
    animationDuration: 200
  });

  const browserOptions = SETTINGS_BROWSER_OPTIONS;

  const themeOptions = [
    { value: 'light', label: t('common.light') },
    { value: 'dark', label: t('common.dark') },
    { value: 'system', label: t('common.system') }
  ];

  const languageOptions = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' }
  ];

  // ESC tuşu ile kapatma ve sidebar'ı devre dışı bırak
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSettingsOpen) return;
      
      if (e.key === 'Escape') {
        closeSettingsModal();
      }
    };

    if (isSettingsOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setIsModalOpen(true);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      setIsModalOpen(false);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      setIsModalOpen(false);
    };
  }, [isSettingsOpen, closeSettingsModal, setIsModalOpen]);



  const renderSettingsContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Tarayıcı Seçimi */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Code size={18} color="var(--text-secondary)" />
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {t('settings.defaultBrowser')}
          </h3>
        </div>
        <CustomSelect
          value={defaultBrowser}
          onChange={(value) => setDefaultBrowser(value as any)}
          options={browserOptions}
          style={{ maxWidth: '300px' }}
        />
      </div>

      {/* Tema Seçimi */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Palette size={18} color="var(--text-secondary)" />
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {t('settings.appearance')}
          </h3>
        </div>
        <CustomSelect
          value={theme}
          onChange={(value) => setTheme(value as Theme)}
          options={themeOptions}
          style={{ maxWidth: '300px' }}
        />
      </div>

      {/* Dil Seçimi */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Globe size={18} color="var(--text-secondary)" />
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {t('settings.language')}
          </h3>
        </div>
        <CustomSelect
          value={locale}
          onChange={(value) => setLocale(value)}
          options={languageOptions}
          style={{ maxWidth: '300px' }}
        />
      </div>

      {/* Test Seçenekleri */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Settings size={18} color="var(--text-secondary)" />
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {t('settings.testOptions')}
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
          closeSettingsModal();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-primary)',
          width: '500px',
          maxHeight: '80vh',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          ...getModalStyle()
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem 0.75rem 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} color="var(--text-primary)" />
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              {t('common.settings')}
            </h2>
          </div>
          <IconButton
            icon={X}
            variant="ghost"
            size="md"
            tooltip={t('common.close')}
            onClick={closeSettingsModal}
          />
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1,
          padding: '1.5rem',
          overflow: 'auto'
        }}>
          {renderSettingsContent()}
        </div>
      </div>
    </div>
  );
}
