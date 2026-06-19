import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import SecurityGuardWrapper from '@/components/SecurityGuardWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pengumuman Kelulusan Kelas XII 2026',
  description: 'Sistem Pengumuman Kelulusan Kelas XII Tahun Ajaran 2025/2026',
  keywords: ['kelulusan', 'pengumuman', 'kelas XII', '2026', 'SMA'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Pengumuman Kelulusan Kelas XII 2026',
    description: 'Sistem Pengumuman Kelulusan Kelas XII Tahun Ajaran 2025/2026',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2563EB" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className} style={{ userSelect: 'none' }}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SecurityGuardWrapper />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
