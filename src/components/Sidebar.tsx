'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TestTube,
  Workflow,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { BarChart } from 'lucide-react';
import { useSidebar } from '@/lib/sidebar-context';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Test Oluşturucu', href: '/test-builder', icon: Workflow },
  { name: 'Kayıtlı Testler', href: '/tests', icon: TestTube },
  { name: 'Zamanlanmış Testler', href: '/scheduled', icon: Calendar },
  { name: 'Test Sonuçları', href: '/reports', icon: BarChart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();

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
        <div style={{ marginBottom: '2rem' }}>
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

      {/* Collapse Toggle */}
      <div style={{ 
        padding: isCollapsed ? '0.5rem' : '1rem', 
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        justifyContent: isCollapsed ? 'center' : 'flex-end'
      }}>
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
          title={isCollapsed ? 'Sidebar\'ı Genişlet' : 'Sidebar\'ı Daralt'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
} 