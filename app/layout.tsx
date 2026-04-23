import type { Metadata } from 'next'
import { AuthProvider } from '@/hooks/useAuth'
import { CreateFlowProvider } from '@/components/providers/CreateFlowProvider'
import { MessagesInboxProvider } from '@/components/providers/MessagesInboxProvider'
import { LocaleProvider } from '@/components/providers/LocaleProvider'
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
          <LocaleProvider>
            <CreateFlowProvider>
              <MessagesInboxProvider>{children}</MessagesInboxProvider>
            </CreateFlowProvider>
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
