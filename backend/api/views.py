# users/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from .serializers import UserRegistrationSerializer
from .models import *
from rest_framework_simplejwt.tokens import RefreshToken  # Optional, for JWT auth

class UserRegistrationView(APIView):
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Send confirmation email
            confirmation_code = user.confirmation_code
            send_mail(
                subject="Verify Your Email",
                message=f"Hello {user.username},\nYour confirmation code is: {confirmation_code}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

            return Response(
                {"message": "User registered successfully. A confirmation code has been sent to your email."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailCodeView(APIView):
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('confirmation_code')

        if not email or not code:
            return Response(
                {"error": "Email and confirmation code are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)

        if user.confirmation_code != code:
            return Response({"error": "Invalid confirmation code."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_verified = True
        user.confirmation_code = None
        user.save()

        return Response({"message": "Email verified successfully. You can now log in."}, status=status.HTTP_200_OK)


# users/views.py



class UserLoginView(APIView):
    def post(self, request):
        username= request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {"error": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_verified:
            return Response({"error": "Email not verified."}, status=status.HTTP_403_FORBIDDEN)

        # If you're using JWT, return tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Login successful.",
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role,
            }
        }, status=status.HTTP_200_OK)
