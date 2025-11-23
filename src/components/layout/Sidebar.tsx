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
import { useSidebar, useSettingsModal, useI18n } from '@/hooks';
import { IconButton } from '@/components/common';

interface SidebarProps {
  onNavigationAttempt?: (href: string) => void;
}

const getNavigation = (t: (key: string) => string) => [
  { name: t('navigation.dashboard'), href: '/', icon: LayoutDashboard },
  { name: t('navigation.testBuilder'), href: '/test-builder', icon: Workflow },
  { name: t('navigation.tests'), href: '/tests', icon: TestTube },
  { name: t('navigation.scheduled'), href: '/scheduled', icon: AlarmClock },
  { name: t('navigation.reports'), href: '/reports', icon: FileText },
];

export default function Sidebar({ onNavigationAttempt }: SidebarProps = {}) {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, isModalOpen } = useSidebar();
  const { openSettingsModal } = useSettingsModal();
  const { t } = useI18n();
  
  const navigation = getNavigation(t);

  return (
    <aside style={{ 
      position: 'fixed',
      top: '4rem',
      left: 0,
      width: isCollapsed ? '4.5rem' : '15rem',
      height: 'calc(100vh - 4rem)',
      backgroundColor: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-primary)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
      zIndex: 100,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
      pointerEvents: isModalOpen ? 'none' : 'auto',
      opacity: isModalOpen ? 0.5 : 1
    }}>
      {/* Navigation */}
      <nav style={{ flex: 1, padding: isCollapsed ? '1rem 0.5rem' : '1rem 0.75rem', overflow: 'auto' }}>
        <div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.name} style={{ marginBottom: '0.375rem' }}>
                  <Link 
                    href={item.href} 
                    className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                    style={{ 
                      textDecoration: 'none',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      padding: isCollapsed ? '0.875rem' : '0.875rem 1rem',
                      borderRadius: '0.5rem',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    title={isCollapsed ? item.name : undefined}
                    onClick={(e) => {
                      if (onNavigationAttempt) {
                        e.preventDefault();
                        onNavigationAttempt(item.href);
                      }
                    }}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {!isCollapsed && (
                      <span style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: isActive ? 600 : 500,
                        letterSpacing: '-0.01em'
                      }}>
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
        <IconButton
          icon={Settings}
          onClick={openSettingsModal}
          variant="ghost"
          size="md"
          tooltip="Ayarlar"
          style={{ color: 'var(--text-secondary)' }}
        />

        {/* Collapse Toggle - Sağ */}
        {!isCollapsed && (
          <IconButton
            icon={ChevronLeft}
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="md"
            tooltip={t('sidebar.collapse')}
            style={{ color: 'var(--text-secondary)' }}
          />
        )}

        {/* Collapsed durumda genişlet butonu */}
        {isCollapsed && (
          <IconButton
            icon={ChevronRight}
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="md"
            tooltip={t('sidebar.expand')}
            style={{ color: 'var(--text-secondary)' }}
          />
        )}
      </div>
    </aside>
  );
} 