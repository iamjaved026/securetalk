
'use client'

import React from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 min-h-0">{children}</div>
}
