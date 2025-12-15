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
import WorkspaceSelector from './WorkspaceSelector';
import '../../assets/styles/Sidebar.css';

// Sidebar Skeleton Component
function SidebarSkeleton({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <nav className="sidebar-nav">
        {!isCollapsed && (
          <div className="skeleton" style={{ height: '2.5rem', marginBottom: '1rem' }} />
        )}
        <div>
          <ul className="sidebar-list">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="sidebar-list-item">
                <div
                  className="sidebar-item skeleton"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '4px',
                    background: 'var(--bg-secondary)'
                  }} />
                  {!isCollapsed && (
                    <div className="skeleton-text" style={{
                      height: '0.875rem',
                      width: '70%',
                      marginLeft: '0.75rem'
                    }} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className="sidebar-footer">
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '6px' }} />
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '6px' }} />
      </div>
    </aside>
  );
}

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
  const { t, isLoaded } = useI18n();

  // Çeviriler yüklenene kadar skeleton göster
  if (!isLoaded) {
    return <SidebarSkeleton isCollapsed={isCollapsed} />;
  }

  const navigation = getNavigation(t);

  return (
    <aside
      className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${isModalOpen ? 'sidebar-modal-open' : ''}`}
    >
      {/* Navigation */}
      <nav className="sidebar-nav">
        {!isCollapsed && <WorkspaceSelector />}
        <div>
          <ul className="sidebar-list">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.name} className="sidebar-list-item">
                  <Link
                    href={item.href}
                    className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                    title={item.name}
                    onClick={(e) => {
                      if (onNavigationAttempt) {
                        e.preventDefault();
                        onNavigationAttempt(item.href);
                      }
                    }}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="sidebar-item-text">
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Alt Kısım - Ayarlar ve Collapse Toggle */}
      <div className="sidebar-footer">
        {/* Ayarlar Butonu - Sol */}
        <IconButton
          icon={Settings}
          onClick={() => openSettingsModal('account')}
          variant="ghost"
          size="md"
          tooltip="Ayarlar"
          style={{ color: 'var(--text-secondary)' }}
        />

        {/* Collapse Toggle - Sağ */}
        <div className="sidebar-toggle-expanded">
          <IconButton
            icon={ChevronLeft}
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="md"
            tooltip={t('sidebar.collapse')}
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>

        {/* Collapsed durumda genişlet butonu */}
        <div className="sidebar-toggle-collapsed">
          <IconButton
            icon={ChevronRight}
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="md"
            tooltip={t('sidebar.expand')}
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>
      </div>
    </aside>
  );
}