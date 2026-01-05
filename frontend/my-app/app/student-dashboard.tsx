import { View, Text, StyleSheet, Button, ScrollView,TextInput,TouchableOpacity, FlatList,Modal,Alert,RefreshControl,Switch,
  ActivityIndicator
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import api from '../hooks/api'
import { Ionicons } from '@expo/vector-icons'

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [minFee, setMinFee] = useState('')
  const [maxFee, setMaxFee] = useState('')
  const [ratingFilter, setRatingFilter] = useState(0)
  const [availabilityFilter, setAvailabilityFilter] = useState(false)
  
  // Data
  const [tutors, setTutors] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  
  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showTutorProfileModal, setShowTutorProfileModal] = useState(false) // New: Tutor profile modal
  const [selectedTutor, setSelectedTutor] = useState<any>(null)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [bookingMessage, setBookingMessage] = useState('') // New: Booking message input
  
  // Profile
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>([])
  const [preferredLocation, setPreferredLocation] = useState('')
  const [learningGoals, setLearningGoals] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token')
      const userData = await AsyncStorage.getItem('user')
      
      if (!token || !userData) {
        router.replace('/(auth)/login')
        return
      }
      
      setUser(JSON.parse(userData))
    } catch (error) {
      console.log('Auth error:', error)
      router.replace('/(auth)/login')
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load tutors
      const tutorsRes = await api.get('/tutors/')
      console.log('Tutors API Response:', tutorsRes.data)
      setTutors(tutorsRes.data || [])
      
      // Extract unique subjects
       const allSubjects: string[] = []
    tutorsRes.data?.forEach((tutor: any) => {
      tutor.subjects?.forEach((subject: any) => {
        if (subject.name && !allSubjects.includes(subject.name)) {
          allSubjects.push(subject.name)
        }
      })
    })
    setSubjects(allSubjects)
      
      // Load bookings
      const bookingsRes = await api.get('/api/my-bookings/')
      console.log('Bookings API Response:', bookingsRes.data)
      setBookings(bookingsRes.data || [])
      
      // Load favorites
      const favoritesRes = await api.get('/api/favorite-tutors/')
      console.log('Favorites API Response:', favoritesRes.data)
      setFavorites(favoritesRes.data || [])
      
      // Load profile preferences
      const profileRes = await api.get('/api/student-profile/')
      if (profileRes.data) {
        setPreferredSubjects(profileRes.data.preferred_subjects || [])
        setPreferredLocation(profileRes.data.preferred_location || '')
        setLearningGoals(profileRes.data.learning_goals || '')
        setNotificationsEnabled(profileRes.data.notifications_enabled !== false)
      }
      
    } catch (error: any) {
      console.log('Load data error:', error)
      console.log('Error response:', error.response?.data)
      Alert.alert('Error', 'Failed to load data. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleSearch = () => {
    // Filter tutors based on search and filters
    let filtered = tutors
    
    if (searchQuery) {
      filtered = filtered.filter(tutor => 
        tutor.user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.subjects?.some((s: any) => 
          s.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }
    
    if (selectedSubject) {
      filtered = filtered.filter(tutor =>
        tutor.subjects?.some((s: any) => s.name === selectedSubject)
      )
    }
    
    if (minFee) {
      filtered = filtered.filter(tutor => 
        parseFloat(tutor.fee || 0) >= parseFloat(minFee)
      )
    }
    
    if (maxFee) {
      filtered = filtered.filter(tutor => 
        parseFloat(tutor.fee || 0) <= parseFloat(maxFee)
      )
    }
    
    if (ratingFilter > 0) {
      filtered = filtered.filter(tutor => 
        (tutor.average_rating || 0) >= ratingFilter
      )
    }
    
    if (availabilityFilter) {
      filtered = filtered.filter(tutor => tutor.is_online)
    }
    
    return filtered
  }

  const handleViewTutorProfile = (tutor: any) => {
    setSelectedTutor(tutor)
    setShowTutorProfileModal(true)
  }

  const handleBookTutor = (tutor: any) => {
    setSelectedTutor(tutor)
    setBookingMessage('')
    setShowBookingModal(true)
  }

  const handleSubmitBooking = async () => {
    if (!bookingMessage.trim()) {
      Alert.alert('Error', 'Please enter a message for the tutor')
      return
    }

    try {
      // Find a subject to book (use first subject if available)
      const subjectId = selectedTutor.subjects?.[0]?.id
      if (!subjectId) {
        Alert.alert('Error', 'This tutor has no subjects available')
        return
      }

      await api.post('/api/bookings/', {
        tutor: selectedTutor.user_id || selectedTutor.id, // Try both possible fields
        subject: subjectId,
        message: bookingMessage,
      })
      
      Alert.alert('Success', 'Booking request sent successfully!')
      setShowBookingModal(false)
      loadData()
    } catch (error: any) {
      console.log('Booking error:', error)
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send booking request')
    }
  }

  const toggleFavorite = async (tutorId: number) => {
    try {
      await api.post(`/api/favorite-tutors/${tutorId}/`)
      loadData()
    } catch (error) {
      console.log('Toggle favorite error:', error)
    }
  }

  const handleRateTutor = (booking: any) => {
    setSelectedBooking(booking)
    setShowReviewModal(true)
  }

  const submitReview = async (rating: number, comment: string) => {
    try {
      await api.post('/api/reviews/', {
        tutor: selectedBooking.tutor,
        rating,
        comment,
      })
      
      Alert.alert('Success', 'Review submitted!')
      setShowReviewModal(false)
      loadData()
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review')
    }
  }

  const saveProfile = async () => {
    try {
      await api.put('/api/student-profile/', {
        preferred_subjects: preferredSubjects,
        preferred_location: preferredLocation,
        learning_goals: learningGoals,
        notifications_enabled: notificationsEnabled,
      })
      
      Alert.alert('Success', 'Profile updated!')
      setShowProfileModal(false)
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile')
    }
  }

  const logout = async () => {
    await AsyncStorage.clear()
    router.replace('/(auth)/login')
  }

  const renderTutorCard = ({ item }: { item: any }) => (
    <View style={styles.tutorCard}>
      <View style={styles.tutorHeader}>
        <View>
          <Text style={styles.tutorName}>{item.user || 'Tutor'}</Text>
          <Text style={styles.tutorSubjects}>
            {item.subjects?.map((s: any) => s.name).join(', ') || 'No subjects listed'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
          <Ionicons 
            name={favorites.some(f => f.id === item.id) ? "heart" : "heart-outline"} 
            size={24} 
            color="#ef4444" 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tutorDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="star" size={16} color="#fbbf24" />
          <Text style={styles.ratingText}>{item.average_rating?.toFixed(1) || 'No ratings'}</Text>
          
          <Ionicons name="cash-outline" size={16} color="#10b981" style={styles.iconSpacing} />
          <Text style={styles.feeText}>₹{item.fee || 0}/hr</Text>
          
          <Ionicons name="location-outline" size={16} color="#3b82f6" style={styles.iconSpacing} />
          <Text style={styles.locationText}>{item.location || 'Location not set'}</Text>
        </View>
        
        <View style={styles.availabilityRow}>
          <View style={[
            styles.availabilityBadge,
            { backgroundColor: item.is_online ? '#10b981' : '#ef4444' }
          ]}>
            <Text style={styles.availabilityText}>
              {item.is_online ? 'Available Now' : 'Offline'}
            </Text>
          </View>
          <Text style={styles.experienceText}>
            {item.experience_years || 0} years experience
          </Text>
        </View>
        
        <Text style={styles.bioText} numberOfLines={2}>
          {item.bio || 'No bio available'}
        </Text>
      </View>
      
      <View style={styles.tutorActions}>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => handleViewTutorProfile(item)}
        >
          <Text style={styles.viewButtonText}>View Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.bookButton, !item.is_online && styles.bookButtonDisabled]}
          onPress={() => handleBookTutor(item)}
          disabled={!item.is_online}
        >
          <Text style={styles.bookButtonText}>
            {item.is_online ? 'Book Now' : 'Not Available'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderBookingCard = ({ item }: { item: any }) => (
    <View style={[
      styles.bookingCard,
      { borderLeftColor: 
        item.status === 'completed' ? '#10b981' :
        item.status === 'cancelled' || item.status === 'rejected' ? '#ef4444' :
        '#fbbf24'
      }
    ]}>
      <View style={styles.bookingHeader}>
        <Text style={styles.tutorName}>{item.tutor_name || 'Tutor'}</Text>
        <Text style={[
          styles.statusBadge,
          { backgroundColor: 
            item.status === 'completed' ? '#10b981' :
            item.status === 'cancelled' || item.status === 'rejected' ? '#ef4444' :
            '#fbbf24'
          }
        ]}>
          {item.status?.toUpperCase() || 'PENDING'}
        </Text>
      </View>
      
      <Text style={styles.subjectText}>Subject: {item.subject_name || 'Not specified'}</Text>
      <Text style={styles.dateText}>
        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Date not available'}
      </Text>
      
      {item.message && (
        <Text style={styles.messageText}>{item.message}</Text>
      )}
      
      {item.status === 'completed' && !item.reviewed && (
        <TouchableOpacity 
          style={styles.reviewButton}
          onPress={() => handleRateTutor(item)}
        >
          <Text style={styles.reviewButtonText}>Rate & Review</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Your Tutor</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowProfileModal(true)}>
            <Ionicons name="person-circle-outline" size={28} color="#4f46e5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tutors or subjects..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons name="filter" size={20} color="#4f46e5" />
            </TouchableOpacity>
          </View>

          {/* Filters */}
          {showFilters && (
            <View style={styles.filtersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity 
                  style={[
                    styles.filterChip,
                    selectedSubject === '' && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedSubject('')}
                >
                  <Text style={selectedSubject === '' ? styles.filterChipTextActive : styles.filterChipText}>
                    All Subjects
                  </Text>
                </TouchableOpacity>
                
                {subjects.map((subject, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={[
                      styles.filterChip,
                      selectedSubject === subject && styles.filterChipActive
                    ]}
                    onPress={() => setSelectedSubject(
                      selectedSubject === subject ? '' : subject
                    )}
                  >
                    <Text style={selectedSubject === subject ? styles.filterChipTextActive : styles.filterChipText}>
                      {subject}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <View style={styles.filterRow}>
                <TextInput
                  style={styles.feeInput}
                  placeholder="Min Fee"
                  keyboardType="numeric"
                  value={minFee}
                  onChangeText={setMinFee}
                />
                <Text style={styles.toText}>to</Text>
                <TextInput
                  style={styles.feeInput}
                  placeholder="Max Fee"
                  keyboardType="numeric"
                  value={maxFee}
                  onChangeText={setMaxFee}
                />
              </View>
              
              <View style={styles.filterRow}>
                <TouchableOpacity 
                  style={[
                    styles.ratingButton,
                    ratingFilter === 4 && styles.ratingButtonActive
                  ]}
                  onPress={() => setRatingFilter(ratingFilter === 4 ? 0 : 4)}
                >
                  <Text style={ratingFilter === 4 ? styles.ratingActive : styles.ratingInactive}>
                    ⭐⭐⭐⭐ & above
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.availabilityButton,
                    availabilityFilter && styles.availabilityButtonActive
                  ]}
                  onPress={() => setAvailabilityFilter(!availabilityFilter)}
                >
                  <Ionicons 
                    name={availabilityFilter ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={availabilityFilter ? "#4f46e5" : "#64748b"} 
                  />
                  <Text style={availabilityFilter ? styles.availabilityTextActive : styles.availabilityTextInactive}>
                    Available Now
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Favorite Tutors */}
        {favorites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorite Tutors</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {favorites.map(tutor => (
                <TouchableOpacity 
                  key={tutor.id}
                  style={styles.favoriteCard}
                  onPress={() => handleViewTutorProfile(tutor)}
                >
                  <Text style={styles.favoriteName}>{tutor.user || 'Tutor'}</Text>
                  <Text style={styles.favoriteSubjects} numberOfLines={1}>
                    {tutor.subjects?.map((s: any) => s.name).join(', ') || 'No subjects'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tutor Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Tutors ({handleSearch().length})
          </Text>
          {handleSearch().length === 0 ? (
            <Text style={styles.emptyText}>No tutors found matching your criteria</Text>
          ) : (
            <FlatList
              data={handleSearch()}
              renderItem={renderTutorCard}
              keyExtractor={item => item.id?.toString() || Math.random().toString()}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Bookings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Bookings ({bookings.length})</Text>
          {bookings.length === 0 ? (
            <Text style={styles.emptyText}>No bookings yet. Book your first tutor!</Text>
          ) : (
            <FlatList
              data={bookings}
              renderItem={renderBookingCard}
              keyExtractor={item => item.id?.toString() || Math.random().toString()}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Tutor Profile Modal */}
      <Modal
        visible={showTutorProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTutorProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tutor Profile</Text>
              <TouchableOpacity onPress={() => setShowTutorProfileModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedTutor && (
              <>
                <View style={styles.profileHeader}>
                  <View style={styles.profileAvatar}>
                    <Ionicons name="person-circle" size={60} color="#4f46e5" />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{selectedTutor.user || 'Tutor'}</Text>
                    <View style={styles.profileRating}>
                      <Ionicons name="star" size={20} color="#fbbf24" />
                      <Text style={styles.profileRatingText}>
                        {selectedTutor.average_rating?.toFixed(1) || 'No ratings'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.profileDetails}>
                  <View style={styles.profileDetailItem}>
                    <Ionicons name="book-outline" size={20} color="#8b5cf6" />
                    <Text style={styles.profileDetailText}>
                      Subjects: {selectedTutor.subjects?.map((s: any) => s.name).join(', ') || 'Not specified'}
                    </Text>
                  </View>
                  
                  <View style={styles.profileDetailItem}>
                    <Ionicons name="cash-outline" size={20} color="#10b981" />
                    <Text style={styles.profileDetailText}>
                      Fee: ₹{selectedTutor.fee || 0}/hour
                    </Text>
                  </View>
                  
                  <View style={styles.profileDetailItem}>
                    <Ionicons name="location-outline" size={20} color="#3b82f6" />
                    <Text style={styles.profileDetailText}>
                      Location: {selectedTutor.location || 'Not specified'}
                    </Text>
                  </View>
                  
                  <View style={styles.profileDetailItem}>
                    <Ionicons name="time-outline" size={20} color="#f59e0b" />
                    <Text style={styles.profileDetailText}>
                      Experience: {selectedTutor.experience_years || 0} years
                    </Text>
                  </View>
                  
                  <View style={styles.profileDetailItem}>
                    <View style={[
                      styles.onlineStatus,
                      { backgroundColor: selectedTutor.is_online ? '#10b981' : '#ef4444' }
                    ]} />
                    <Text style={styles.profileDetailText}>
                      Status: {selectedTutor.is_online ? 'Online - Available' : 'Offline'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.bioTitle}>About</Text>
                <Text style={styles.bioText}>
                  {selectedTutor.bio || 'No bio available for this tutor.'}
                </Text>

                <View style={styles.profileActions}>
                  <TouchableOpacity 
                    style={[styles.profileButton, styles.bookTutorButton]}
                    onPress={() => {
                      setShowTutorProfileModal(false)
                      handleBookTutor(selectedTutor)
                    }}
                    disabled={!selectedTutor.is_online}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#fff" />
                    <Text style={styles.profileButtonText}>Book This Tutor</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.profileButton, styles.favoriteButton]}
                    onPress={() => {
                      toggleFavorite(selectedTutor.id)
                      setShowTutorProfileModal(false)
                    }}
                  >
                    <Ionicons 
                      name={favorites.some(f => f.id === selectedTutor.id) ? "heart" : "heart-outline"} 
                      size={20} 
                      color="#ef4444" 
                    />
                    <Text style={[styles.profileButtonText, {color: '#ef4444'}]}>
                      {favorites.some(f => f.id === selectedTutor.id) ? 'Remove Favorite' : 'Add to Favorites'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book {selectedTutor?.user || 'Tutor'}</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            {selectedTutor && (
              <>
                <View style={styles.bookingInfo}>
                  <View style={styles.bookingInfoItem}>
                    <Ionicons name="book-outline" size={18} color="#8b5cf6" />
                    <Text style={styles.bookingInfoText}>
                      Subject: {selectedTutor.subjects?.[0]?.name || 'Not specified'}
                    </Text>
                  </View>
                  
                  <View style={styles.bookingInfoItem}>
                    <Ionicons name="cash-outline" size={18} color="#10b981" />
                    <Text style={styles.bookingInfoText}>
                      Fee: ₹{selectedTutor.fee || 0}/hour
                    </Text>
                  </View>
                  
                  <View style={styles.bookingInfoItem}>
                    <View style={[
                      styles.bookingStatus,
                      { backgroundColor: selectedTutor.is_online ? '#10b981' : '#ef4444' }
                    ]} />
                    <Text style={styles.bookingInfoText}>
                      {selectedTutor.is_online ? 'Available for booking' : 'Currently offline'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.messageLabel}>Message to Tutor</Text>
                <TextInput
                  style={[styles.messageInput, styles.textArea]}
                  placeholder="Introduce yourself and explain what you need help with..."
                  value={bookingMessage}
                  onChangeText={setBookingMessage}
                  multiline
                  numberOfLines={4}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowBookingModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleSubmitBooking}
                    disabled={!selectedTutor.is_online}
                  >
                    <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate {selectedBooking?.tutor_name}</Text>
            {/* Add star rating component and comment input here */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowReviewModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => submitReview(5, 'Great session!')}
              >
                <Text>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Student Profile</Text>
            
            <Text style={styles.profileLabel}>Preferred Subjects</Text>
            <View style={styles.chipsContainer}>
              {subjects.map((subject, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.profileChip,
                    preferredSubjects.includes(subject) && styles.profileChipActive
                  ]}
                  onPress={() => {
                    if (preferredSubjects.includes(subject)) {
                      setPreferredSubjects(preferredSubjects.filter(s => s !== subject))
                    } else {
                      setPreferredSubjects([...preferredSubjects, subject])
                    }
                  }}
                >
                  <Text style={preferredSubjects.includes(subject) ? styles.profileChipTextActive : styles.profileChipText}>
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.profileLabel}>Preferred Location</Text>
            <TextInput
              style={styles.profileInput}
              placeholder="Enter your location"
              value={preferredLocation}
              onChangeText={setPreferredLocation}
            />
            
            <Text style={styles.profileLabel}>Learning Goals</Text>
            <TextInput
              style={[styles.profileInput, styles.textArea]}
              placeholder="What do you want to achieve?"
              value={learningGoals}
              onChangeText={setLearningGoals}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Enable Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowProfileModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveProfile}
              >
                <Text>Save Profile</Text>
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
  logoutButton: {
    marginLeft: 8,
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  filterButton: {
    padding: 8,
  },
  filtersContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#4f46e5',
  },
  filterChipText: {
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  feeInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toText: {
    marginHorizontal: 8,
    color: '#64748b',
  },
  ratingButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
  },
  ratingButtonActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#fbbf24',
  },
  ratingActive: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  ratingInactive: {
    color: '#64748b',
  },
  availabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    gap: 8,
  },
  availabilityButtonActive: {
    backgroundColor: '#f1f5f9',
    borderColor: '#4f46e5',
  },
  availabilityTextActive: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  availabilityTextInactive: {
    color: '#64748b',
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1e293b',
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 16,
  },
  tutorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  tutorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  tutorSubjects: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  tutorDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconSpacing: {
    marginLeft: 16,
  },
  ratingText: {
    marginLeft: 4,
    color: '#f59e0b',
    fontWeight: '500',
  },
  feeText: {
    marginLeft: 4,
    color: '#10b981',
    fontWeight: '500',
  },
  locationText: {
    marginLeft: 4,
    color: '#3b82f6',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  availabilityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  experienceText: {
    color: '#64748b',
    fontSize: 14,
  },
  bioText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 8,
  },
  tutorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#475569',
    fontWeight: '500',
  },
  bookButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  favoriteCard: {
    width: 140,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  favoriteSubjects: {
    fontSize: 12,
    color: '#64748b',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#fbbf24',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  subjectText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
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
  reviewButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fbbf24',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reviewButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
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
  modalText: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#64748b',
  },
  confirmButton: {
    backgroundColor: '#4f46e5',
    marginLeft: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  // Tutor Profile Modal Styles
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  profileRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileRatingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#f59e0b',
    fontWeight: '600',
  },
  profileDetails: {
    gap: 12,
    marginBottom: 20,
  },
  profileDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileDetailText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#475569',
    flex: 1,
  },
  onlineStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  profileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  bookTutorButton: {
    backgroundColor: '#4f46e5',
  },
  favoriteButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Booking Modal Styles
  bookingInfo: {
    gap: 12,
    marginBottom: 20,
  },
  bookingInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingInfoText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#475569',
    flex: 1,
  },
  bookingStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Student Profile Modal Styles
  profileLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
    color: '#1e293b',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
  profileChipActive: {
    backgroundColor: '#4f46e5',
  },
  profileChipText: {
    color: '#475569',
  },
  profileChipTextActive: {
    color: '#fff',
  },
  profileInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#1e293b',
  },
});