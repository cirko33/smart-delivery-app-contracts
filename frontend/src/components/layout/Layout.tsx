import type { ReactNode } from 'react'
import { Navbar } from './Navbar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background polka-dot-bg relative">
      <Navbar />
      <main className="relative z-10">
        {children}
      </main>
    </div>
  )
}