import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from '../components/SideBar/SideBar'
import Header from '../components/Header/Header'

function MainLayout() {
const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  return (
    <div className="app">
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="main">
        <Header />

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout