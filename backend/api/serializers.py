from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import *
import random
from rest_framework import serializers
from .models import CustomUser

MANAGERS_IDS = []

class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser 
        fields = ['id', 'email', 'username', 'password', 'password2','role','is_verified']
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'email': {'required': True},
            'username': {'required': True},
            'role': {'required': True},
            'is_verified': {'read_only': True},
        }

    def validate(self, data):
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        password2 = data.get('password2')
        role = data.get('role')

        if CustomUser.objects.filter(username=username).exists():
            raise serializers.ValidationError('Username already exists')

        if role not in dict(CustomUser.ROLES):
            raise serializers.ValidationError("Invalid role selected")


        if '@' not in email or not email.endswith('gmail.com'):
            raise serializers.ValidationError('Only Gmail accounts are allowed.')

        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError("Email already exists")

        if len(password) < 8 or len(password2) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long")

        if password != password2:
            raise serializers.ValidationError("Passwords do not match")

        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')

        # Generate a random 6-digit confirmation code
        confirmation_code = str(random.randint(100000, 999999))

        user = CustomUser(
            **validated_data,
            is_verified=False,
            confirmation_code=confirmation_code
        )
        user.set_password(password)
        user.save()

        # Email sending should happen in the view after this serializer is used
        return user

# users/serializers.py

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


# users/serializers.py
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.hashers import make_password

class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=6)

    def validate(self, data):
        try:
            uid = urlsafe_base64_decode(data['uid']).decode()
            self.user = CustomUser.objects.get(pk=uid)
        except Exception:
            raise serializers.ValidationError("Invalid UID")

        if not default_token_generator.check_token(self.user, data['token']):
            raise serializers.ValidationError("Invalid or expired token")

        return data

    def save(self):
        self.user.password = make_password(self.validated_data['new_password'])
        self.user.save()
