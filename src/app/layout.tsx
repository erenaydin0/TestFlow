import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { 
  ThemeProvider, 
  NotificationProvider, 
  SidebarProvider, 
  BrowserProvider, 
  SettingsModalProvider,
  I18nProvider
} from '@/contexts';
import { ToastContainer } from '@/components/features/notifications';
import { SettingsModal } from '@/components/modals';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CosmicQA',
  description: 'Modern ve kullanıcı dostu Playwright test otomasyonu uygulaması',
  icons: {
    icon: '/icon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <I18nProvider>
          <ThemeProvider>
            <BrowserProvider>
              <NotificationProvider>
                <SidebarProvider>
                  <SettingsModalProvider>
                    {children}
                    <ToastContainer />
                    <SettingsModal />
                  </SettingsModalProvider>
                </SidebarProvider>
              </NotificationProvider>
            </BrowserProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
} 