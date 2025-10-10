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
  // Spinner özellikleri
  spinnerSize?: 'sm' | 'md' | 'lg';
  showSpinner?: boolean;
}

export default function LoadingErrorState({
  loading,
  error,
  loadingMessage = 'Yükleniyor...',
  errorTitle = 'Veriler yüklenirken hata oluştu',
  onRetry,
  children,
  spinnerSize = 'lg',
  showSpinner = true
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
        {showSpinner ? <CosmicSpinner size={spinnerSize} message={loadingMessage} /> : (
          <div style={{ 
            fontSize: '1rem', 
            color: 'var(--text-secondary)',
            fontWeight: 500
          }}>
            {loadingMessage}
          </div>
        )}
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

// CosmicSpinner component'ini buraya entegre ediyoruz
interface CosmicSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function CosmicSpinner({ size = 'md', message }: CosmicSpinnerProps) {
  const sizeMap = {
    sm: { spinner: 24, orbit: 32, dot: 3 },
    md: { spinner: 40, orbit: 56, dot: 4 },
    lg: { spinner: 60, orbit: 80, dot: 6 }
  };

  const dimensions = sizeMap[size];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      gap: '1rem'
    }}>
      <div 
        style={{ 
          position: 'relative',
          width: dimensions.orbit,
          height: dimensions.orbit,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Outer rotating ring */}
        <div 
          className="cosmic-spinner-ring"
          style={{
            position: 'absolute',
            width: dimensions.orbit,
            height: dimensions.orbit,
            border: '2px solid transparent',
            borderTopColor: 'var(--status-primary)',
            borderRightColor: 'var(--status-warning)',
            borderRadius: '50%',
            animation: 'spin-cosmic 1.5s linear infinite'
          }}
        />

        {/* Middle rotating ring */}
        <div 
          className="cosmic-spinner-ring-middle"
          style={{
            position: 'absolute',
            width: dimensions.orbit * 0.75,
            height: dimensions.orbit * 0.75,
            border: '2px solid transparent',
            borderBottomColor: 'var(--status-purple)',
            borderLeftColor: 'var(--status-info)',
            borderRadius: '50%',
            animation: 'spin-cosmic-reverse 2s linear infinite'
          }}
        />

        {/* Inner pulsing core */}
        <div 
          style={{
            width: dimensions.spinner,
            height: dimensions.spinner,
            background: 'radial-gradient(circle, var(--status-warning) 0%, var(--status-primary) 100%)',
            borderRadius: '50%',
            animation: 'pulse-cosmic 1.5s ease-in-out infinite',
            boxShadow: '0 0 20px rgba(232, 149, 88, 0.5)'
          }}
        />

        {/* Orbiting particles */}
        <div 
          className="cosmic-particle-orbit"
          style={{
            position: 'absolute',
            width: dimensions.dot,
            height: dimensions.dot,
            background: 'var(--status-warning)',
            borderRadius: '50%',
            top: 0,
            left: '50%',
            marginLeft: -dimensions.dot / 2,
            animation: 'orbit-cosmic 1.5s linear infinite',
            boxShadow: '0 0 8px var(--status-warning)'
          }}
        />

        <div 
          className="cosmic-particle-orbit-2"
          style={{
            position: 'absolute',
            width: dimensions.dot,
            height: dimensions.dot,
            background: 'var(--status-purple)',
            borderRadius: '50%',
            bottom: 0,
            left: '50%',
            marginLeft: -dimensions.dot / 2,
            animation: 'orbit-cosmic 1.5s linear infinite 0.75s',
            boxShadow: '0 0 8px var(--status-purple)'
          }}
        />
      </div>

      {message && (
        <div style={{ 
          fontSize: size === 'sm' ? '0.875rem' : '1rem', 
          color: 'var(--text-secondary)',
          fontWeight: 500,
          textAlign: 'center',
          animation: 'fade-pulse 2s ease-in-out infinite'
        }}>
          {message}
        </div>
      )}

      <style jsx>{`
        @keyframes spin-cosmic {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-cosmic-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes pulse-cosmic {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes orbit-cosmic {
          from {
            transform: rotate(0deg) translateX(${dimensions.orbit / 2}px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(${dimensions.orbit / 2}px) rotate(-360deg);
          }
        }

        @keyframes fade-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
