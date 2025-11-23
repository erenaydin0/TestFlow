import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/assets/styles/globals.css';
import { ToastContainer } from '@/components/notifications';
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
        {children}
        <ToastContainer />
        <SettingsModal />
      </body>
    </html>
  );
} 