'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import CosmicSpinner from './CosmicSpinner';

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
        <CosmicSpinner size="lg" message={loadingMessage} />
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
        <AlertCircle size={48} style={{ color: 'var(--status-error)' }} />
        <div>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 600, 
            color: 'var(--status-error)',
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
                backgroundColor: 'var(--border-primary)',
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
