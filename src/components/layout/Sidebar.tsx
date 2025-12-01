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
import '../../assets/styles/Sidebar.css';

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
    <aside
      className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${isModalOpen ? 'sidebar-modal-open' : ''}`}
    >
      {/* Navigation */}
      <nav className="sidebar-nav">
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
          onClick={openSettingsModal}
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