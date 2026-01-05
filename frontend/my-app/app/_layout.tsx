// app/_layout.tsx
import { Stack } from 'expo-router'
import { AuthProvider } from '../hooks/AuthContext'

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="student-dashboard" />
        <Stack.Screen name="tutor-dashboard" />
        <Stack.Screen name="tutor/[id]" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  )
}