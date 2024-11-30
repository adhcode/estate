import './globals.css'
import { Quicksand } from 'next/font/google'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ClientProvider from '@/app/providers/ClientProvider';

const quicksand = Quicksand({ subsets: ['latin'], variable: '--font-quicksand' })

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
      <body className={`bg-[#FBFBFB] ${quicksand.variable} min-h-screen flex flex-col text-red-500`}>
        <ClientProvider session={session}>
          {children}
        </ClientProvider>
      </body>
    </html>
  )
}
