'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface LoadingErrorStateProps {
  loading: boolean;
  error: string | null;
  loadingMessage?: string;
  errorTitle?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export default function LoadingErrorState({
  loading,
  error,
  loadingMessage = 'Yükleniyor...',
  errorTitle = 'Veriler yüklenirken hata oluştu',
  onRetry,
  children
}: LoadingErrorStateProps) {
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '200px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ 
            width: '2rem', 
            height: '2rem', 
            border: '2px solid var(--border-primary)',
            borderTop: '2px solid var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <div style={{ 
            fontSize: '1.125rem', 
            color: 'var(--text-secondary)' 
          }}>
            {loadingMessage}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ 
        padding: '2rem', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <AlertCircle size={48} color="#dc2626" />
        <div>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 600, 
            color: '#dc2626',
            margin: '0 0 0.5rem 0'
          }}>
            {errorTitle}
          </h3>
          <p style={{ 
            color: 'var(--text-secondary)',
            margin: '0 0 1rem 0'
          }}>
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                margin: '0 auto'
              }}
            >
              <RefreshCw size={16} />
              Tekrar Dene
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
