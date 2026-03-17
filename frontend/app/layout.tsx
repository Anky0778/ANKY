import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      className={inter.className}
      style={{ overflow: 'hidden', height: '100%', width: '100%' }}
    >
      <body style={{
        overflow: 'hidden',
        height: '100%',
        width: '100%',
        maxWidth: '100vw',
        margin: 0,
        padding: 0,
        background: '#0f172a',
      }}>
        {children}
      </body>
    </html>
  )
}