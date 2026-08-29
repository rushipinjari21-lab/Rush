import React, { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/auth.service'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        if (parsedUser && typeof parsedUser === 'object') {
          setUser(parsedUser)
        } else {
          throw new Error('Stored user is invalid')
        }
      } catch {
        // A failed earlier login may have stored the literal text "undefined".
        // Clear it rather than letting it crash the whole application.
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }

    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const response = await authService.login(username, password)

    const { accessToken, user: userData } = response.data.data

    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(userData))

    setUser(userData)

    return userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  const hasRole = (roles) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        hasRole,
        loading,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export default AuthContext
