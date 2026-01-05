from django.shortcuts import render
from rest_framework import generics, permissions, filters
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django_filters.rest_framework import DjangoFilterBackend
from .models import TutorProfile,Booking,User,StudentProfile
from .serializers import TutorProfileSerializer,BookingSerializer,StudentProfileSerializer,SubjectSerializer,Subject
from .serializers import CustomTokenObtainPairSerializer
from rest_framework.permissions import IsAuthenticated

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
class TutorListView(generics.ListAPIView):
    serializer_class = TutorProfileSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['location', 'is_online', 'subjects']
    search_fields = ['user__username', 'bio', 'subjects__name']
    
    def get_queryset(self):
        # Return only active tutors who are available
        return TutorProfile.objects.filter(
            is_active=True,  # Only active tutors
            user__is_active=True  # Only active user accounts
        ).select_related('user').prefetch_related('subjects')
class TutorDetailView(generics.RetrieveAPIView):
    queryset = TutorProfile.objects.all()
    serializer_class = TutorProfileSerializer
class CreateBookingView(generics.CreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)
class TutorBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(tutor=self.request.user)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]  # Add this
    
    def create(self, request, *args, **kwargs):
        print(f"Registration request: {request.data}")
        response = super().create(request, *args, **kwargs)
        print(f"Registration response: {response.data}")
        return response
class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(student=self.request.user)

class FavoriteTutorsView(generics.ListCreateAPIView):
    serializer_class = TutorProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # You'll need to create a Favorite model or handle this differently
        # For now, return all tutors
        return TutorProfile.objects.all()

class StudentProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.student_profile
# Subject views
class SubjectListView(generics.ListCreateAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]

# Tutor profile creation/update
class CreateTutorProfileView(generics.CreateAPIView):
    serializer_class = TutorProfileSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UpdateTutorProfileView(generics.UpdateAPIView):
    serializer_class = TutorProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.tutor_profile
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tutor_profile(request):
    try:
        profile = request.user.tutor_profile
        return Response({
            'id': profile.id,
            'user': request.user.username,
            'bio': profile.bio or '',
            'fee': float(profile.fee) if profile.fee else 0,
            'location': profile.location or '',
            'is_online': profile.is_online,
            'subjects': [{'id': s.id, 'name': s.name} for s in profile.subjects.all()],
            'average_rating': 4.5,  # Calculate this from reviews
            'experience_years': profile.experience_years or 0
        })
    except Exception as e:
        print(f"Tutor profile error: {e}")
        return Response({
            'error': 'No tutor profile found',
            'message': 'Please create a tutor profile'
        }, status=404)  # Return 404 instead of 200 with error
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tutor_bookings(request):
    bookings = Booking.objects.filter(tutor=request.user)
    data = []
    for booking in bookings:
        data.append({
            'id': booking.id,
            'student_name': booking.student.username,
            'subject_name': booking.subject.name,
            'status': booking.status,
            'created_at': booking.created_at,
            'message': booking.message,
            'student': booking.student.id
        })
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_students(request):
    # Get unique students from bookings
    bookings = Booking.objects.filter(tutor=request.user)
    student_ids = bookings.values_list('student', flat=True).distinct()
    students = User.objects.filter(id__in=student_ids, role='student')
    
    data = []
    for student in students:
        # Count sessions with this student
        sessions = bookings.filter(student=student, status='completed').count()
        
        data.append({
            'id': student.id,
            'username': student.username,
            'email': student.email,
            'total_sessions': sessions,
            'avg_rating': 4.0  # Calculate from reviews
        })
    
    return Response(data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def accept_booking(request, pk):
    try:
        booking = Booking.objects.get(id=pk, tutor=request.user)
        booking.status = 'accepted'
        booking.save()
        return Response({'message': 'Booking accepted'})
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def reject_booking(request, pk):
    try:
        booking = Booking.objects.get(id=pk, tutor=request.user)
        booking.status = 'rejected'
        booking.save()
        return Response({'message': 'Booking rejected'})
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def complete_booking(request, pk):
    try:
        booking = Booking.objects.get(id=pk, tutor=request.user)
        booking.status = 'completed'
        booking.save()
        return Response({'message': 'Booking completed'})
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)
# Create your views here.
