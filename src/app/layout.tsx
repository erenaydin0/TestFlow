import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';
import { NotificationProvider } from '@/lib/notification-context';
import { SidebarProvider } from '@/lib/sidebar-context';
import { ToastContainer } from '@/components/notifications/ToastContainer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CosmicQA',
  description: 'Modern ve kullanıcı dostu Playwright test otomasyonu uygulaması',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <ThemeProvider>
          <NotificationProvider>
            <SidebarProvider>
              {children}
              <ToastContainer />
            </SidebarProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 