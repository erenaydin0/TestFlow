'use client';

import React from 'react';
import { Sidebar, Header } from './';
import { useSidebar, useI18n } from '@/hooks';

// Page Content Skeleton
function PageContentSkeleton({ title, isCollapsed }: { title?: string; isCollapsed: boolean }) {
  return (
    <div style={{ 
      flex: 1,
      marginLeft: isCollapsed ? '4.5rem' : '15rem',
      transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      paddingTop: '4rem',
      position: 'relative',
      zIndex: 1
    }}>
      <main style={{ padding: '1.5rem' }}>
        {title && (
          <div style={{ marginBottom: '2rem' }}>
            <div className="skeleton" style={{ height: '2rem', width: '200px' }} />
          </div>
        )}
        
        {/* Content skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton-card" style={{ height: '120px' }} />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="skeleton-card" style={{ flex: 1, height: '200px', animationDelay: '0.1s' }} />
            <div className="skeleton-card" style={{ flex: 1, height: '200px', animationDelay: '0.2s' }} />
          </div>
        </div>
      </main>
    </div>
  );
}

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  headerActions?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function PageLayout({
  children,
  title,
  headerActions,
  className = '',
  style = {}
}: PageLayoutProps) {
  const { isCollapsed } = useSidebar();
  const { isLoaded } = useI18n();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden', ...style }}>
      {/* Cosmic Background Animations */}
      <div className="cosmic-background">
        {/* Floating particles */}
        <div className="cosmic-particle" style={{ left: '10%', top: '20%', animationDelay: '0s' }} />
        <div className="cosmic-particle" style={{ left: '80%', top: '40%', animationDelay: '2s' }} />
        <div className="cosmic-particle" style={{ left: '30%', top: '60%', animationDelay: '4s' }} />
        <div className="cosmic-particle" style={{ left: '70%', top: '80%', animationDelay: '6s' }} />
        <div className="cosmic-particle" style={{ left: '50%', top: '30%', animationDelay: '3s' }} />
        <div className="cosmic-particle" style={{ left: '20%', top: '70%', animationDelay: '5s' }} />

        {/* Nebula clouds */}
        <div className="nebula-cloud nebula-cloud-1" />
        <div className="nebula-cloud nebula-cloud-2" />
        <div className="nebula-cloud nebula-cloud-3" />
      </div>

      <Sidebar />

      {/* Çeviriler yüklenene kadar content skeleton göster */}
      {!isLoaded ? (
        <PageContentSkeleton title={title} isCollapsed={isCollapsed} />
      ) : (
        <div style={{
          flex: 1,
          marginLeft: isCollapsed ? '4.5rem' : '15rem',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          paddingTop: '4rem',
          position: 'relative',
          zIndex: 1
        }}>
          <React.Suspense fallback={null}>
            <Header />
          </React.Suspense>

          <main style={{ padding: '1.5rem' }} className={className}>
            {(title || headerActions) && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                {title && (
                  <div>
                    <h1 style={{
                      fontSize: '1.875rem',
                      fontWeight: 'bold',
                      color: 'var(--text-primary)',
                      margin: 0
                    }}>
                      {title}
                    </h1>
                  </div>
                )}

                {headerActions && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {headerActions}
                  </div>
                )}
              </div>
            )}

            {children}
          </main>
        </div>
      )}
    </div>
  );
}
