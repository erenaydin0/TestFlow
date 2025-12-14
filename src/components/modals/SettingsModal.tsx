'use client';

import { useEffect, useState } from 'react';
import { X, Settings, Palette, Code, Globe, User, Lock, Trash2, Camera } from 'lucide-react';
import { useTheme, useBrowserSettings, useI18n, useSidebar, useSettingsModal } from '@/hooks';
import { Theme } from '@/types';
import { IconButton } from '@/components';
import { useModal } from '@/hooks';
import { CustomSelect } from '@/components/common';
import { BROWSER_OPTIONS } from '@/types/browser';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';

type SettingsTab = 'app' | 'account';

export default function SettingsModal() {
  const { isSettingsOpen, closeSettingsModal } = useSettingsModal();
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const { setIsModalOpen } = useSidebar();
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>('app');
  
  // Account settings state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
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

  const browserOptions = BROWSER_OPTIONS;

  const themeOptions = [
    { value: 'light', label: t('common.light') },
    { value: 'dark', label: t('common.dark') },
    { value: 'system', label: t('common.system') }
  ];

  const languageOptions = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' }
  ];

  // Initialize account form with session data
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

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

  // Reset form when modal closes
  useEffect(() => {
    if (!isSettingsOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setProfileMessage(null);
      setPasswordMessage(null);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  }, [isSettingsOpen]);

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      setProfileMessage({ type: 'error', text: t('account.nameRequired') });
      return;
    }

    setIsUpdatingProfile(true);
    setProfileMessage(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        // Trigger session refresh to get updated data from database
        await updateSession({});
        setProfileMessage({ type: 'success', text: t('account.profileUpdated') });
      } else {
        setProfileMessage({ type: 'error', text: data.message || t('common.error') });
      }
    } catch {
      setProfileMessage({ type: 'error', text: t('common.error') });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('account.allFieldsRequired') });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('account.passwordsDoNotMatch') });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: t('account.passwordTooShort') });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordMessage(null);

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMessage({ type: 'success', text: t('account.passwordChanged') });
      } else {
        setPasswordMessage({ type: 'error', text: data.message || t('common.error') });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: t('common.error') });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      return;
    }

    setIsDeletingAccount(true);

    try {
      const res = await fetch('/api/user', {
        method: 'DELETE',
      });

      if (res.ok) {
        await signOut({ callbackUrl: '/login' });
      } else {
        const data = await res.json();
        setProfileMessage({ type: 'error', text: data.message || t('common.error') });
      }
    } catch {
      setProfileMessage({ type: 'error', text: t('common.error') });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const renderAppSettings = () => (
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

  const renderAccountSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Profil Bilgileri */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <User size={18} color="var(--text-secondary)" />
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {t('account.profileInfo')}
          </h3>
        </div>
        
        {/* Avatar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-primary)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--cosmic-orange)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: '600',
            position: 'relative'
          }}>
            {session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt="Avatar" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ 
              color: 'var(--text-primary)', 
              fontWeight: '500',
              margin: 0,
              marginBottom: '0.25rem'
            }}>
              {session?.user?.name || t('account.noName')}
            </p>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '0.875rem',
              margin: 0
            }}>
              {session?.user?.email}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              transition: 'all 0.2s ease'
            }}>
              <Camera size={16} />
              {t('account.changeAvatar')}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append('avatar', file);

                  try {
                    const res = await fetch('/api/user/avatar', {
                      method: 'POST',
                      body: formData,
                    });

                    if (res.ok) {
                      // Trigger session refresh to get updated avatar from database
                      await updateSession({});
                      setProfileMessage({ type: 'success', text: t('account.avatarUpdated') });
                    } else {
                      const errorData = await res.json();
                      setProfileMessage({ type: 'error', text: errorData.message || t('common.error') });
                    }
                  } catch {
                    setProfileMessage({ type: 'error', text: t('common.error') });
                  }
                }}
              />
            </label>
            {session?.user?.image && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/user/avatar', {
                      method: 'DELETE',
                    });

                    if (res.ok) {
                      await updateSession({});
                      setProfileMessage({ type: 'success', text: t('account.avatarRemoved') });
                    } else {
                      const errorData = await res.json();
                      setProfileMessage({ type: 'error', text: errorData.message || t('common.error') });
                    }
                  } catch {
                    setProfileMessage({ type: 'error', text: t('common.error') });
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  color: '#ef4444',
                  transition: 'all 0.2s ease'
                }}
                title={t('account.removeAvatar')}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Name Input */}
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.375rem'
          }}>
            {t('account.name')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.375rem',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Email (read-only) */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.375rem'
          }}>
            {t('account.email')}
          </label>
          <input
            type="email"
            value={email}
            disabled
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.375rem',
              color: 'var(--text-tertiary)',
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'not-allowed'
            }}
          />
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            marginTop: '0.25rem',
            margin: '0.25rem 0 0 0'
          }}>
            {t('account.emailCannotChange')}
          </p>
        </div>

        {profileMessage && (
          <div style={{
            padding: '0.75rem',
            borderRadius: '0.375rem',
            backgroundColor: profileMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${profileMessage.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: profileMessage.type === 'success' ? '#22c55e' : '#ef4444',
            fontSize: '0.875rem',
            marginBottom: '0.75rem'
          }}>
            {profileMessage.text}
          </div>
        )}

        <button
          onClick={handleUpdateProfile}
          disabled={isUpdatingProfile}
          style={{
            padding: '0.625rem 1rem',
            backgroundColor: 'var(--cosmic-orange)',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: isUpdatingProfile ? 'not-allowed' : 'pointer',
            opacity: isUpdatingProfile ? 0.7 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          {isUpdatingProfile ? t('common.loading') : t('account.updateProfile')}
        </button>
      </div>

      {/* Şifre Değiştirme */}
      <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Lock size={18} color="var(--text-secondary)" />
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {t('account.changePassword')}
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.375rem'
            }}>
              {t('account.currentPassword')}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.375rem',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.375rem'
            }}>
              {t('account.newPassword')}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.375rem',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.375rem'
            }}>
              {t('account.confirmPassword')}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.375rem',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          {passwordMessage && (
            <div style={{
              padding: '0.75rem',
              borderRadius: '0.375rem',
              backgroundColor: passwordMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${passwordMessage.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: passwordMessage.type === 'success' ? '#22c55e' : '#ef4444',
              fontSize: '0.875rem'
            }}>
              {passwordMessage.text}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={isUpdatingPassword}
            style={{
              padding: '0.625rem 1rem',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: isUpdatingPassword ? 'not-allowed' : 'pointer',
              opacity: isUpdatingPassword ? 0.7 : 1,
              transition: 'all 0.2s ease',
              alignSelf: 'flex-start'
            }}
          >
            {isUpdatingPassword ? t('common.loading') : t('account.changePassword')}
          </button>
        </div>
      </div>

      {/* Hesap Silme */}
      <div style={{ 
        borderTop: '1px solid var(--border-primary)', 
        paddingTop: '1.5rem',
        marginTop: '0.5rem'
      }}>

        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '0.5rem'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            margin: 0,
            marginBottom: '1rem'
          }}>
            {t('account.deleteAccountWarning')}
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: '0.625rem 1rem',
                backgroundColor: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t('account.deleteAccount')}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#ef4444',
                margin: 0
              }}>
                {t('account.typeDeleteToConfirm')}
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.375rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  style={{
                    padding: '0.625rem 1rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                  style={{
                    padding: '0.625rem 1rem',
                    backgroundColor: deleteConfirmText === 'DELETE' ? '#ef4444' : 'rgba(239, 68, 68, 0.3)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: deleteConfirmText === 'DELETE' && !isDeletingAccount ? 'pointer' : 'not-allowed',
                    opacity: isDeletingAccount ? 0.7 : 1
                  }}
                >
                  {isDeletingAccount ? t('common.loading') : t('account.deleteAccountPermanently')}
                </button>
              </div>
            </div>
          )}
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
          width: '900px',
          maxHeight: '85vh',
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
          padding: '1rem 1.5rem',
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

        {/* Main Content with Sidebar */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Sidebar Tabs */}
          <div style={{
            width: '180px',
            minWidth: '180px',
            backgroundColor: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-primary)',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}>
            <button
              onClick={() => setActiveTab('app')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.75rem 1rem',
                backgroundColor: activeTab === 'app' ? 'var(--bg-tertiary)' : 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                color: activeTab === 'app' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: activeTab === 'app' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                width: '100%',
                borderLeft: activeTab === 'app' ? '3px solid var(--cosmic-orange)' : '3px solid transparent'
              }}
            >
              <Settings size={18} style={{ flexShrink: 0 }} />
              {t('settings.appSettings')}
            </button>
            <button
              onClick={() => setActiveTab('account')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.75rem 1rem',
                backgroundColor: activeTab === 'account' ? 'var(--bg-tertiary)' : 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                color: activeTab === 'account' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: activeTab === 'account' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                width: '100%',
                borderLeft: activeTab === 'account' ? '3px solid var(--cosmic-orange)' : '3px solid transparent'
              }}
            >
              <User size={18} style={{ flexShrink: 0 }} />
              {t('settings.accountSettings')}
            </button>
          </div>

          {/* Content */}
          <div style={{ 
            flex: 1,
            padding: '1.5rem',
            overflow: 'auto'
          }}>
            {activeTab === 'app' ? renderAppSettings() : renderAccountSettings()}
          </div>
        </div>
      </div>
    </div>
  );
}
