'use client';

import React, { useState } from 'react';
import { Button, ButtonGroup } from '@/components/ui';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  onCancel: () => void;
  isSaveDialogOpen?: boolean;
}

const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  isSaveDialogOpen = false
}) => {
  const [isSaving, setIsSaving] = useState(false);
  
  // SaveDialog açıkken bu dialog'u saving modunda göster
  const isInSavingMode = isSaving || isSaveDialogOpen;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };
  if (!isOpen) return null;

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
      }}
      onClick={isInSavingMode ? undefined : onCancel}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '450px',
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          {/* Warning Icon */}
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '2px',
            }}
          >
            <svg width="12" height="12" fill="white" viewBox="0 0 16 16">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
          </div>

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
              Kaydedilmemiş Değişiklikler
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
              }}
            >
              Test workflow'unuzda kaydedilmemiş değişiklikler var. Bu sayfadan ayrılmadan önce değişikliklerinizi kaydetmek istiyor musunuz?
            </p>
          </div>
        </div>

        {/* Actions */}
        <ButtonGroup 
          align="end"
          spacing="sm"
          style={{ marginTop: '24px' }}
        >
          <Button
            variant="secondary"
            size="sm"
            disabled={isInSavingMode}
            onClick={onCancel}
          >
            İptal
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isInSavingMode}
            onClick={onDiscard}
            style={{ color: 'var(--status-error)', borderColor: 'var(--status-error)' }}
          >
            Kaydetme
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isInSavingMode}
            loading={isInSavingMode}
            onClick={handleSave}
          >
            {isInSavingMode ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
};

export default UnsavedChangesDialog;
