import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1d4ed8',
      light: '#60a5fa',
      dark: '#1e3a8a',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#0284c7',
      light: '#38bdf8',
      dark: '#0369a1',
      contrastText: '#ffffff'
    },
    error: {
      main: '#e11d48',
      light: '#f43f5e',
      dark: '#be123c',
      contrastText: '#ffffff'
    },
    success: {
      main: '#059669',
      light: '#10b981',
      dark: '#047857',
      contrastText: '#ffffff'
    },
    warning: {
      main: '#d97706',
      light: '#f59e0b',
      dark: '#b45309',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f1f5f9',
      paper: '#ffffff'
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em', color: '#0f172a' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em', color: '#1e293b' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600, letterSpacing: '0.01em' }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f1f5f9',
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: '#e2e8f0',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)',
            borderRadius: '4px',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(180deg, #64748b 0%, #475569 100%)'
          }
        },
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: '#94a3b8 #e2e8f0'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '10px',
          fontWeight: 600,
          padding: '8px 18px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        },
        containedPrimary: {
          background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
          boxShadow: '0 4px 10px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 2px 0 #1e40af',
          '&:hover': {
            background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
            boxShadow: '0 6px 14px rgba(37, 99, 235, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 2px 0 #1e3a8a',
            transform: 'translateY(-1px)'
          },
          '&:active': {
            transform: 'translateY(2px)',
            boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.2)'
          }
        },
        containedError: {
          background: 'linear-gradient(180deg, #f43f5e 0%, #e11d48 100%)',
          boxShadow: '0 4px 10px rgba(225, 29, 72, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 2px 0 #be123c',
          '&:hover': {
            background: 'linear-gradient(180deg, #e11d48 0%, #be123c 100%)',
            transform: 'translateY(-1px)'
          },
          '&:active': {
            transform: 'translateY(2px)',
            boxShadow: '0 1px 2px rgba(225, 29, 72, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.2)'
          }
        },
        outlined: {
          backgroundColor: '#ffffff',
          borderColor: '#cbd5e1',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)',
          '&:hover': {
            backgroundColor: '#f8fafc',
            borderColor: '#94a3b8',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.06)'
          },
          '&:active': {
            transform: 'translateY(1px)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.07), 0 8px 10px -6px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          transition: 'box-shadow 0.25s ease, transform 0.25s ease'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        },
        rounded: {
          borderRadius: '14px'
        },
        elevation1: {
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
        },
        elevation3: {
          boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.1), 0 4px 8px -2px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
        }
      }
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #e2e8f0',
            fontWeight: 700,
            color: '#1e293b'
          },
          '& .MuiDataGrid-row': {
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: '#f1f5f9'
            },
            '&:nth-of-type(even)': {
              backgroundColor: '#fafafa'
            }
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #f1f5f9'
          }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }
      }
    }
  }
})

export default theme
