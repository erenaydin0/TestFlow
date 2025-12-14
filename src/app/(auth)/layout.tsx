'use client';

import { useI18n } from '@/hooks';

// Auth Skeleton Component
function AuthSkeleton() {
    return (
        <div style={{
            width: '100%',
            maxWidth: '28rem',
            padding: '2rem',
            background: 'var(--bg-primary)',
            borderRadius: '1rem',
            border: '1px solid var(--border-primary)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}>
            {/* Logo skeleton */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <div className="skeleton-circle" style={{ width: '80px', height: '80px' }} />
            </div>
            
            {/* Title skeleton */}
            <div className="skeleton" style={{ height: '1.75rem', width: '60%', margin: '0 auto 0.5rem' }} />
            
            {/* Subtitle skeleton */}
            <div className="skeleton-text" style={{ height: '1rem', width: '80%', margin: '0 auto 2rem', animationDelay: '0.1s' }} />
            
            {/* Form fields skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2].map((i) => (
                    <div key={i}>
                        <div className="skeleton-text" style={{ height: '0.875rem', width: '30%', marginBottom: '0.5rem', animationDelay: `${i * 0.1}s` }} />
                        <div className="skeleton" style={{ height: '2.75rem', width: '100%', animationDelay: `${i * 0.15}s` }} />
                    </div>
                ))}
            </div>
            
            {/* Button skeleton */}
            <div className="skeleton" style={{ height: '2.75rem', width: '100%', marginTop: '1.5rem', animationDelay: '0.3s' }} />
        </div>
    );
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isLoaded } = useI18n();

    return (
        <div 
            className="flex min-h-screen items-center justify-center sm:px-6 lg:px-8"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
            <div className="w-full max-w-md space-y-8">
                {!isLoaded ? <AuthSkeleton /> : children}
            </div>
        </div>
    );
}
