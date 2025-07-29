# users/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from .serializers import *
from .models import *
from rest_framework_simplejwt.tokens import RefreshToken  # Optional, for JWT auth

from rest_framework.permissions import AllowAny
from datetime import date
import random
from django.utils import timezone



class UserRegistrationView(APIView):
    permission_classes = [AllowAny]
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
    permission_classes = [AllowAny]
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
    permission_classes = [AllowAny]
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



# users/views.py
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes


class PasswordResetRequestView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"http://127.0.0.1:8000/api/reset-password-confirm/{uid}/{token}/"

            send_mail(
                subject="Password Reset Request",
                message=f"Click the link to reset your password:\n{reset_link}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )

            return Response({"message": "Password reset link sent."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class PasswordResetConfirmView(APIView):
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from rest_framework import status, permissions



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

class SavingCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SavingSerializer(data=request.data)
        if serializer.is_valid():
            saving = serializer.save()
            return Response(SavingSerializer(saving).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoanCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LoanSerializer(data=request.data)
        if serializer.is_valid():
            loan = serializer.save()
            return Response(LoanSerializer(loan).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
'''
class SavingCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SavingSerializer(data=request.data)
        if serializer.is_valid():
            saving = serializer.save()
            return Response(SavingSerializer(saving).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# views.py



from django.core.exceptions import ObjectDoesNotExist

class LoanCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # Or AllowAny for testing

    def post(self, request):
        serializer = LoanSerializer(data=request.data)
        if serializer.is_valid():
            try:
                loan = serializer.save()
                return Response({
                    "message": "Loan recorded successfully.",
                    "data": LoanSerializer(loan).data
                }, status=status.HTTP_201_CREATED)
            except ObjectDoesNotExist:
                return Response({"error": "Username not found."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
'''


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Sum
from django.db import models

class OverallTotalsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Calculate overall totals across all users
        overall_savings = Saving.objects.aggregate(
            total=models.Sum('amount_saved')
        )['total'] or 0

        overall_loans = Loan.objects.aggregate(
            total=models.Sum('amount_loaned')
        )['total'] or 0

        overall_net_savings = overall_savings - overall_loans

        # Count of total users with savings/loans
        users_with_savings = Saving.objects.values('person_saving').distinct().count()
        users_with_loans = Loan.objects.values('person_loaning').distinct().count()

        data = {
            'overall_savings': overall_savings,
            'overall_loans': overall_loans,
            'overall_net_savings': overall_net_savings,
            'users_with_savings': users_with_savings,
            'users_with_loans': users_with_loans,
            'currency': 'UGX'  # or whatever currency you're using
        }

        return Response(data, status=status.HTTP_200_OK)
    



from django.db.models import Sum, Count
class DetailedTotalsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Overall totals
        overall_savings = Saving.objects.aggregate(
            total=models.Sum('amount_saved')
        )['total'] or 0

        overall_loans = Loan.objects.aggregate(
            total=models.Sum('amount_loaned')
        )['total'] or 0

        overall_net_savings = overall_savings - overall_loans

        # Per-user summary
        user_summaries = []
        
        # Get all users who have either savings or loans
        users_with_activity = CustomUser.objects.filter(
            models.Q(savings__isnull=False) | models.Q(loans__isnull=False)
        ).distinct()

        for user in users_with_activity:
            user_savings = Saving.objects.filter(person_saving=user).aggregate(
                total=models.Sum('amount_saved')
            )['total'] or 0

            user_loans = Loan.objects.filter(person_loaning=user).aggregate(
                total=models.Sum('amount_loaned')
            )['total'] or 0

            user_net = user_savings - user_loans

            user_summaries.append({
                'username': user.username,
                'total_savings': user_savings,
                'total_loans': user_loans,
                'net_savings': user_net
            })

        # Statistics
        stats = {
            'total_users': CustomUser.objects.count(),
            'active_users': users_with_activity.count(),
            'users_with_savings': Saving.objects.values('person_saving').distinct().count(),
            'users_with_loans': Loan.objects.values('person_loaning').distinct().count(),
            'total_transactions': Saving.objects.count() + Loan.objects.count()
        }

        data = {
            'overall_totals': {
                'overall_savings': overall_savings,
                'overall_loans': overall_loans,
                'overall_net_savings': overall_net_savings,
                'currency': 'UGX'
            },
            'user_summaries': user_summaries,
            'statistics': stats
        }

        return Response(data, status=status.HTTP_200_OK)


class PlayerRegistrationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        serializer = RegisterPlayerSerializer(data=request.data)
        if serializer.is_valid():
            player = serializer.save()
            if request.user.role !="sports_manger":
                return Response({"message":"Only the football manager adds players"},
                                status=status.HTTP_403_FORBIDDEN)

            return Response(
                {"message": "Player registered successfully."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


from rest_framework.generics import DestroyAPIView
from .models import Player
from .serializers import PlayerSerializer  # You can reuse this

from rest_framework.generics import DestroyAPIView
from rest_framework.response import Response
from rest_framework import status
from .models import Player
from .serializers import PlayerSerializer

class PlayerDeleteByIdView(DestroyAPIView):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        player_name = instance.name  # capture before deletion
        self.perform_destroy(instance)
        return Response(
            {"message": f"Player '{player_name}' has been successfully deleted."},
            status=status.HTTP_200_OK
        )


class LoanPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Check if user is a Treasurer
        if request.user.role != "Treasurer":
            return Response(
                {"error": "Only Treasurers can process loan payments."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = LoanPaymentSerializer(data=request.data)
        if serializer.is_valid():
            try:
                loan_payment = serializer.save()
                
                # Get updated user totals for response
                username = request.data.get('username')
                user = CustomUser.objects.get(username=username)
                
                updated_total_loans = Loan.objects.filter(person_loaning=user).aggregate(
                    total=models.Sum('amount_loaned')
                )['total'] or 0
                
                total_savings = Saving.objects.filter(person_saving=user).aggregate(
                    total=models.Sum('amount_saved')
                )['total'] or 0
                
                updated_net_saving = total_savings - updated_total_loans
                
                return Response({
                    "message": f"Loan payment of {abs(loan_payment.amount_loaned)} recorded successfully for {username}.",
                    "payment_details": {
                        "username": username,
                        "amount_paid": abs(loan_payment.amount_loaned),
                        "payment_date": loan_payment.date_loaned,
                        "updated_totals": {
                            "total_savings": total_savings,
                            "remaining_loan_balance": updated_total_loans,
                            "net_savings": updated_net_saving
                        }
                    }
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response(
                    {"error": f"An error occurred while processing the payment: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    



class UserLoanBalanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, username):
        # Check if user is a Treasurer
        if request.user.role != "Treasurer":
            return Response(
                {"error": "Only Treasurers can view loan balances."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            return Response(
                {"error": f"User with username '{username}' does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calculate totals
        total_loans = Loan.objects.filter(person_loaning=user).aggregate(
            total=models.Sum('amount_loaned')
        )['total'] or 0
        
        total_savings = Saving.objects.filter(person_saving=user).aggregate(
            total=models.Sum('amount_saved')
        )['total'] or 0
        
        net_savings = total_savings - total_loans
        
        # Get loan history
        loan_history = Loan.objects.filter(person_loaning=user).order_by('-date_loaned')
        loan_data = []
        
        for loan in loan_history:
            loan_data.append({
                "amount": loan.amount_loaned,
                "date": loan.date_loaned,
                "type": "Payment" if loan.amount_loaned < 0 else "Loan"
            })
        
        return Response({
            "username": username,
            "financial_summary": {
                "total_savings": total_savings,
                "outstanding_loan_balance": total_loans,
                "net_savings": net_savings
            },
            "loan_history": loan_data
        }, status=status.HTTP_200_OK)



class RequestPasswordResetView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = CustomUser.objects.get(email=email)

            # Generate reset code
            reset_code = str(random.randint(100000, 999999))
            user.confirmation_code = reset_code  # reuse this field
            user.reset_code_sent_at = timezone.now()
            user.save()

            # Send email
            send_mail(
                subject='Password Reset Code',
                message=f'Your password reset code is: {reset_code}',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=False,
            )

            return Response({"message": "Reset code sent to email."}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class ResetPasswordView(APIView):
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

from rest_framework.generics import ListAPIView
class UsernamesListView(ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UsernameSerializer


class UserFinancialSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # User's totals
        user_total_savings = Saving.objects.filter(person_saving=user).aggregate(
            total=models.Sum('amount_saved')
        )['total'] or 0
        
        user_total_loans = Loan.objects.filter(person_loaning=user).aggregate(
            total=models.Sum('amount_loaned')
        )['total'] or 0
        
        user_net_savings = user_total_savings - user_total_loans
        
        # Group totals
        user_total_savings = Saving.objects.filter(person_saving=user).aggregate(
            total=models.Sum('amount_saved')
        )['total'] or 0
        
        user_total_loans = Loan.objects.filter(person_loaning=user).aggregate(
            total=models.Sum('amount_loaned')
        )['total'] or 0
        
        user_net_savings = user_total_savings - user_total_loans
        
        data = {
            'username': user.username,
            'role': user.role,
            'personal_totals': {
                'total_savings': user_total_savings,
                'total_loans': user_total_loans,
                'net_savings': user_net_savings
            },
            'currency': 'UGX'
        }
        
        return Response(data, status=status.HTTP_200_OK)



class AllPlayersView(APIView):
    """
    API view to retrieve all players with complete details
    GET /api/players/all/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        players = Player.objects.all().order_by('name')
        serializer = PlayerSerializer(players, many=True)
        
        # Additional summary information
        total_count = players.count()
        
        # Count by position
        position_breakdown = {}
        for position_code, position_name in Player.POSITION:
            count = players.filter(position=position_code).count()
            if count > 0:  # Only include positions that have players
                position_breakdown[position_name] = count
        
        response_data = {
            "total_players": total_count,
            "position_breakdown": position_breakdown,
            "players": serializer.data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)