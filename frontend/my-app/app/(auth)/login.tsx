import { 
  View, 
  TextInput, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  ScrollView,
  Dimensions 
} from 'react-native'
import { useContext, useState } from 'react'
import { AuthContext } from '../../hooks/AuthContext'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

const { width, height } = Dimensions.get('window')

export default function Login() {
  const { login } = useContext(AuthContext)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState({ username: false, password: false })

  const handleLogin = async () => {
    // Add debug logs
    console.log('=== LOGIN ATTEMPT ===')
    console.log('Username:', username)
    console.log('AuthContext available:', !!login)
    console.log('AuthContext login function:', login)

    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please fill in both username and password')
      return
    }

    try {
      setLoading(true)
      console.log('Attempting login...')
      
      await login(username, password)
      
      // REMOVE THIS LINE - AuthContext already handles navigation
      // router.replace('/(tabs)') 
      
      console.log('Login function completed')
      
    } catch (err: any) {
      console.log('Login catch error:', err)
      console.log('Error response:', err.response?.data)
      console.log('Error status:', err.response?.status)
      
      let errorMessage = 'Invalid credentials. Please try again.'
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err.response?.data?.non_field_errors) {
        errorMessage = err.response.data.non_field_errors[0]
      }
      
      Alert.alert('Login Failed', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? -100 : 0}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Ionicons name="lock-closed" size={40} color="#fff" />
              </View>
              <Text style={styles.welcome}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            {/* Card Container - Properly Centered */}
            <View style={styles.cardWrapper}>
              <View style={styles.card}>
                {/* Username Input */}
                <View style={[
                  styles.inputContainer,
                  isFocused.username && styles.inputContainerFocused
                ]}>
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={isFocused.username ? '#667eea' : '#999'} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Username or Email"
                    placeholderTextColor="#999"
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    onChangeText={setUsername}
                    onFocus={() => setIsFocused({...isFocused, username: true})}
                    onBlur={() => setIsFocused({...isFocused, username: false})}
                    editable={!loading}
                    returnKeyType="next"
                  />
                </View>

                {/* Password Input */}
                <View style={[
                  styles.inputContainer,
                  isFocused.password && styles.inputContainerFocused
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={isFocused.password ? '#667eea' : '#999'} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#999"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setIsFocused({...isFocused, password: true})}
                    onBlur={() => setIsFocused({...isFocused, password: false})}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={22} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity 
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Register Link */}
                <TouchableOpacity 
                  style={styles.registerButton}
                  onPress={() => router.push('/(auth)/register')}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.registerText}>
                    Don't have an account? <Text style={styles.registerHighlight}>Create one</Text>
                  </Text>
                </TouchableOpacity>


              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>By continuing, you agree to our</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.footerLink}> Terms & Conditions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    minHeight: height,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: height * 0.05,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  welcome: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    minHeight: 430, // Increased to accommodate debug button
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputContainerFocused: {
    borderColor: '#667eea',
    backgroundColor: '#fff',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333',
    height: 54,
  },
  eyeIcon: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  registerButton: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  registerHighlight: {
    color: '#667eea',
    fontWeight: '700',
  },
  // Debug button styles
  debugButton: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  debugButtonDisabled: {
    opacity: 0.5,
  },
  debugButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
  footerLink: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})