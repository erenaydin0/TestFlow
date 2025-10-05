'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { BrowserType } from '@/types';
import MultiSelect from './MultiSelect';
import { BrowserSelector } from '@/components/features/test-builder';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onUpdate(testId, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative',
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.25rem' 
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          list={`suites-${testId}`}
          style={{
            padding: '0.25rem 0.5rem',
            border: '1px solid var(--accent-primary)',
            borderRadius: '0.25rem',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            outline: 'none',
            width: '100%',
            minWidth: '120px'
          }}
        />
        <datalist id={`suites-${testId}`}>
          {availableSuites.map((suite) => (
            <option key={suite} value={suite} />
          ))}
        </datalist>
      </div>
    );
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      style={{
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        transition: 'background-color 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {value || '-'}
    </span>
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
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = (newTags: string[]) => {
    onUpdate(testId, newTags);
  };

  if (isEditing) {
    return (
      <div 
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        onMouseLeave={() => setIsEditing(false)}
        style={{ 
          position: 'relative',
          minWidth: '200px',
          zIndex: 100
        }}
      >
        <MultiSelect
          options={availableTags}
          selectedValues={tags}
          onChange={handleChange}
          placeholder="Etiket seçin"
        />
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.25rem',
        cursor: 'pointer',
        padding: '0.25rem',
        borderRadius: '0.25rem',
        transition: 'background-color 0.2s ease',
        minHeight: '1.5rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {tags.length === 0 ? (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
          Etiket ekle
        </span>
      ) : (
        tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.125rem 0.5rem',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)'
            }}
          >
            {tag}
          </span>
        ))
      )}
      {tags.length > 2 && (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            padding: '0.125rem 0.5rem'
          }}
        >
          +{tags.length - 2}
        </span>
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
      />
    </div>
  );
};
