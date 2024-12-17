import './globals.css'
import { Quicksand } from 'next/font/google'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ClientProvider from '@/app/providers/ClientProvider';
import { Metadata } from 'next';

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand'
})

export const metadata: Metadata = {
  title: 'LKJ Estate',
  description: 'Your comprehensive estate management platform',
  keywords: 'estate management, visitor registration, security',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${quicksand.variable} font-sans min-h-screen`}>
        <ClientProvider session={session}>
          {children}
        </ClientProvider>
      </body>
    </html>
  )
}
