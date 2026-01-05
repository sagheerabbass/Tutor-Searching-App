// hooks/AuthContext.tsx
import { createContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from './api'
import { router } from 'expo-router'

interface User {
  id: number
  username: string
  email: string
  role: 'student' | 'tutor'
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in when app starts
  useEffect(() => {
    checkExistingUser()
  }, [])

const checkExistingUser = async () => {
  try {
    const userData = await AsyncStorage.getItem('user')
    const token = await AsyncStorage.getItem('access_token')
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      // FIXED NAVIGATION
      if (parsedUser.role === 'student') {
        router.replace('/student-dashboard')  // FIXED
      } else if (parsedUser.role === 'tutor') {
        router.replace('/tutor-dashboard')    // FIXED
      }
    }
  } catch (error) {
    console.log('Error checking user:', error)
  } finally {
    setIsLoading(false)
  }
}

const login = async (username: string, password: string) => {
  try {
    console.log('=== LOGIN START ===')
    console.log('Calling login API for:', username)
    
    const res = await api.post('/api/login/', {
      username,
      password,
    })

    console.log('Login response received:', res.status)
    
    // Check response structure
    let access, refresh, userData
    
    if (res.data.access && res.data.refresh && res.data.user) {
      access = res.data.access
      refresh = res.data.refresh
      userData = res.data.user
    } else if (res.data.access && res.data.refresh) {
      access = res.data.access
      refresh = res.data.refresh
      userData = {
        id: 0,
        username: username,
        email: '',
        role: 'student'
      }
    } else {
      throw new Error('Invalid response format')
    }

    // Store tokens
    await AsyncStorage.setItem('access_token', access)
    await AsyncStorage.setItem('refresh_token', refresh)
    await AsyncStorage.setItem('user', JSON.stringify(userData))

    // Update state
    setUser(userData)

    // FIXED NAVIGATION - Use absolute paths
    console.log('User role:', userData?.role)
    
    if (userData?.role === 'student') {
      console.log('Navigating to student dashboard...')
      router.replace('/student-dashboard')  // FIXED: Remove ../
    } else if (userData?.role === 'tutor') {
      console.log('Navigating to tutor dashboard...')
      router.replace('/tutor-dashboard')    // FIXED: Remove ../
    } else {
      console.log('Defaulting to student')
      router.replace('/student-dashboard')  // FIXED
    }
    
  } catch (error: any) {
    console.log('Login error:', error.response?.data)
    throw error
  }
}

  const logout = async () => {
    try {
      console.log('Logging out...')
      
      // Clear all stored data
      await AsyncStorage.removeItem('access_token')
      await AsyncStorage.removeItem('refresh_token')
      await AsyncStorage.removeItem('user')
      
      // Update state
      setUser(null)
      
      console.log('Data cleared, navigating to login...')
      
      // Navigate to login screen
      router.replace('/(auth)/login')
    } catch (error) {
      console.log('Logout error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}