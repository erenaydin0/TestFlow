'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Edit, X, AlertCircle, Tag, FolderOpen } from 'lucide-react';
import AutocompleteInput from '@/components/ui/AutocompleteInput';
import { getExistingTags, getExistingSuites, updateWorkflow } from '@/lib/utils';
import { Test } from '@/types';

interface EditTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTest: Test) => void;
  test: Test | null;
}

const EditTestModal: React.FC<EditTestModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  test
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [suite, setSuite] = useState('Default');
  const [errors, setErrors] = useState<string[]>([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [existingSuites, setExistingSuites] = useState<string[]>([]);
  const hasInitialized = useRef(false);

  // Load existing tags and suites when modal opens
  useEffect(() => {
    if (isOpen) {
      setExistingTags(getExistingTags());
      setExistingSuites(getExistingSuites());
    }
  }, [isOpen]);

  // Initialize form with test data when modal opens
  useEffect(() => {
    if (isOpen && test && !hasInitialized.current) {
      setName(test.name || '');
      setDescription(test.description || '');
      setTags(test.tags?.join(', ') || '');
      setSuite(test.suite || 'Default');
      setErrors([]);
      hasInitialized.current = true;
    } else if (!isOpen) {
      // Reset flag when modal closes
      hasInitialized.current = false;
    }
  }, [isOpen, test]);

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
      newErrors.push('Test adı gereklidir');
    } else if (name.length > 100) {
      newErrors.push('Test adı 100 karakterden uzun olamaz');
    }

    if (description.length > 500) {
      newErrors.push('Açıklama 500 karakterden uzun olamaz');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleUpdate = () => {
    if (!validateForm() || !test) {
      return;
    }

    const tagsArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const updatedTest: Test = {
      ...test,
      name: name.trim(),
      description: description.trim(),
      tags: tagsArray,
      suite: suite.trim(),
      updatedAt: new Date()
    };

    // Update in storage
    const success = updateWorkflow(test.id, {
      name: updatedTest.name,
      description: updatedTest.description,
      tags: updatedTest.tags,
      suite: updatedTest.suite,
      updatedAt: updatedTest.updatedAt
    });

    if (success) {
      onUpdate(updatedTest);
      onClose();
    } else {
      setErrors(['Test güncellenirken bir hata oluştu']);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdate();
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
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
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
              backgroundColor: '#7c3aed10',
              border: '1px solid #7c3aed30',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Edit size={18} color="#7c3aed" />
            </div>
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Test Bilgilerini Düzenle
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: '0.25rem 0 0 0'
              }}>
                Test adı, açıklama, etiketler ve grubu güncelleyin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <AlertCircle size={16} color="#dc2626" />
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#dc2626',
                margin: 0
              }}>
                Lütfen aşağıdaki hataları düzeltin:
              </h4>
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '1rem',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Test Name */}
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
                placeholder="Test adını girin"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#7c3aed';
                  e.currentTarget.style.boxShadow = '0 0 0 3px #7c3aed20';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Description */}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Test açıklamasını girin"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
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
                  e.currentTarget.style.borderColor = '#7c3aed';
                  e.currentTarget.style.boxShadow = '0 0 0 3px #7c3aed20';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Tags */}
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
                placeholder="login, checkout, smoke-test (virgülle ayırın)"
                multiple={true}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#7c3aed';
                  e.currentTarget.style.boxShadow = '0 0 0 3px #7c3aed20';
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
                placeholder="Test paketinin adı"
                multiple={false}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#7c3aed';
                  e.currentTarget.style.boxShadow = '0 0 0 3px #7c3aed20';
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
                Mevcut paketlerden seçebilir ya da yeni paket adı yazabilirsiniz
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-primary)'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              }}
            >
              İptal
            </button>
            
            <button
              type="submit"
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '0.5rem',
                backgroundColor: '#7c3aed',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6d28d9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#7c3aed';
              }}
            >
              <Edit size={16} />
              Güncelle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTestModal;
