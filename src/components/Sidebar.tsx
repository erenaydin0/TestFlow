'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TestTube,
  Settings, 
  Workflow,
  Calendar
} from 'lucide-react';
import { BarChart } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Test Oluşturucu', href: '/test-builder', icon: Workflow },
  { name: 'Kayıtlı Testler', href: '/tests', icon: TestTube },
  { name: 'Zamanlanmış Testler', href: '/scheduled', icon: Calendar },
  { name: 'Test Sonuçları', href: '/reports', icon: BarChart },
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