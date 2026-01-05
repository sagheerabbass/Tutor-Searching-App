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
import { useState } from 'react'
import api from '../../hooks/api'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

const { width, height } = Dimensions.get('window')

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'student' | 'tutor'>('student')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState({ 
    username: false, 
    password: false, 
    email: false 
  })

  const handleRegister = async () => {
    console.log('=== REGISTRATION START ===')
    console.log('Data:', { username, password: '***', email, role })
    
    // Validate inputs
    if (!username.trim() || !password.trim() || !email.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields')
      return
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password should be at least 6 characters long')
      return
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address')
      return
    }

    try {
      setLoading(true)
      
      console.log('Sending registration request...')
      
      // Send registration request
      const response = await api.post('/api/register/', {
        username,
        password,
        email,
        role
      })

      console.log('✅ Registration successful:', response.data)
      console.log('User created:', response.data.user)
      
      // Show success message and navigate to login
      router.push({
      pathname: '/(auth)/login',
      params: { 
        username: username,
        registered: 'true',
        role:role,
      }
    })

    } catch (err: any) {
      console.log('❌ Registration error:', err)
      console.log('Error response:', err.response?.data)
      console.log('Error status:', err.response?.status)
      
      // Handle different error cases
      let errorMessage = 'Registration failed. Please try again.'
      
      if (err.response?.data) {
        // Django REST Framework error format
        if (err.response.data.username) {
          errorMessage = `Username: ${err.response.data.username[0]}`
        } else if (err.response.data.email) {
          errorMessage = `Email: ${err.response.data.email[0]}`
        } else if (err.response.data.password) {
          errorMessage = `Password: ${err.response.data.password[0]}`
        } else if (err.response.data.role) {
          errorMessage = `Role: ${err.response.data.role[0]}`
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors[0]
        } else {
          // Show full error for debugging
          errorMessage = JSON.stringify(err.response.data, null, 2)
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      Alert.alert('Registration Failed', errorMessage)
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
        colors={['#4f46e5', '#7c3aed']}
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
            {/* Header Section */}
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Ionicons name="person-add" size={40} color="#fff" />
                </View>
                <Text style={styles.welcome}>Create Account</Text>
                <Text style={styles.subtitle}>Join our learning community</Text>
              </View>
            </View>

            {/* Card Container */}
            <View style={styles.cardWrapper}>
              <View style={styles.card}>
                {/* Email Input */}
                <Text style={styles.label}>Email</Text>
                <View style={[
                  styles.inputContainer,
                  isFocused.email && styles.inputContainerFocused
                ]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={isFocused.email ? '#4f46e5' : '#999'} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="your@email.com"
                    placeholderTextColor="#999"
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setIsFocused({...isFocused, email: true})}
                    onBlur={() => setIsFocused({...isFocused, email: false})}
                    editable={!loading}
                    returnKeyType="next"
                  />
                </View>

                {/* Username Input */}
                <Text style={styles.label}>Username</Text>
                <View style={[
                  styles.inputContainer,
                  isFocused.username && styles.inputContainerFocused
                ]}>
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={isFocused.username ? '#4f46e5' : '#999'} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Choose a username"
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
                <Text style={styles.label}>Password</Text>
                <View style={[
                  styles.inputContainer,
                  isFocused.password && styles.inputContainerFocused
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={isFocused.password ? '#4f46e5' : '#999'} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="At least 6 characters"
                    placeholderTextColor="#999"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setIsFocused({...isFocused, password: true})}
                    onBlur={() => setIsFocused({...isFocused, password: false})}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
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

                {/* Role Selection */}
                <Text style={styles.label}>I want to join as a</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'student' && styles.roleButtonActive
                    ]}
                    onPress={() => setRole('student')}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name="school-outline" 
                      size={24} 
                      color={role === 'student' ? '#fff' : '#666'} 
                    />
                    <Text style={[
                      styles.roleText,
                      role === 'student' && styles.roleTextActive
                    ]}>Student</Text>
                    {role === 'student' && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'tutor' && styles.roleButtonActive
                    ]}
                    onPress={() => setRole('tutor')}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name="book-outline" 
                      size={24} 
                      color={role === 'tutor' ? '#fff' : '#666'} 
                    />
                    <Text style={[
                      styles.roleText,
                      role === 'tutor' && styles.roleTextActive
                    ]}>Tutor</Text>
                    {role === 'tutor' && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Register Button */}
                <TouchableOpacity 
                  style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                  onPress={handleRegister} 
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={role === 'student' ? ['#4f46e5', '#7c3aed'] : ['#059669', '#10b981']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.registerButtonText}>
                          Create {role === 'student' ? 'Student' : 'Tutor'} Account
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Terms */}
                <Text style={styles.termsText}>
                  By registering, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Already have an account?</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Login Link */}
                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={() => router.replace('/(auth)/login')}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginText}>
                    Sign in to your account
                  </Text>
                  <Ionicons name="log-in-outline" size={20} color="#4f46e5" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                © 2024 Learning Platform. All rights reserved.
              </Text>
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
  headerContainer: {
    marginTop: height * 0.05,
    marginBottom: 30,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoContainer: {
    alignItems: 'center',
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
    minHeight: 520,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
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
    borderColor: '#4f46e5',
    backgroundColor: '#fff',
    shadowColor: '#4f46e5',
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
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  roleButtonActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#4f46e5',
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  roleTextActive: {
    color: '#fff',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 24,
  },
  termsLink: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  loginText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
  },
})