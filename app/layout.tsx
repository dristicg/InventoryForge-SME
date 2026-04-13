'use client';

import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import SidebarNav from '@/components/common/SidebarNav';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-zinc-950 text-zinc-100">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <SidebarNav />

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-zinc-950">
              {children}
            </main>
          </div>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}