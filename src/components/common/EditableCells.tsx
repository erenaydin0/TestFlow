'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { BrowserType } from '@/types';
import MultiSelect from './MultiSelect';
import { BrowserSelector } from '@/components/features/test-builder';
import { useDropdown } from '@/hooks/ui';
import { getDropdownContainerStyle } from '@/lib/dropdownStyles';
import { useI18n } from '@/contexts';

interface EditableSuiteCellProps {
  value: string;
  testId: string;
  availableSuites: string[];
  onUpdate: (testId: string, suite: string) => void;
}

export const EditableSuiteCell: React.FC<EditableSuiteCellProps> = ({
  value,
  testId,
  availableSuites,
  onUpdate
}) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isOpen,
    isClosing,
    dropdownPosition,
    fixedPosition,
    containerRef,
    buttonRef,
    dropdownRef,
    handleClose,
    handleToggle,
    getAnimationStyle
  } = useDropdown({ 
    animationDuration: 150,
    onClose: () => setSearchTerm(''),
    useFixedPosition: true // Tablo içinde kullanım için
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredSuites = availableSuites.filter(suite =>
    suite.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (suite: string) => {
    onUpdate(testId, suite);
    handleClose();
  };

  return (
    <div 
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      style={{ 
        position: 'relative',
        width: '100%'
      }}
    >
      {/* Display Button */}
      <div
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        style={{
          fontSize: '0.875rem',
          color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
          cursor: 'pointer',
          padding: '0.375rem 0.5rem',
          borderRadius: '0.5rem',
          transition: 'all 0.2s ease',
          border: isOpen ? '1px solid var(--border-primary)' : '1px solid transparent',
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: isOpen ? 'var(--bg-tertiary)' : 'transparent'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            e.currentTarget.style.borderColor = 'var(--border-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }
        }}
      >
        {value || t('searchPlaceholders.selectGroup')}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          style={{
            ...getDropdownContainerStyle(dropdownPosition, { width: fixedPosition?.width || '100%' }, fixedPosition),
            ...getAnimationStyle()
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholders.searchOrAddNew')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm.trim()) {
                handleSelect(searchTerm.trim());
              } else if (e.key === 'Escape') {
                handleClose();
              }
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: 'none',
              borderBottom: '1px solid var(--border-primary)',
              borderRadius: '0.5rem 0.5rem 0 0',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
          <div style={{
            maxHeight: '150px',
            overflowY: 'auto'
          }}>
            {searchTerm && !filteredSuites.includes(searchTerm) && (
              <div
                onClick={() => handleSelect(searchTerm)}
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--accent-primary)',
                  borderBottom: '1px solid var(--border-primary)',
                  fontWeight: 500
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                + "{searchTerm}" ekle
              </div>
            )}
            {filteredSuites.length === 0 && !searchTerm ? (
              <div style={{
                padding: '0.75rem',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '0.875rem'
              }}>
                Test grubu bulunamadı
              </div>
            ) : (
              filteredSuites.map((suite) => (
                <div
                  key={suite}
                  onClick={() => handleSelect(suite)}
                  style={{
                    padding: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: suite === value ? 'white' : 'var(--text-primary)',
                    backgroundColor: suite === value ? 'var(--accent-primary)' : 'transparent',
                    borderBottom: '1px solid var(--border-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (suite !== value) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (suite !== value) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {suite}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface EditableTagsCellProps {
  tags: string[];
  testId: string;
  availableTags: string[];
  onUpdate: (testId: string, tags: string[]) => void;
}

export const EditableTagsCell: React.FC<EditableTagsCellProps> = ({
  tags,
  testId,
  availableTags,
  onUpdate
}) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isOpen,
    isClosing,
    dropdownPosition,
    fixedPosition,
    containerRef,
    buttonRef,
    dropdownRef,
    handleClose,
    handleToggle: toggleDropdown,
    getAnimationStyle
  } = useDropdown({ 
    animationDuration: 150,
    onClose: () => setSearchTerm(''),
    useFixedPosition: true // Tablo içinde kullanım için
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(searchTerm.toLowerCase()) && !tags.includes(tag)
  );

  const handleToggleTag = (tag: string) => {
    const newTags = tags.includes(tag)
      ? tags.filter(t => t !== tag)
      : [...tags, tag];
    onUpdate(testId, newTags);
  };

  const handleAddNew = () => {
    if (searchTerm.trim() && !tags.includes(searchTerm.trim())) {
      onUpdate(testId, [...tags, searchTerm.trim()]);
      setSearchTerm('');
    }
  };

  return (
    <div 
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      style={{ 
        position: 'relative',
        width: '100%'
      }}
    >
      {/* Display Button */}
      <div
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          toggleDropdown();
        }}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.25rem',
        cursor: 'pointer',
        padding: '0.375rem 0.5rem',
        borderRadius: '0.5rem',
        transition: 'all 0.2s ease',
        minHeight: '1.75rem',
        alignItems: 'center',
        border: isOpen ? '1px solid var(--border-primary)' : '1px solid transparent',
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: isOpen ? 'var(--bg-tertiary)' : 'transparent'
      }}
      onMouseEnter={(e) => {
        if (!isOpen) {
          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          e.currentTarget.style.borderColor = 'var(--border-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isOpen) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }
      }}
    >
      {tags.length === 0 ? (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
          Etiket ekle
        </span>
      ) : (
        <>
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.125rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
              }}
            >
              {'#' + tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                fontWeight: 500
              }}
            >
              +{tags.length - 3}
            </span>
          )}
        </>
      )}
    </div>

    {/* Dropdown */}
    {isOpen && (
      <div 
        ref={dropdownRef}
        style={{
          ...getDropdownContainerStyle(dropdownPosition, { width: fixedPosition?.width || '100%' }, fixedPosition),
          ...getAnimationStyle(200)
        }}
      >
        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('searchPlaceholders.searchOrAddNew')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddNew();
            } else if (e.key === 'Escape') {
              handleClose();
            }
          }}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: 'none',
            borderBottom: '1px solid var(--border-primary)',
            borderRadius: '0.5rem 0.5rem 0 0',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />

        {/* Selected Tags */}
        {tags.length > 0 && (
          <div style={{
            padding: '0.5rem',
            borderBottom: '1px solid var(--border-primary)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.25rem'
          }}>
            {tags.map((tag) => (
              <span
                key={tag}
                onClick={() => handleToggleTag(tag)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {'#' + tag}
                <X size={12} />
              </span>
            ))}
          </div>
        )}

        {/* Available Tags */}
        <div style={{
          maxHeight: '150px',
          overflowY: 'auto'
        }}>
          {searchTerm && !availableTags.includes(searchTerm) && !tags.includes(searchTerm) && (
            <div
              onClick={handleAddNew}
              style={{
                padding: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--accent-primary)',
                borderBottom: '1px solid var(--border-primary)',
                fontWeight: 500
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              + "{searchTerm}" ekle
            </div>
          )}
          {filteredTags.length === 0 && !searchTerm ? (
            <div style={{
              padding: '0.75rem',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: '0.875rem'
            }}>
              {tags.length === 0 ? 'Etiket bulunamadı' : 'Tüm etiketler seçildi'}
            </div>
          ) : (
            filteredTags.map((tag) => (
              <div
                key={tag}
                onClick={() => handleToggleTag(tag)}
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  borderBottom: '1px solid var(--border-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {'#' + tag}
                <Check size={14} style={{ color: 'var(--accent-primary)', opacity: 0.5 }} />
              </div>
            ))
          )}
        </div>
      </div>
    )}
  </div>
  );
};

interface EditableBrowserCellProps {
  browserType: BrowserType;
  testId: string;
  onUpdate: (testId: string, browserType: BrowserType) => void;
}

export const EditableBrowserCell: React.FC<EditableBrowserCellProps> = ({
  browserType,
  testId,
  onUpdate
}) => {
  const handleChange = (newBrowser: BrowserType) => {
    onUpdate(testId, newBrowser);
  };

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'inline-flex'
      }}
    >
      <BrowserSelector
        selectedBrowser={browserType}
        onBrowserChange={handleChange}
        disabled={false}
        size="sm"
        useFixedPosition={true}
      />
    </div>
  );
};
