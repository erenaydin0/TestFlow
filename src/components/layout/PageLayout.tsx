'use client';

import React from 'react';
import { Sidebar, Header } from './';
import { useSidebar } from '@/hooks';

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
      
      <div style={{ 
        flex: 1, 
        marginLeft: isCollapsed ? '4.5rem' : '15rem',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        paddingTop: '4rem',
        position: 'relative',
        zIndex: 1
      }}>
        <Header />
        
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

      <style jsx>{`
        .cosmic-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .cosmic-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: radial-gradient(circle, var(--status-warning) 0%, transparent 70%);
          border-radius: 50%;
          animation: float-particle 20s ease-in-out infinite;
          opacity: 0.6;
        }

        @keyframes float-particle {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translate(30px, -50px) scale(1.2);
            opacity: 0.6;
          }
          50% {
            transform: translate(-20px, -100px) scale(0.8);
            opacity: 0.4;
          }
          75% {
            transform: translate(40px, -70px) scale(1.1);
            opacity: 0.5;
          }
        }

        .nebula-cloud {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: drift 40s ease-in-out infinite;
        }

        .nebula-cloud-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, var(--status-primary) 0%, transparent 70%);
          top: -200px;
          left: -100px;
          animation-delay: 0s;
        }

        .nebula-cloud-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, var(--status-purple) 0%, transparent 70%);
          bottom: -150px;
          right: -100px;
          animation-delay: 10s;
          animation-duration: 50s;
        }

        .nebula-cloud-3 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, var(--status-warning) 0%, transparent 70%);
          top: 50%;
          right: 20%;
          animation-delay: 20s;
          animation-duration: 45s;
        }

        @keyframes drift {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(50px, 30px) scale(1.1);
          }
          66% {
            transform: translate(-30px, 50px) scale(0.9);
          }
        }

        /* Dark mode enhancements */
        :global(.dark) .cosmic-particle {
          opacity: 0.8;
        }

        :global(.dark) .nebula-cloud {
          opacity: 0.25;
        }
      `}</style>
    </div>
  );
}
