import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { 
  ThemeProvider, 
  NotificationProvider, 
  SidebarProvider, 
  BrowserProvider, 
  SettingsModalProvider 
} from '@/contexts';
import { ToastContainer } from '@/components/features/notifications';
import { SettingsModalWrapper } from '@/components/modals';

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
          <BrowserProvider>
            <NotificationProvider>
              <SidebarProvider>
                <SettingsModalProvider>
                  {children}
                  <ToastContainer />
                  <SettingsModalWrapper />
                </SettingsModalProvider>
              </SidebarProvider>
            </NotificationProvider>
          </BrowserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 