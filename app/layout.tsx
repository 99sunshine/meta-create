import type { Metadata } from 'next'
import { AuthProvider } from '@/hooks/useAuth'
import './globals.css'
import '@/components/features/swipe/swipe-demo.css'

export const metadata: Metadata = {
  title: 'MetaCreate - Find Your Co-Creator',
  description: 'AI-powered creator matching platform for students and young professionals',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
