import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import api from '../hooks/api'
import { Ionicons } from '@expo/vector-icons'

export default function TutorDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Data
  const [bookings, setBookings] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [tutorInfo, setTutorInfo] = useState<any>(null)
  const [profileError, setProfileError] = useState(false)
  
  // Edit Profile Modal
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingProfile, setEditingProfile] = useState<any>({
    bio: '',
    fee: '',
    location: '',
    experience_years: '',
    is_online: true,
    subjects: []
  })
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([])
  const [newSubject, setNewSubject] = useState('')

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
      
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      // Load data after auth check
      loadData()
      
    } catch (error) {
      console.log('Auth error:', error)
      router.replace('/(auth)/login')
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setProfileError(false)
      
      console.log('=== LOADING TUTOR DATA ===')
      
      // Load tutor info
      try {
        console.log('Calling /api/tutor-profile/')
        const profileRes = await api.get('/api/tutor-profile/')
        console.log('Tutor Profile API Response:', profileRes.data)
        
        if (profileRes.data.error) {
          console.log('Profile error:', profileRes.data.error)
          setProfileError(true)
          setTutorInfo(null)
        } else {
          setTutorInfo(profileRes.data || {})
          // Initialize edit form with current data
          setEditingProfile({
            bio: profileRes.data?.bio || '',
            fee: profileRes.data?.fee?.toString() || '',
            location: profileRes.data?.location || '',
            experience_years: profileRes.data?.experience_years?.toString() || '',
            is_online: profileRes.data?.is_online ?? true,
            subjects: profileRes.data?.subjects || []
          })
        }
      } catch (profileError: any) {
        console.log('Error loading tutor profile:', profileError)
        console.log('Error response:', profileError.response?.data)
        console.log('Error status:', profileError.response?.status)
        setProfileError(true)
        setTutorInfo(null)
      }
      
      // Load bookings
      try {
        console.log('Calling /api/tutor-bookings/')
        const bookingsRes = await api.get('/api/tutor-bookings/')
        console.log('Bookings API Response:', bookingsRes.data)
        setBookings(bookingsRes.data || [])
      } catch (bookingError) {
        console.log('Error loading bookings:', bookingError)
        setBookings([])
      }
      
      // Load students
      try {
        console.log('Calling /api/my-students/')
        const studentsRes = await api.get('/api/my-students/')
        console.log('Students API Response:', studentsRes.data)
        setStudents(studentsRes.data || [])
      } catch (studentError) {
        console.log('Error loading students:', studentError)
        setStudents([])
      }
      
      // Load available subjects
      try {
        const subjectsRes = await api.get('/api/subjects/')
        setAvailableSubjects(subjectsRes.data || [])
      } catch (error) {
        console.log('Error loading subjects:', error)
      }
      
    } catch (error) {
      console.log('Load data error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleBookingAction = async (bookingId: number, action: 'accept' | 'reject' | 'complete') => {
    try {
      let endpoint = ''
      let message = ''
      
      switch (action) {
        case 'accept':
          endpoint = `/api/bookings/${bookingId}/accept/`
          message = 'Booking accepted!'
          break
        case 'reject':
          endpoint = `/api/bookings/${bookingId}/reject/`
          message = 'Booking rejected!'
          break
        case 'complete':
          endpoint = `/api/bookings/${bookingId}/complete/`
          message = 'Session marked as completed!'
          break
      }
      
      await api.put(endpoint, {})
      Alert.alert('Success', message)
      loadData()
      
    } catch (error) {
      Alert.alert('Error', 'Failed to update booking')
    }
  }

  const handleEditProfile = () => {
    setEditModalVisible(true)
  }

  const handleSaveProfile = async () => {
    try {
      // Validate inputs
      if (!editingProfile.fee || parseFloat(editingProfile.fee) <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid fee amount')
        return
      }

      if (!editingProfile.experience_years || parseInt(editingProfile.experience_years) < 0) {
        Alert.alert('Validation Error', 'Please enter valid experience years')
        return
      }

      // Prepare data for API
      const profileData = {
        bio: editingProfile.bio,
        fee: parseFloat(editingProfile.fee),
        location: editingProfile.location,
        experience_years: parseInt(editingProfile.experience_years),
        is_online: editingProfile.is_online,
        subject_ids: editingProfile.subjects.map((s: any) => s.id)
      }

      console.log('Saving profile data:', profileData)

      // Check if we need to create or update
      if (profileError || !tutorInfo) {
        // Create new profile
        const response = await api.post('/api/tutor-profile/create/', profileData)
        Alert.alert('Success', 'Profile created successfully!')
      } else {
        // Update existing profile
        const response = await api.put('/api/tutor-profile/update/', profileData)
        Alert.alert('Success', 'Profile updated successfully!')
      }

      setEditModalVisible(false)
      loadData() // Refresh data
      
    } catch (error: any) {
      console.log('Save profile error:', error)
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save profile')
    }
  }

  const toggleSubject = (subject: any) => {
    const isSelected = editingProfile.subjects.some((s: any) => s.id === subject.id)
    
    if (isSelected) {
      // Remove subject
      setEditingProfile({
        ...editingProfile,
        subjects: editingProfile.subjects.filter((s: any) => s.id !== subject.id)
      })
    } else {
      // Add subject
      setEditingProfile({
        ...editingProfile,
        subjects: [...editingProfile.subjects, subject]
      })
    }
  }

  const addNewSubject = async () => {
    if (!newSubject.trim()) {
      Alert.alert('Error', 'Please enter a subject name')
      return
    }

    try {
      const response = await api.post('/api/subjects/', { name: newSubject.trim() })
      setAvailableSubjects([...availableSubjects, response.data])
      setNewSubject('')
      Alert.alert('Success', 'Subject added successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to add subject')
    }
  }

  const logout = async () => {
    await AsyncStorage.clear()
    router.replace('/(auth)/login')
  }

  const renderBookingItem = ({ item }: { item: any }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return '#fbbf24'
        case 'accepted': return '#3b82f6'
        case 'completed': return '#10b981'
        case 'rejected': return '#ef4444'
        case 'cancelled': return '#94a3b8'
        default: return '#64748b'
      }
    }

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View>
            <Text style={styles.studentName}>{item.student_name || 'Student'}</Text>
            <Text style={styles.subjectText}>{item.subject_name || 'Subject'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status || 'pending'}</Text>
          </View>
        </View>
        
        <Text style={styles.dateText}>
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Date not available'}
        </Text>
        
        {item.message && (
          <Text style={styles.messageText}>{item.message}</Text>
        )}
        
        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#10b981' }]}
              onPress={() => handleBookingAction(item.id, 'accept')}
            >
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
              onPress={() => handleBookingAction(item.id, 'reject')}
            >
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {item.status === 'accepted' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
            onPress={() => handleBookingAction(item.id, 'complete')}
          >
            <Text style={styles.actionButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const renderStudentItem = ({ item }: { item: any }) => (
    <View style={styles.studentCard}>
      <Text style={styles.studentName}>{item.username || 'Student'}</Text>
      <Text style={styles.studentEmail}>{item.email || 'No email'}</Text>
      <View style={styles.studentStats}>
        <Text style={styles.statText}>Sessions: {item.total_sessions || 0}</Text>
        <Text style={styles.statText}>Rating: {item.avg_rating || 'N/A'}</Text>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading Tutor Dashboard...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tutor Dashboard</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
            <Ionicons name="create-outline" size={22} color="#4f46e5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tutor Info Card */}
      <View style={styles.tutorCard}>
        <View style={styles.tutorHeader}>
          <View>
            <Text style={styles.tutorName}>{user?.username || 'Tutor'}</Text>
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="create-outline" size={16} color="#4f46e5" />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.ratingText}>
              {tutorInfo?.average_rating?.toFixed(1) || '0.0'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.tutorBio}>
          {tutorInfo?.bio || 'No bio available. Click edit to add one.'}
        </Text>
        
        <View style={styles.tutorDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={18} color="#10b981" />
            <Text style={styles.detailText}>
              ₹{tutorInfo?.fee || 0}/hour
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={18} color="#3b82f6" />
            <Text style={styles.detailText}>
              {tutorInfo?.location || 'Location not set'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="book-outline" size={18} color="#8b5cf6" />
            <Text style={styles.detailText}>
              {tutorInfo?.subjects?.map((s: any) => s.name).join(', ') || 'No subjects set'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={18} color="#f59e0b" />
            <Text style={styles.detailText}>
              {tutorInfo?.experience_years || 0} years experience
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <View style={[
              styles.onlineIndicator,
              { backgroundColor: tutorInfo?.is_online ? '#10b981' : '#ef4444' }
            ]} />
            <Text style={styles.detailText}>
              {tutorInfo?.is_online ? 'Online - Available for bookings' : 'Offline - Not available'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Bookings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Requests ({bookings.length})</Text>
          {bookings.length === 0 ? (
            <Text style={styles.emptyText}>No booking requests yet</Text>
          ) : (
            <FlatList
              data={bookings}
              renderItem={renderBookingItem}
              keyExtractor={item => item.id?.toString() || Math.random().toString()}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Students Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Students ({students.length})</Text>
          {students.length === 0 ? (
            <Text style={styles.emptyText}>No students yet</Text>
          ) : (
            <FlatList
              data={students}
              renderItem={renderStudentItem}
              keyExtractor={item => item.id?.toString() || Math.random().toString()}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Tutor Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Bio</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Tell students about yourself, your qualifications, teaching style..."
              value={editingProfile.bio}
              onChangeText={(text) => setEditingProfile({...editingProfile, bio: text})}
              multiline
              numberOfLines={4}
            />

            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.modalLabel}>Fee per hour (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="500"
                  value={editingProfile.fee}
                  onChangeText={(text) => setEditingProfile({...editingProfile, fee: text})}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.modalLabel}>Experience (years)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="2"
                  value={editingProfile.experience_years}
                  onChangeText={(text) => setEditingProfile({...editingProfile, experience_years: text})}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.modalLabel}>Location</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="City, Country"
              value={editingProfile.location}
              onChangeText={(text) => setEditingProfile({...editingProfile, location: text})}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Set as Available (Online)</Text>
              <Switch
                value={editingProfile.is_online}
                onValueChange={(value) => setEditingProfile({...editingProfile, is_online: value})}
                trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
              />
            </View>

            <Text style={styles.modalLabel}>Subjects You Teach</Text>
            <View style={styles.subjectsContainer}>
              {availableSubjects.map((subject) => {
                const isSelected = editingProfile.subjects.some((s: any) => s.id === subject.id)
                return (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      styles.subjectChip,
                      isSelected && styles.subjectChipSelected
                    ]}
                    onPress={() => toggleSubject(subject)}
                  >
                    <Text style={[
                      styles.subjectChipText,
                      isSelected && styles.subjectChipTextSelected
                    ]}>
                      {subject.name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#fff" style={styles.subjectCheck} />
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>

            <View style={styles.addSubjectContainer}>
              <TextInput
                style={styles.addSubjectInput}
                placeholder="Add new subject..."
                value={newSubject}
                onChangeText={setNewSubject}
              />
              <TouchableOpacity 
                style={styles.addSubjectButton}
                onPress={addNewSubject}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  editButton: {
    padding: 4,
  },
  tutorCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tutorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tutorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  editProfileText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingText: {
    marginLeft: 4,
    color: '#92400e',
    fontWeight: '600',
  },
  tutorBio: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  tutorDetails: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#475569',
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 16,
  },
  bookingCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  subjectText: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#475569',
    fontStyle: 'italic',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  studentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  studentEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  studentStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 14,
    color: '#475569',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroup: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  switchLabel: {
    fontSize: 16,
    color: '#1e293b',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subjectChipSelected: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  subjectChipText: {
    fontSize: 14,
    color: '#475569',
  },
  subjectChipTextSelected: {
    color: '#fff',
  },
  subjectCheck: {
    marginLeft: 4,
  },
  addSubjectContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  addSubjectInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addSubjectButton: {
    backgroundColor: '#4f46e5',
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4f46e5',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
})