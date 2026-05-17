import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useApp } from '../context/AppContext'

export default function Layout() {
  const { sidebarCollapsed, theme } = useApp()

  return (
    // set the data-theme attribute on the outermost element so all children inherit
    <div data-theme={theme} className="min-h-screen bg-terminal-bg">
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
