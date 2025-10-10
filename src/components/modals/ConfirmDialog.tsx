'use client';

import React, { useState } from 'react';
import { Button, ButtonGroup } from '@/components';
import { useModal } from '@/hooks/ui';
import { useI18n } from '@/contexts';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  // UnsavedChangesDialog özellikleri
  onDiscard?: () => void;
  discardText?: string;
  variant?: 'simple' | 'unsaved';
  isSaveDialogOpen?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'warning',
  onDiscard,
  discardText,
  variant = 'simple',
  isSaveDialogOpen = false
}) => {
  const { t } = useI18n();
  const [isSaving, setIsSaving] = useState(false);
  const { isVisible, getOverlayStyle, getModalStyle } = useModal(isOpen, {
    animationDuration: 200
  });

  if (!isVisible) return null;

  // UnsavedChangesDialog için saving modu
  const isInSavingMode = variant === 'unsaved' && (isSaving || isSaveDialogOpen);

  const handleConfirm = async () => {
    if (variant === 'unsaved') {
      setIsSaving(true);
      try {
        await onConfirm();
      } catch (error) {
        console.error('Save error:', error);
      } finally {
        setIsSaving(false);
      }
    } else {
      onConfirm();
      onClose();
    }
  };

  const handleDiscard = () => {
    if (onDiscard) {
      onDiscard();
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'danger': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#f59e0b';
    }
  };


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
        zIndex: 9999,
        ...getOverlayStyle()
      }}
      onClick={isInSavingMode ? undefined : onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          ...getModalStyle()
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          {/* Icon */}
          <div
            style={{
              width: variant === 'unsaved' ? '20px' : '48px',
              height: variant === 'unsaved' ? '20px' : '48px',
              borderRadius: '50%',
              backgroundColor: variant === 'unsaved' ? 'var(--status-warning)' : `${getIconColor()}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: variant === 'unsaved' ? '2px' : '0',
            }}
          >
            {variant === 'unsaved' ? (
              <svg width="12" height="12" fill="white" viewBox="0 0 16 16">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={getIconColor()}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {type === 'danger' && (
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                )}
                {type === 'warning' && (
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                )}
                {type === 'info' && (
                  <circle cx="12" cy="12" r="10" />
                )}
              </svg>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
              }}
            >
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <ButtonGroup 
          spacing="sm" 
          style={{ 
            marginTop: '24px',
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            disabled={isInSavingMode}
            onClick={onClose}
          >
            {cancelText || t('confirmDialog.cancel')}
          </Button>
          
          {variant === 'unsaved' && onDiscard && (
            <Button
              variant="outline"
              size="sm"
              disabled={isInSavingMode}
              onClick={handleDiscard}
              style={{ color: 'var(--status-error)', borderColor: 'var(--status-error)' }}
            >
              {discardText || t('unsavedChanges.dontSave')}
            </Button>
          )}
          
          <Button
            variant={variant === 'unsaved' ? 'primary' : (type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : 'primary')}
            size="sm"
            disabled={isInSavingMode}
            loading={isInSavingMode}
            onClick={handleConfirm}
          >
            {variant === 'unsaved' 
              ? (isInSavingMode ? t('unsavedChanges.saving') : (confirmText || t('unsavedChanges.save')))
              : (confirmText || t('confirmDialog.confirm'))
            }
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
};

export default ConfirmDialog;
