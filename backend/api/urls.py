# users/urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('verify-email/', VerifyEmailCodeView.as_view(), name='verify-email'),
    path('login/', UserLoginView.as_view(), name='user-login'),
    #path('password-reset-request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    #path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('save/', SavingCreateView.as_view(), name='save-money'),
    path('loan/', LoanCreateView.as_view(), name='loan-create'),
    path('totals/', OverallTotalsView.as_view(), name='overall_totals'),
    path('detailed-totals/', DetailedTotalsView.as_view(), name='detailed_totals'),
    path('register-players/', PlayerRegistrationView.as_view(), name='player-reg'),
    path('delete-player/<int:pk>/', PlayerDeleteByIdView.as_view()),
    path('loan-payment/',LoanPaymentView.as_view(), name='loan-payment'),
    path('loan-balance/<str:username>/', UserLoanBalanceView.as_view(), name='user-loan-balance'),
    path('request-password-reset/',RequestPasswordResetView.as_view(),name="forgot-password"),
    path('reset-password/',ResetPasswordView.as_view(),name='reset-password-entries'),
    path('usernames/', UsernamesListView.as_view(), name='usernames-list'),
    path('financial-summary/', UserFinancialSummaryView.as_view(), name='user-financial-summary'),

]
