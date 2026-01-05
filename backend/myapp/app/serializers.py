from rest_framework import serializers
from .models import User
from .models import TutorProfile, Subject, Review, Booking,StudentProfile
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=['student', 'tutor'])  # Make role required
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role')
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'password': {'required': True},
        }
    
    def create(self, validated_data):
        print(f"=== CREATING USER ===")
        print(f"Data: {validated_data}")
        
        role = validated_data.pop('role')
        
        # Create user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=role
        )
        
        print(f"User created: {user.username}, Role: {user.role}")
        
        # Create profile based on role
        try:
            if role == 'tutor':
                TutorProfile.objects.create(user=user)
                print(f"TutorProfile created for {user.username}")
            elif role == 'student':
                StudentProfile.objects.create(user=user)
                print(f"StudentProfile created for {user.username}")
        except Exception as e:
            print(f"Error creating profile: {e}")
            # Don't raise error - user is still created
        
        return user
    
    def to_representation(self, instance):
        """What gets sent back after registration"""
        refresh = RefreshToken.for_user(instance)
        
        return {
            'user': {
                'id': instance.id,
                'username': instance.username,
                'email': instance.email,
                'role': instance.role
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Registration successful'
        }
    
    def validate(self, data):
        """Additional validation"""
        # Check if username already exists
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({
                'username': ['This username is already taken.']
            })
        
        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({
                'email': ['This email is already registered.']
            })
        
        return data
# ADD THIS - Custom JWT Serializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims to the token
        token['username'] = user.username
        token['role'] = user.role  # Your custom role field
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        refresh = self.get_token(self.user)
        
        # Return user data along with tokens
        data.update({
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'role': self.user.role,  # Your custom role field
            },
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
        
        return data


# Rest of your serializers remain the same
class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'

class TutorProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    subjects = SubjectSerializer(many=True,read_only=True)

    class Meta:
        model = TutorProfile
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField()

    class Meta:
        model = Review
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    tutor_name = serializers.CharField(source='tutor.username', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('student', 'status')

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = '__all__'
        read_only_fields = ('user',)