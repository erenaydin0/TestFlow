'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Save, X, AlertCircle, Tag, FolderOpen, Globe, Edit } from 'lucide-react';

import AutocompleteInput from '@/components/ui/AutocompleteInput';
import { Button, ButtonGroup } from '@/components/ui';
import { BrowserType, TestFormData, TestModalProps } from '@/types';
import { getExistingTags, getExistingSuites } from '@/lib/utils';
import { useModal } from '@/hooks/ui';
import { useI18n } from '@/contexts';


const TestModal: React.FC<TestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isUpdating = false,
  mode = 'save',
  title,
  description
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState('');
  const [suite, setSuite] = useState('Default');
  const [browserType, setBrowserType] = useState<BrowserType>('chromium');
  const [errors, setErrors] = useState<string[]>([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [existingSuites, setExistingSuites] = useState<string[]>([]);
  const hasInitialized = useRef(false);
  const { t } = useI18n();

  const { isVisible, getOverlayStyle, getModalStyle } = useModal(isOpen, {
    animationDuration: 200
  });

  // Load existing tags and suites when dialog opens
  useEffect(() => {
    if (isOpen) {
      setExistingTags(getExistingTags());
      setExistingSuites(getExistingSuites());
    }
  }, [isOpen]);

  // Initialize form with initial data - when dialog opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setDesc(initialData.description || '');
        setTags(initialData.tags?.join(', ') || '');
        setSuite(initialData.suite || 'Default');
        setBrowserType(initialData.browserType || 'chromium');
      } else {
        // Reset for new workflow
        setName('');
        setDesc('');
        setTags('');
        setSuite('Default');
        setBrowserType('chromium');
      }
      setErrors([]);
      hasInitialized.current = true;
    } else if (!isOpen) {
      // Reset flag when dialog closes
      hasInitialized.current = false;
    }
  }, [isOpen, initialData]);

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!name.trim()) {
      newErrors.push(t('testBuilder.testNameRequired'));
    } else if (name.length > 100) {
      newErrors.push(t('testBuilder.testNameTooLong'));
    }

    if (desc.length > 500) {
      newErrors.push(t('testBuilder.descriptionTooLong'));
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const tagsArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const saveData = {
      name: name.trim(),
      description: desc.trim(),
      tags: tagsArray,
      suite: suite.trim(),
      browserType
    };
    onSave(saveData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  if (!isVisible) return null;

  const isEditMode = isUpdating || mode === 'edit';
  const modalTitle = title || (isEditMode ? t('testBuilder.updateWorkflow') : t('testBuilder.saveWorkflow'));
  const modalDescription = description || (isEditMode ? t('testBuilder.updateWorkflowDesc') : t('testBuilder.saveWorkflowDesc'));
  const submitButtonText = isEditMode ? t('common.update') : t('common.save');
  const IconComponent = isEditMode ? Edit : Save;
  const primaryColor = isEditMode ? '#7c3aed' : '#2563eb';
  const primaryColorHover = isEditMode ? '#6d28d9' : '#1d4ed8';

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        ...getOverlayStyle()
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '1rem',
          padding: '1.25rem',
          width: '95%',
          maxWidth: '650px',
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          ...getModalStyle()
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              backgroundColor: `${primaryColor}10`,
              border: `1px solid ${primaryColor}30`,
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconComponent size={18} color={primaryColor} />
            </div>
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0
              }}>
                {modalTitle}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: '0.25rem 0 0 0'
              }}>
                {modalDescription}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div style={{
            backgroundColor: 'var(--status-error-bg)',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: errors.length > 1 ? '0.5rem' : 0
            }}>
              <AlertCircle size={16} color="#dc2626" />
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#dc2626'
              }}>
                Lütfen aşağıdaki hataları düzeltin:
              </span>
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '1.5rem',
              fontSize: '0.875rem',
              color: '#dc2626'
            }}>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {/* Test Name - Full Width */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                Test Adı *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('testBuilder.workflowNamePlaceholder')}
                required
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = primaryColor;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Description - Full Width */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                Açıklama
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={t('testBuilder.workflowDescriptionPlaceholder')}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = primaryColor;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

             {/* Two Column Layout for Suite and Browser */}
             <div style={{ 
               display: 'grid', 
               gridTemplateColumns: '1fr 1fr',
               gap: '0.875rem'
             }}>
               {/* Suite */}
               <div>
                 <label style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '0.5rem',
                   fontSize: '0.875rem',
                   fontWeight: 500,
                   color: 'var(--text-primary)',
                   marginBottom: '0.5rem'
                 }}>
                   <FolderOpen size={14} />
                   Test Paketi
                 </label>
                 <AutocompleteInput
                   value={suite}
                   onChange={setSuite}
                   options={existingSuites}
                   placeholder={t('testBuilder.suitePlaceholder')}
                   multiple={false}
                   onFocus={(e) => {
                     e.currentTarget.style.borderColor = primaryColor;
                     e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                   }}
                   onBlur={(e) => {
                     e.currentTarget.style.borderColor = 'var(--border-primary)';
                     e.currentTarget.style.boxShadow = 'none';
                   }}
                 />
               </div>

               {/* Browser Type */}
               <div>
                 <label style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '0.5rem',
                   fontSize: '0.875rem',
                   fontWeight: 500,
                   color: 'var(--text-primary)',
                   marginBottom: '0.5rem'
                 }}>
                   <Globe size={14} />
                   Tarayıcı
                 </label>
                 <AutocompleteInput
                   value={browserType === 'chromium' ? 'Chrome' : 
                          browserType === 'firefox' ? 'Firefox' : 
                          browserType === 'webkit' ? 'Safari' : 
                          browserType === 'msedge' ? 'Edge' : 'Chrome'}
                   onChange={(value) => {
                     const browserMap: { [key: string]: BrowserType } = {
                       'Chrome': 'chromium',
                       'Firefox': 'firefox', 
                       'Safari': 'webkit',
                       'Edge': 'msedge'
                     };
                     setBrowserType(browserMap[value] || 'chromium');
                   }}
                   options={['Chrome', 'Firefox', 'Safari', 'Edge']}
                   placeholder="Chrome"
                   multiple={false}
                   onFocus={(e) => {
                     e.currentTarget.style.borderColor = primaryColor;
                     e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                   }}
                   onBlur={(e) => {
                     e.currentTarget.style.borderColor = 'var(--border-primary)';
                     e.currentTarget.style.boxShadow = 'none';
                   }}
                 />
               </div>
             </div>

            {/* Tags - Full Width */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                <Tag size={14} />
                Etiketler
              </label>
              <AutocompleteInput
                value={tags}
                onChange={setTags}
                options={existingTags}
                placeholder={t('testBuilder.tagsPlaceholder')}
                multiple={true}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = primaryColor;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                margin: '0.25rem 0 0 0'
              }}>
                Mevcut etiketlerden seçebilir ya da yeni etiket yazabilirsiniz
              </p>
            </div>
          </div>

          {/* Actions */}
          <ButtonGroup 
            align="end"
            spacing="md"
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-primary)'
            }}
          >
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              İptal
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={IconComponent}
              disabled={!name.trim()}
              type="submit"
            >
              {submitButtonText}
            </Button>
          </ButtonGroup>
        </form>
      </div>
    </div>
  );
};

export default TestModal;
