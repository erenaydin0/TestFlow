'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TestTube,
  Workflow,
  AlarmClock,
  ChevronLeft,
  ChevronRight,
  Settings,
  FileText
} from 'lucide-react';
import { useSidebar } from '@/lib/sidebar-context';
import { useSettingsModal } from '@/lib/settings-modal-context';

interface SidebarProps {
  onNavigationAttempt?: (href: string) => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Oluşturucu', href: '/test-builder', icon: Workflow },
  { name: 'Testler', href: '/tests', icon: TestTube },
  { name: 'Zamanlanmış', href: '/scheduled', icon: AlarmClock },
  { name: 'Sonuçlar', href: '/reports', icon: FileText },
];

export default function Sidebar({ onNavigationAttempt }: SidebarProps = {}) {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { openModal } = useSettingsModal();

  return (
    <aside style={{ 
      position: 'fixed',
      top: '4rem', // Header height
      left: 0,
      width: isCollapsed ? '4rem' : '16rem',
      height: 'calc(100vh - 4rem)', // Full height minus header
      backgroundColor: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-primary)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      zIndex: 100,
      transition: 'width 0.3s ease'
    }}>
      {/* Navigation */}
      <nav style={{ flex: 1, padding: isCollapsed ? '1.5rem 0.5rem' : '1.5rem 1rem', overflow: 'auto' }}>
        <div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.name} style={{ marginBottom: '0.25rem' }}>
                  <Link 
                    href={item.href} 
                    className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                    style={{ 
                      textDecoration: 'none',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      padding: isCollapsed ? '0.75rem' : '0.75rem 1rem'
                    }}
                    title={isCollapsed ? item.name : undefined}
                    onClick={(e) => {
                      if (onNavigationAttempt) {
                        e.preventDefault();
                        onNavigationAttempt(item.href);
                      }
                    }}
                  >
                    <Icon size={18} />
                    {!isCollapsed && (
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {item.name}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Alt Kısım - Ayarlar ve Collapse Toggle */}
      <div style={{ 
        padding: isCollapsed ? '0.5rem' : '1rem', 
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: isCollapsed ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        gap: isCollapsed ? '0.5rem' : '1rem',
        borderTop: '1px solid var(--border-primary)'
      }}>
        {/* Ayarlar Butonu - Sol */}
        <button
          onClick={openModal}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease, background-color 0.2s ease',
            minWidth: '2.5rem',
            minHeight: '2.5rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Ayarlar"
        >
          <Settings size={20} />
        </button>

        {/* Collapse Toggle - Sağ */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s ease, background-color 0.2s ease',
              minWidth: '2.5rem',
              minHeight: '2.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            title="Sidebar'ı Daralt"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Collapsed durumda genişlet butonu */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s ease, background-color 0.2s ease',
              minWidth: '2.5rem',
              minHeight: '2.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            title="Sidebar'ı Genişlet"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </aside>
  );
} 