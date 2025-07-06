'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle, Tag, FolderOpen } from 'lucide-react';

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string;
    tags: string[];
    suite: string;
  }) => void;
  initialData?: {
    name?: string;
    description?: string;
    tags?: string[];
    suite?: string;
  };
  isUpdating?: boolean;
}

const SaveDialog: React.FC<SaveDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isUpdating = false
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [suite, setSuite] = useState('Default');
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize form with initial data
  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setDescription(initialData?.description || '');
      setTags(initialData?.tags?.join(', ') || '');
      setSuite(initialData?.suite || 'Default');
      setErrors([]);
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
      description: description.trim(),
      tags: tagsArray,
      suite: suite.trim()
    };
    onSave(saveData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  if (!isOpen) return null;

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
        zIndex: 1000
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
              backgroundColor: '#2563eb10',
              border: '1px solid #2563eb30',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Save size={18} color="#2563eb" />
            </div>
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0
              }}>
                {isUpdating ? 'Test Workflow\'unu Güncelle' : 'Test Workflow\'unu Kaydet'}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: '0.25rem 0 0 0'
              }}>
                {isUpdating ? 'Mevcut workflow\'u güncelleyin' : 'Workflow\'unuzu daha sonra kullanmak üzere kaydedin'}
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
            backgroundColor: '#fef2f2',
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
                placeholder="Test workflow'unuzun adını girin"
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
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 0 0 3px #2563eb20';
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
                placeholder="Test workflow'unuzun ne yaptığını açıklayın"
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
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 0 0 3px #2563eb20';
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
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="login, checkout, smoke-test (virgülle ayırın)"
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
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 0 0 3px #2563eb20';
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
                Etiketleri virgülle ayırarak yazın
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
              <input
                type="text"
                value={suite}
                onChange={(e) => setSuite(e.target.value)}
                placeholder="Test paketinin adı"
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
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 0 0 3px #2563eb20';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
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
              disabled={!name.trim()}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '0.5rem',
                backgroundColor: !name.trim() ? '#9ca3af' : '#2563eb',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: !name.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (name.trim()) {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }
              }}
              onMouseLeave={(e) => {
                if (name.trim()) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }
              }}
            >
              <Save size={14} />
              {isUpdating ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveDialog; 