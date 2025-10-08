'use client';

import React from 'react';

interface CosmicLogoProps {
  size?: number;
  animated?: boolean;
}

export default function CosmicLogo({ size = 32, animated = true }: CosmicLogoProps) {
  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 0 8px rgba(232, 149, 88, 0.3))'
        }}
      >
        {/* Outer ring - cosmic orbit */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="url(#gradient1)"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
          style={{
            animation: animated ? 'rotate 20s linear infinite' : 'none'
          }}
        />
        
        {/* Middle ring */}
        <circle
          cx="50"
          cy="50"
          r="35"
          stroke="url(#gradient2)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
          style={{
            animation: animated ? 'rotate-reverse 15s linear infinite' : 'none'
          }}
        />
        
        {/* Inner core - planet/star */}
        <circle
          cx="50"
          cy="50"
          r="20"
          fill="url(#gradientCore)"
          style={{
            animation: animated ? 'pulse 3s ease-in-out infinite' : 'none'
          }}
        />
        {/* Central Logo Image */}
        <image
          href="/icon.svg"
          width="100"
          height="100"
          className={animated ? 'cosmic-logo-pulse' : ''}
        />
        
        {/* Small orbiting dots - satellites */}
        <circle
          cx="50"
          cy="5"
          r="3"
          fill="var(--status-warning)"
          opacity="0.8"
          style={{
            animation: animated ? 'orbit 8s linear infinite' : 'none',
            transformOrigin: '50px 50px'
          }}
        />
        
        <circle
          cx="95"
          cy="50"
          r="2.5"
          fill="var(--status-purple)"
          opacity="0.7"
          style={{
            animation: animated ? 'orbit 12s linear infinite' : 'none',
            transformOrigin: '50px 50px'
          }}
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--status-primary)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="var(--status-warning)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--status-purple)" stopOpacity="0.8" />
          </linearGradient>
          
          <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--status-purple)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--status-primary)" stopOpacity="0.6" />
          </linearGradient>
          
          <radialGradient id="gradientCore">
            <stop offset="0%" stopColor="var(--status-warning)" />
            <stop offset="100%" stopColor="var(--status-primary)" />
          </radialGradient>
          
        </defs>
      </svg>

      <style jsx>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rotate-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(45px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(45px) rotate(-360deg);
          }
        }
      `}</style>
    </div>
  );
}
