import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider, Box } from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import BusinessIcon from '@mui/icons-material/Business'
import StraightenIcon from '@mui/icons-material/Straighten'
import ReceiptIcon from '@mui/icons-material/Receipt'
import FolderIcon from '@mui/icons-material/Folder'
import AssessmentIcon from '@mui/icons-material/Assessment'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Projects Master', icon: <BusinessIcon />, path: '/projects' },
  { text: 'Measurement Books', icon: <StraightenIcon />, path: '/measurement' },
  { text: 'Quantity Variation', icon: <CompareArrowsIcon />, path: '/variation' },
  { text: 'RA Bills', icon: <ReceiptIcon />, path: '/ra-bills' },
  { text: 'Document Center', icon: <FolderIcon />, path: '/documents' },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' }
]

const Sidebar = ({ drawerWidth, mobileOpen, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar
        sx={{
          justifyContent: 'center',
          bgcolor: 'primary.dark',
          py: 2,
          pt: 'calc(16px + env(safe-area-inset-top, 0px))',
          minHeight: { xs: 64, sm: 70 }
        }}
      >
        <Box textAlign="center">
          <Typography variant="h6" color="white" fontWeight="bold" sx={{ letterSpacing: '-0.01em' }}>
            PCMC BillPro
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.75)" sx={{ fontSize: '0.7rem', display: 'block' }}>
            Civil Billing & Engineering System
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, py: 1.5, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  navigate(item.path)
                  if (mobileOpen) onClose()
                }}
                sx={{
                  borderRadius: '10px',
                  minHeight: 48,
                  py: 1,
                  px: 1.5,
                  transition: 'all 0.15s ease',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    boxShadow: '0 4px 10px rgba(29, 78, 216, 0.3)',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': { bgcolor: 'primary.dark' }
                  },
                  '&:hover': {
                    bgcolor: 'rgba(29, 78, 216, 0.08)'
                  }
                }}
              >
                <ListItemIcon sx={{ color: isSelected ? 'white' : 'primary.main', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isSelected ? 700 : 500
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Box sx={{ p: 2, pb: 'calc(16px + env(safe-area-inset-bottom, 0px))', textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          PCMC Civil Works v1.0
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid rgba(226, 232, 240, 0.8)'
          }
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid rgba(226, 232, 240, 0.8)'
          }
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  )
}

export default Sidebar
