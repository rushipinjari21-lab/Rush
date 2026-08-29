import React from 'react'
import { AppBar, Toolbar, Typography, IconButton, Box, Avatar, Menu, MenuItem } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { useAuth } from '../../context/AuthContext.jsx'
import ConnectionStatusBadge from '../common/ConnectionStatusBadge.jsx'

const Header = ({ drawerWidth, onMenuClick }) => {
  const { user, logout } = useAuth()
  const [anchorEl, setAnchorEl] = React.useState(null)
  const handleMenu = (event) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        pt: 'env(safe-area-inset-top, 0px)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)'
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 3 } }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          aria-label="open navigation menu"
          sx={{ mr: 1.5, display: { sm: 'none' }, minWidth: 44, minHeight: 44 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            fontSize: { xs: '1.05rem', sm: '1.25rem' },
            letterSpacing: '-0.01em'
          }}
        >
          PCMC BillPro
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ConnectionStatusBadge />
          <Typography variant="body2" sx={{ mx: 1, display: { xs: 'none', md: 'inline' }, fontWeight: 500 }}>
            {user?.full_name} ({user?.role})
          </Typography>
          <IconButton onClick={handleMenu} color="inherit" sx={{ p: 0.5, minWidth: 40, minHeight: 40 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.main', fontWeight: 'bold', fontSize: '0.9rem' }}>
              {user?.full_name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1, display: { xs: 'block', md: 'none' } }}>
              <Typography variant="subtitle2" fontWeight="bold">{user?.full_name || 'User'}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email || user?.username}</Typography>
            </Box>
            <MenuItem onClick={() => { handleClose(); logout() }} sx={{ color: 'error.main', fontWeight: 600 }}>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
