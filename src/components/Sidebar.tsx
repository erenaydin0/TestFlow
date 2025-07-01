'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TestTube, 
  Clock, 
  BarChart3, 
  Settings, 
  HelpCircle,
  Workflow
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Test Builder', href: '/test-builder', icon: Workflow },
  { name: 'Testler', href: '/tests', icon: TestTube },
  { name: 'Zamanlanmış', href: '/scheduled', icon: Clock },
  { name: 'Raporlar', href: '/reports', icon: BarChart3 },
];

const bottomNavigation = [
  { name: 'Ayarlar', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{ 
      position: 'fixed',
      top: '4rem', // Header height
      left: 0,
      width: '16rem',
      height: 'calc(100vh - 4rem)', // Full height minus header
      backgroundColor: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-primary)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      zIndex: 100
    }}>
      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1.5rem 1rem', overflow: 'auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            fontSize: '0.75rem', 
            fontWeight: 600, 
            color: 'var(--text-tertiary)', 
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Ana Menü
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.name} style={{ marginBottom: '0.25rem' }}>
                  <Link 
                    href={item.href} 
                    className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Icon size={18} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div style={{ 
        padding: '1rem', 
        borderTop: '1px solid var(--border-primary)',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {bottomNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.name} style={{ marginBottom: '0.25rem' }}>
                <Link 
                  href={item.href} 
                  className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Icon size={18} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
} 