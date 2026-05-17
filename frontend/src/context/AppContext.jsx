import { createContext, useContext, useEffect, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem('alphalens-theme') || 'dark'
  })

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('alphalens-sidebar-collapsed') === 'true'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('alphalens-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('alphalens-sidebar-collapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const toggleSidebar = () => setSidebarCollapsed((c) => !c)

  return (
    <AppContext.Provider
      value={{ theme, toggleTheme, sidebarCollapsed, toggleSidebar }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
