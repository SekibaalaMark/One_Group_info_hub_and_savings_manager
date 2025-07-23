# users/urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('verify-email/', VerifyEmailCodeView.as_view(), name='verify-email'),
    path('login/', UserLoginView.as_view(), name='user-login'),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]
