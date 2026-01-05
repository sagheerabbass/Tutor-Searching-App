"""
URL configuration for myapp project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from app.views import RegisterView,TutorListView,CustomTokenObtainPairView,MyBookingsView,FavoriteTutorsView,StudentProfileView,tutor_bookings,tutor_profile,my_students,accept_booking,reject_booking,complete_booking,SubjectListView,CreateBookingView,UpdateTutorProfileView,CreateTutorProfileView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', RegisterView.as_view()),
    path('api/login/', CustomTokenObtainPairView.as_view()),  # Updated!
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path('tutors/', TutorListView.as_view()),
    path('api/my-bookings/', MyBookingsView.as_view()),
    path('api/favorite-tutors/', FavoriteTutorsView.as_view()),
    path('api/favorite-tutors/<int:pk>/', FavoriteTutorsView.as_view()),
    path('api/student-profile/', StudentProfileView.as_view()),
    path('api/tutor-profile/', tutor_profile),
    path('api/tutor-bookings/', tutor_bookings),
    path('api/my-students/', my_students),
    path('api/bookings/<int:pk>/accept/', accept_booking),
    path('api/bookings/<int:pk>/reject/', reject_booking),
    path('api/bookings/<int:pk>/complete/', complete_booking),
    path('api/subjects/', SubjectListView.as_view()),  # GET list, POST create
path('api/tutor-profile/create/', CreateTutorProfileView.as_view()),
path('api/tutor-profile/update/', UpdateTutorProfileView.as_view()),
]
