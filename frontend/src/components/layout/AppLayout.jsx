import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

const DRAWER_WIDTH = 260

const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      <Header drawerWidth={DRAWER_WIDTH} onMenuClick={handleDrawerToggle} />
      <Sidebar drawerWidth={DRAWER_WIDTH} mobileOpen={mobileOpen} onClose={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2.5, md: 3 },
          pt: { xs: 'calc(60px + env(safe-area-inset-top, 0px))', sm: 'calc(70px + env(safe-area-inset-top, 0px))' },
          pb: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          pl: { xs: 'calc(12px + env(safe-area-inset-left, 0px))', sm: 2.5, md: 3 },
          pr: { xs: 'calc(12px + env(safe-area-inset-right, 0px))', sm: 2.5, md: 3 },
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          maxWidth: '100%',
          overflowX: 'hidden',
          backgroundColor: (theme) => theme.palette.background.default,
          minHeight: '100vh',
          boxSizing: 'border-box'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default AppLayout
