from django.db import models
from django.contrib.auth.models import AbstractUser
class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('tutor', 'Tutor'),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class TutorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tutor_profile')

    bio = models.TextField(blank=True,null=True)
    subjects = models.ManyToManyField(Subject, related_name='tutors',null=True)

    fee = models.DecimalField(max_digits=7, decimal_places=2,blank=True)

    location = models.CharField(max_length=100,blank=True,null=True)

    is_online = models.BooleanField(default=True)
    experience_years = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Tutor: {self.user.username}"
class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')

    preferred_location = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Student: {self.user.username}"
class Booking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='student_bookings'
    )

    tutor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tutor_bookings'
    )

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)

    message = models.TextField(blank=True)

    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} → {self.tutor} ({self.status})"
class Review(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    tutor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')

    rating = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.rating}⭐ for {self.tutor}"


# Create your models here.
