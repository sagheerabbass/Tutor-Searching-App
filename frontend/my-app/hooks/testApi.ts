// hooks/testApi.ts
import api from './api'

export const testLogin = async (username: string, password: string) => {
  try {
    console.log('Testing API connection...')
    const response = await api.post('/api/login/', {
      username,
      password,
    })
    
    console.log('✅ API Response:', {
      status: response.status,
      data: response.data,
      keys: Object.keys(response.data),
      hasAccess: !!response.data.access,
      hasRefresh: !!response.data.refresh,
      hasUser: !!response.data.user,
      userKeys: response.data.user ? Object.keys(response.data.user) : 'No user object'
    })
    
    return response.data
  } catch (error: any) {
    console.log('❌ API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    throw error
  }
}