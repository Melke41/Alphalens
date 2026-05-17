import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useApp } from '../context/AppContext'

export default function Layout() {
  const { sidebarCollapsed, theme } = useApp()

  return (
    <div className={`${theme === 'light' ? 'light' : 'dark'} min-h-screen bg-terminal-bg`} data-theme-root>
      <Sidebar />
      <div
        className={`main-transition ${sidebarCollapsed ? 'pl-16' : 'pl-56'}`}
      >
        <Navbar />
        <main className="min-h-[calc(100vh-3.5rem)] p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
