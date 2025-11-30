import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'Gia - Your AI Fashion Stylist',
  description: 'Get personalized style advice, outfit analysis, and shopping recommendations powered by AI',
  manifest: '/manifest.json',
  themeColor: '#2C2C2C',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gia Fashion AI',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="pb-20">
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
