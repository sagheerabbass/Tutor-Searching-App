// app/(tabs)/index.tsx - COMPLETELY REWRITE:
import { View, ActivityIndicator } from 'react-native'
import { useEffect } from 'react'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function Index() {
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token')
      const userData = await AsyncStorage.getItem('user')
      
      if (!token || !userData) {
        router.replace('/(auth)/login')
        return
      }
      
      const user = JSON.parse(userData)
      
      // Navigate based on role
      if (user.role === 'student') {
        router.replace('/student-dashboard')
      } else if (user.role === 'tutor') {
        router.replace('/tutor-dashboard')
      } else {
        router.replace('/(auth)/login')
      }
    } catch {
      router.replace('/(auth)/login')
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  )
}