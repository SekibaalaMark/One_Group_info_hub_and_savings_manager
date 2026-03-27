from django.test import TestCase
from users.serializers import UserRegistrationSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class UserRegistrationSerializerTest(TestCase):

    def setUp(self):
        self.base_data = {
            "username": "newuser",
            "email": "newuser@gmail.com",
            "password": "securepassword123",
            "password2": "securepassword123",
            "role": "general_user"
        }

    def test_serializer_with_valid_data(self):
        """Test that valid data passes and creates a user with a code."""
        serializer = UserRegistrationSerializer(data=self.base_data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        
        self.assertEqual(user.email, self.base_data["email"])
        self.assertFalse(user.is_verified)
        self.assertEqual(len(user.confirmation_code), 6)
        self.assertTrue(user.check_password(self.base_data["password"]))

    def test_passwords_must_match(self):
        """Test validation fails if passwords do not match."""
        invalid_data = self.base_data.copy()
        invalid_data["password2"] = "mismatching_pass"
        
        serializer = UserRegistrationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
        self.assertEqual(serializer.errors["non_field_errors"][0], "Passwords do not match")

    def test_only_gmail_allowed(self):
        """Test validation fails for non-gmail addresses."""
        invalid_data = self.base_data.copy()
        invalid_data["email"] = "user@outlook.com"
        
        serializer = UserRegistrationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["non_field_errors"][0], "Only Gmail accounts are allowed.")

    def test_invalid_role_selection(self):
        """Test validation fails if the role is not in the ROLES list."""
        invalid_data = self.base_data.copy()
        invalid_data["role"] = "super_admin" # Not in your ROLES list
        
        serializer = UserRegistrationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["non_field_errors"][0], "Invalid role selected")

    def test_duplicate_username_validation(self):
        """Test validation fails if username already exists."""
        User.objects.create_user(username="newuser", email="other@gmail.com", password="pass")
        
        serializer = UserRegistrationSerializer(data=self.base_data)
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["non_field_errors"][0], "Username already exists")
        
        
        
        


from django.test import TestCase
from users.serializers import PasswordResetRequestSerializer

class PasswordResetRequestSerializerTest(TestCase):

    def test_serializer_with_valid_email(self):
        """Test that a standard valid email passes validation."""
        data = {"email": "user@gmail.com"}
        serializer = PasswordResetRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['email'], "user@gmail.com")

    def test_serializer_with_invalid_email(self):
        """Test that an improperly formatted email fails."""
        data = {"email": "not-an-email"}
        serializer = PasswordResetRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_serializer_empty_email(self):
        """Test that a blank email field is not allowed."""
        data = {"email": ""}
        serializer = PasswordResetRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        
        
        
        




from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from users.serializers import PasswordResetConfirmSerializer

User = get_user_model()

class PasswordResetConfirmSerializerTest(TestCase):

    def setUp(self):
        # Create a user to reset the password for
        self.user = User.objects.create_user(
            username='reset_user',
            email='reset@gmail.com',
            password='old_password123'
        )
        # Generate valid UID and Token
        self.uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        self.token = default_token_generator.make_token(self.user)
        
        self.valid_data = {
            "uid": self.uid,
            "token": self.token,
            "new_password": "new_secure_password123"
        }

    def test_successful_password_reset(self):
        """Verify that a valid UID and Token successfully update the password."""
        serializer = PasswordResetConfirmSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        serializer.save()
        
        # Refresh user from DB and check password
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("new_secure_password123"))

    def test_invalid_uid_fails(self):
        """Test that a tampered or incorrect UID raises a ValidationError."""
        invalid_data = self.valid_data.copy()
        invalid_data["uid"] = "not-a-real-uid"
        
        serializer = PasswordResetConfirmSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["non_field_errors"][0], "Invalid UID")

    def test_expired_or_invalid_token_fails(self):
        """Test that a fake token is rejected."""
        invalid_data = self.valid_data.copy()
        invalid_data["token"] = "123-abc-invalid-token"
        
        serializer = PasswordResetConfirmSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["non_field_errors"][0], "Invalid or expired token")

    def test_short_password_fails(self):
        """Test that the min_length=6 constraint is enforced."""
        invalid_data = self.valid_data.copy()
        invalid_data["new_password"] = "12345" # Too short
        
        serializer = PasswordResetConfirmSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("new_password", serializer.errors)
        
        
        





from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Saving, Loan
from .serializers import SavingSerializer

User = get_user_model()

class SavingSerializerTest(TestCase):

    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(
            username='financer', 
            email='finance@gmail.com', 
            password='password123'
        )
        
        # Pre-populate with an existing loan to test the math
        Loan.objects.create(person_loaning=self.user, amount_loaned=200)

    def test_saving_creation_calculates_totals_correctly(self):
        """Verify that a new saving correctly aggregates existing data."""
        data = {
            "username": "financer",
            "amount_saved": 1000
        }
        
        serializer = SavingSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        saving = serializer.save()

        # Math check: Total Savings (1000), Total Loan (200), Net (800)
        self.assertEqual(saving.total_savings, 1000)
        self.assertEqual(saving.total_loan, 200)
        self.assertEqual(saving.net_saving, 800)

    def test_sequential_savings_update_history(self):
        """Ensure subsequent savings update the 'total' fields on old records."""
        # First saving
        Saving.objects.create(
            person_saving=self.user, amount_saved=500, 
            total_savings=500, total_loan=200, net_saving=300
        )
        
        # Second saving via Serializer
        data = {"username": "financer", "amount_saved": 500}
        serializer = SavingSerializer(data=data)
        serializer.is_valid()
        new_saving = serializer.save()

        # Check the NEW record
        self.assertEqual(new_saving.total_savings, 1000)
        
        # Check that the OLD record was updated by the .update() call in create()
        old_saving = Saving.objects.exclude(id=new_saving.id).first()
        self.assertEqual(old_saving.total_savings, 1000)
        self.assertEqual(old_saving.net_saving, 800)

    def test_invalid_username_raises_error(self):
        """Test that a non-existent username fails validation."""
        data = {"username": "ghost_user", "amount_saved": 100}
        serializer = SavingSerializer(data=data)
        
        # This will trigger the try/except block in your create() method