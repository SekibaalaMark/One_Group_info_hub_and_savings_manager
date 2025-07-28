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



from django.db import transaction
from django.db import models
from rest_framework import serializers

from django.db import transaction
from django.db import models
from rest_framework import serializers

from django.db import transaction
from django.db import models
from rest_framework import serializers

class SavingSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)

    class Meta:
        model = Saving
        fields = ['username', 'amount_saved', 'date_saved', 'total_savings', 'total_loan', 'net_saving']
        read_only_fields = ['date_saved', 'total_savings', 'total_loan', 'net_saving']

    def create(self, validated_data):
        username = validated_data.pop('username')
        
        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError(f"User with username '{username}' does not exist.")

        with transaction.atomic():
            # Calculate new totals
            current_total_savings = Saving.objects.filter(person_saving=user).aggregate(
                total=models.Sum('amount_saved')
            )['total'] or 0
            
            new_total_savings = current_total_savings + validated_data['amount_saved']

            total_loans = Loan.objects.filter(person_loaning=user).aggregate(
                total=models.Sum('amount_loaned')
            )['total'] or 0

            net_saving = new_total_savings - total_loans

            # Create the new saving entry with all calculated values
            saving = Saving.objects.create(
                person_saving=user,
                amount_saved=validated_data['amount_saved'],
                total_savings=new_total_savings,
                total_loan=total_loans,
                net_saving=net_saving
            )

            # Update ALL existing saving records for this user with new totals
            Saving.objects.filter(person_saving=user).exclude(id=saving.id).update(
                total_savings=new_total_savings,
                total_loan=total_loans,
                net_saving=net_saving
            )

            return saving


from django.db import transaction
from django.db import models
from rest_framework import serializers

class LoanSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)

    class Meta:
        model = Loan
        fields = ['username', 'amount_loaned', 'date_loaned']
        read_only_fields = ['date_loaned']

    def create(self, validated_data):
        username = validated_data.pop('username')
        
        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError(f"User with username '{username}' does not exist.")

        with transaction.atomic():
            # Create the new Loan entry
            loan = Loan.objects.create(
                person_loaning=user,
                amount_loaned=validated_data['amount_loaned']
            )

            # Calculate new totals
            total_loans = Loan.objects.filter(person_loaning=user).aggregate(
                total=models.Sum('amount_loaned')
            )['total'] or 0

            total_savings = Saving.objects.filter(person_saving=user).aggregate(
                total=models.Sum('amount_saved')
            )['total'] or 0

            net_saving = total_savings - total_loans

            # Update ALL Saving records for this user with new totals
            Saving.objects.filter(person_saving=user).update(
                total_loan=total_loans,
                net_saving=net_saving
            )

            return loan



class RegisterPlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['name','position']
        extra_kwargs ={
            'name':{'required':True},
            'position':{'required':True}
        }
        def validate(self, data):
            name = data.get('name')
            position = data.get('position')



            if Player.objects.filter(name=name).exists():
                raise serializers.ValidationError('Player with name already exists')

            if position not in dict(CustomUser.POSITION):
                raise serializers.ValidationError("Invalid role selected")
            return data

        def create(self, validated_data):
            player = Player(
                **validated_data,
            )
            player.save()

            # Email sending should happen in the view after this serializer is used
            return player



class DeletePlayerSerializer(serializers.Serializer):
    name = serializers.CharField()

    def validate_name(self, value):
        if not Player.objects.filter(name=value).exists():
            raise serializers.ValidationError("No player with this name exists.")
        return value


from rest_framework import serializers
from .models import Player

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['id', 'name', 'position']



class LoanPaymentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    amount_paid = serializers.IntegerField(min_value=1)
    
    class Meta:
        model = Loan
        fields = ['username', 'amount_paid', 'date_loaned']
        read_only_fields = ['date_loaned']

    def validate(self, data):
        username = data.get('username')
        amount_paid = data.get('amount_paid')
        
        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError(f"User with username '{username}' does not exist.")
        
        # Check if user has any outstanding loans
        total_outstanding_loans = Loan.objects.filter(person_loaning=user).aggregate(
            total=models.Sum('amount_loaned')
        )['total'] or 0
        
        if total_outstanding_loans <= 0:
            raise serializers.ValidationError(f"User '{username}' has no outstanding loans to pay.")
        
        if amount_paid > total_outstanding_loans:
            raise serializers.ValidationError(
                f"Payment amount ({amount_paid}) cannot exceed outstanding loan balance ({total_outstanding_loans})."
            )
        
        data['user'] = user
        data['total_outstanding_loans'] = total_outstanding_loans
        return data

    def create(self, validated_data):
        user = validated_data['user']
        amount_paid = validated_data['amount_paid']
        total_outstanding_loans = validated_data['total_outstanding_loans']
        
        with transaction.atomic():
            # Create a negative loan entry to represent payment
            loan_payment = Loan.objects.create(
                person_loaning=user,
                amount_loaned=-amount_paid  # Negative amount represents payment
            )
            
            # Recalculate totals after payment
            new_total_loans = Loan.objects.filter(person_loaning=user).aggregate(
                total=models.Sum('amount_loaned')
            )['total'] or 0
            
            total_savings = Saving.objects.filter(person_saving=user).aggregate(
                total=models.Sum('amount_saved')
            )['total'] or 0
            
            new_net_saving = total_savings - new_total_loans
            
            # Update ALL Saving records for this user with new totals
            Saving.objects.filter(person_saving=user).update(
                total_loan=new_total_loans,
                net_saving=new_net_saving
            )
            
            return loan_payment
        
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    confirmation_code = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField(min_length=8)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")

        try:
            user = CustomUser.objects.get(email=data['email'], confirmation_code=data['confirmation_code'])
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Invalid email or confirmation code.")

        return data

    def save(self):
        user = CustomUser.objects.get(email=self.validated_data['email'])
        user.set_password(self.validated_data['new_password'])
        user.confirmation_code = ""  # Clear code after use
        user.save()


class UsernameSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username']
