'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useSidebar } from '@/contexts';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function PageLayout({ 
  children, 
  title, 
  subtitle, 
  headerActions,
  className = '',
  style = {}
}: PageLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', ...style }}>
      <Sidebar />
      
      <div style={{ 
        flex: 1, 
        marginLeft: isCollapsed ? '4rem' : '16rem',
        transition: 'margin-left 0.3s ease',
        paddingTop: '4rem'
      }}>
        <Header />
        
        <main style={{ padding: '1.5rem' }} className={className}>
          {(title || subtitle || headerActions) && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '2rem' 
            }}>
              {(title || subtitle) && (
                <div>
                  {title && (
                    <h1 style={{ 
                      fontSize: '1.875rem', 
                      fontWeight: 'bold', 
                      color: 'var(--text-primary)', 
                      margin: 0 
                    }}>
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p style={{ 
                      color: 'var(--text-secondary)', 
                      margin: '0.5rem 0 0 0' 
                    }}>
                      {subtitle}
                    </p>
                  )}
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
    </div>
  );
}
