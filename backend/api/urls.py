# users/urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('verify-email/', VerifyEmailCodeView.as_view(), name='verify-email'),
    path('login/', UserLoginView.as_view(), name='user-login'),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('save/', SavingCreateView.as_view(), name='save-money'),
    path('loan/', LoanCreateView.as_view(), name='loan-create'),
    path('totals/', OverallTotalsView.as_view(), name='overall_totals'),
]
