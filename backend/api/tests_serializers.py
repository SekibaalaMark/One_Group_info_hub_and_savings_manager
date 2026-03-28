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
        
        
        
        
        


from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Saving, Loan
from .serializers import LoanSerializer

User = get_user_model()

class LoanSerializerTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='borrower', 
            email='borrower@gmail.com', 
            password='password123'
        )
        
        # Create an initial saving record so we can see it get updated
        Saving.objects.create(
            person_saving=self.user,
            amount_saved=1000,
            total_savings=1000,
            total_loan=0,
            net_saving=1000
        )

    def test_loan_creation_updates_savings_records(self):
        """Verify that taking a loan updates the total_loan and net_saving in Saving model."""
        data = {
            "username": "borrower",
            "amount_loaned": 400
        }
        
        serializer = LoanSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        loan = serializer.save()

        # Check the Loan was created
        self.assertEqual(loan.amount_loaned, 400)

        # Check that the existing Saving record was updated
        saved_record = Saving.objects.get(person_saving=self.user)
        self.assertEqual(saved_record.total_loan, 400)
        self.assertEqual(saved_record.net_saving, 600) # 1000 - 400

    def test_multiple_loans_aggregation(self):
        """Ensure that taking a second loan aggregates correctly with the first."""
        # Create first loan manually
        Loan.objects.create(person_loaning=self.user, amount_loaned=100)
        
        # Create second loan via serializer
        data = {"username": "borrower", "amount_loaned": 200}
        serializer = LoanSerializer(data=data)
        serializer.is_valid()
        serializer.save()

        # Check savings update
        saved_record = Saving.objects.get(person_saving=self.user)
        self.assertEqual(saved_record.total_loan, 300) # 100 + 200
        self.assertEqual(saved_record.net_saving, 700) # 1000 - 300

    def test_loan_without_existing_savings(self):
        """Ensure the logic doesn't crash if a user has loans but 0 savings."""
        new_user = User.objects.create_user(username='nosavings', email='no@gmail.com', password='p')
        
        data = {"username": "nosavings", "amount_loaned": 500}
        serializer = LoanSerializer(data=data)
        serializer.is_valid()
        
        # This shouldn't crash, it should just update 0 saving rows
        loan = serializer.save()
        self.assertEqual(Loan.objects.filter(person_loaning=new_user).count(), 1)
        self.assertEqual(Saving.objects.filter(person_saving=new_user).count(), 0)
        
        
        
        




from django.test import TestCase
from .models import Player
from .serializers import RegisterPlayerSerializer

class RegisterPlayerSerializerTest(TestCase):

    def setUp(self):
        self.valid_data = {
            "name": "Denis Onyango",
            "position": "GK"
        }

    def test_serializer_with_valid_data(self):
        """Test that a valid player and position are accepted."""
        serializer = RegisterPlayerSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        player = serializer.save()
        
        self.assertEqual(player.name, "Denis Onyango")
        self.assertEqual(player.position, "GK")

    def test_duplicate_player_name_fails(self):
        """Test that the serializer enforces the unique name constraint."""
        # Create an existing player
        Player.objects.create(name="Denis Onyango", position="GK")
        
        serializer = RegisterPlayerSerializer(data=self.valid_data)
        self.assertFalse(serializer.is_valid())
        # Note: Your custom validate() raises a ValidationError which usually 
        # ends up in 'non_field_errors' in DRF.
        self.assertIn('non_field_errors', serializer.errors)

    def test_invalid_position_choice(self):
        """Test that a position not in the POSITION list is rejected."""
        invalid_data = {
            "name": "New Player",
            "position": "Striker" # Assuming 'Striker' isn't in your shorthand keys
        }
        serializer = RegisterPlayerSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())

    def test_missing_required_fields(self):
        """Test that name and position are strictly required."""
        serializer = RegisterPlayerSerializer(data={"name": "Only Name"})
        self.assertFalse(serializer.is_valid())
        self.assertIn('position', serializer.errors)
        
        
        




from django.test import TestCase
from .models import Player
from .serializers import DeletePlayerSerializer

class DeletePlayerSerializerTest(TestCase):

    def setUp(self):
        # Create a player to test deletion validation
        self.player = Player.objects.create(name="Khalid Aucho", position="Midfielder")

    def test_validate_existing_player(self):
        """Test that a name that exists in the DB passes validation."""
        data = {"name": "Khalid Aucho"}
        serializer = DeletePlayerSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['name'], "Khalid Aucho")

    def test_validate_non_existent_player_fails(self):
        """Test that a name NOT in the DB triggers the ValidationError."""
        data = {"name": "Non Existent Player"}
        serializer = DeletePlayerSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        # Check that the specific field 'name' has the error
        self.assertIn('name', serializer.errors)
        self.assertEqual(serializer.errors['name'][0], "No player with this name exists.")

    def test_case_sensitivity(self):
        """Verify if your search is case-sensitive (Django defaults to sensitive)."""
        data = {"name": "khalid aucho"} # Lowercase version
        serializer = DeletePlayerSerializer(data=data)
        
        # Unless you use __iexact in your filter, this will likely fail
        self.assertFalse(serializer.is_valid())
        
        
        
        
        


from django.test import TestCase
from .models import Player
from .serializers import PlayerSerializer

class PlayerSerializerTest(TestCase):

    def setUp(self):
        # Create a sample player for the "Read" test
        self.player_attributes = {
            'name': 'Denis Onyango',
            'position': 'GK'
        }
        self.player = Player.objects.create(**self.player_attributes)
        self.serializer = PlayerSerializer(instance=self.player)

    def test_contains_expected_fields(self):
        """Verify the serializer output contains exactly the fields we defined."""
        data = self.serializer.data
        self.assertCountEqual(data.keys(), ['id', 'name', 'position'])

    def test_field_content(self):
        """Check that the data values match the database record."""
        data = self.serializer.data
        self.assertEqual(data['name'], self.player_attributes['name'])
        self.assertEqual(data['position'], self.player_attributes['position'])

    def test_id_is_present(self):
        """Ensure the 'id' (primary key) is included in the output."""
        # This is important for front-end apps to identify specific records
        self.assertIsNotNone(self.serializer.data['id'])
        
        
        
        
        
        



from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Saving, Loan
from .serializers import LoanPaymentSerializer

User = get_user_model()

class LoanPaymentSerializerTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='payer', 
            email='payer@gmail.com', 
            password='password123'
        )
        
        # 1. Setup an existing Loan (Debt: 1000)
        Loan.objects.create(person_loaning=self.user, amount_loaned=1000)
        
        # 2. Setup an existing Saving record
        Saving.objects.create(
            person_saving=self.user,
            amount_saved=2000,
            total_savings=2000,
            total_loan=1000,
            net_saving=1000
        )

    def test_successful_loan_payment(self):
        """Verify that a valid payment reduces debt and increases net savings."""
        data = {"username": "payer", "amount_paid": 400}
        serializer = LoanPaymentSerializer(data=data)
        
        self.assertTrue(serializer.is_valid(), serializer.errors)
        payment = serializer.save()

        # Check the 'payment' entry is negative
        self.assertEqual(payment.amount_loaned, -400)

        # Check that Savings record was updated correctly
        saved_record = Saving.objects.get(person_saving=self.user)
        self.assertEqual(saved_record.total_loan, 600)  # 1000 - 400
        self.assertEqual(saved_record.net_saving, 1400) # 2000 - 600

    def test_overpayment_fails(self):
        """Ensure users cannot pay more than what they owe."""
        data = {"username": "payer", "amount_paid": 1500} # Owed only 1000
        serializer = LoanPaymentSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
        self.assertIn("cannot exceed outstanding loan balance", serializer.errors["non_field_errors"][0])

    def test_payment_with_no_outstanding_loans(self):
        """Ensure a user with 0 debt cannot make a payment."""
        new_user = User.objects.create_user(username='debt_free', email='df@gmail.com', password='p')
        data = {"username": "debt_free", "amount_paid": 100}
        
        serializer = LoanPaymentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["non_field_errors"][0], "User 'debt_free' has no outstanding loans to pay.")

    def test_min_value_validation(self):
        """Check that amount_paid must be at least 1."""
        data = {"username": "payer", "amount_paid": 0}
        serializer = LoanPaymentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('amount_paid', serializer.errors)
        
        
        
        
        



from django.test import TestCase
from django.contrib.auth import get_user_model
from users.serializers import PasswordResetRequestSerializer

User = get_user_model()

class PasswordResetRequestSerializerTest(TestCase):

    def setUp(self):
        # Create a user that actually exists in the system
        self.user = User.objects.create_user(
            username='existing_user',
            email='real_user@gmail.com',
            password='password123'
        )

    def test_valid_existing_email_passes(self):
        """Test that an email registered in the system is valid."""
        data = {"email": "real_user@gmail.com"}
        serializer = PasswordResetRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['email'], "real_user@gmail.com")

    def test_non_existent_email_fails(self):
        """Test that the custom validate_email method catches missing users."""
        data = {"email": "stranger@gmail.com"}
        serializer = PasswordResetRequestSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        # The error should be attached to the 'email' field
        self.assertIn('email', serializer.errors)
        self.assertEqual(serializer.errors['email'][0], "User with this email does not exist.")

    def test_malformed_email_fails(self):
        """Test that standard EmailField validation still works."""
        data = {"email": "not-an-email-at-all"}
        serializer = PasswordResetRequestSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
        
        
        
        
        



from django.test import TestCase
from django.contrib.auth import get_user_model
from users.serializers import PasswordResetSerializer

User = get_user_model()

class PasswordResetSerializerTest(TestCase):

    def setUp(self):
        # Create a user with a specific confirmation code
        self.user = User.objects.create_user(
            username='reset_target',
            email='target@gmail.com',
            password='old_password123'
        )
        self.user.confirmation_code = "654321"
        self.user.save()

        self.valid_data = {
            "email": "target@gmail.com",
            "confirmation_code": "654321",
            "new_password": "brand_new_pass_123",
            "confirm_password": "brand_new_pass_123"
        }

    def test_successful_reset(self):
        """Verify valid code and matching passwords update the user."""
        serializer = PasswordResetSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        serializer.save()

        self.user.refresh_from_db()
        # Verify password changed
        self.assertTrue(self.user.check_password("brand_new_pass_123"))
        # Verify code was cleared for security
        self.assertEqual(self.user.confirmation_code, "")

    def test_password_mismatch_fails(self):
        """Test that non-matching new passwords trigger a validation error."""
        invalid_data = self.valid_data.copy()
        invalid_data["confirm_password"] = "different_pass_456"
        
        serializer = PasswordResetSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors['non_field_errors'][0], "Passwords do not match.")

    def test_invalid_confirmation_code_fails(self):
        """Test that an incorrect code is rejected even if email is correct."""
        invalid_data = self.valid_data.copy()
        invalid_data["confirmation_code"] = "000000"
        
        serializer = PasswordResetSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors['non_field_errors'][0], "Invalid email or confirmation code.")

    def test_password_length_enforcement(self):
        """Verify the min_length=8 constraint is working."""
        invalid_data = self.valid_data.copy()
        invalid_data["new_password"] = "short"
        invalid_data["confirm_password"] = "short"
        
        serializer = PasswordResetSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('new_password', serializer.errors)
        
        
        
        
        



from django.test import TestCase
from django.contrib.auth import get_user_model
from users.serializers import UsernameSerializer

User = get_user_model()

class UsernameSerializerTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='spotlight_user',
            email='spotlight@gmail.com',
            password='password123'
        )
        self.serializer = UsernameSerializer(instance=self.user)

    def test_serialization_contains_only_username(self):
        """Verify that only the username field is exported to JSON."""
        data = self.serializer.data
        
        # Check that 'username' is present and correct
        self.assertEqual(data['username'], 'spotlight_user')
        
        # CRITICAL: Ensure no other fields leaked into the response
        self.assertEqual(len(data.keys()), 1)
        self.assertNotIn('email', data)
        self.assertNotIn('id', data)

    def test_deserialization_valid_data(self):
        """Test that the serializer can validate a new username."""
        data = {'username': 'new_candidate'}
        serializer = UsernameSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['username'], 'new_candidate')

    def test_duplicate_username_fails(self):
        """Verify the unique constraint is respected during validation."""
        data = {'username': 'spotlight_user'}
        serializer = UsernameSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)
        
        
        
        
        


from django.test import TestCase
from django.contrib.auth import get_user_model
from savings.models import Saving
from loans.models import Loan
from users.serializers import UserFinancialDetailsSerializer

User = get_user_model()

class UserFinancialDetailsSerializerTest(TestCase):

    def setUp(self):
        # 1. Create the user
        self.user = User.objects.create_user(
            username='dashboard_user',
            email='dash@gmail.com',
            password='password123'
        )

        # 2. Add some savings (Total: 1500)
        Saving.objects.create(person_saving=self.user, amount_saved=1000, total_savings=1000, total_loan=0, net_saving=1000)
        Saving.objects.create(person_saving=self.user, amount_saved=500, total_savings=1500, total_loan=0, net_saving=1500)

        # 3. Add some loans (Total: 400)
        Loan.objects.create(person_loaning=self.user, amount_loaned=300)
        Loan.objects.create(person_loaning=self.user, amount_loaned=100)

    def test_financial_aggregation_logic(self):
        """Verify that the SerializerMethodFields sum up data correctly."""
        serializer = UserFinancialDetailsSerializer(instance=self.user)
        data = serializer.data

        # Check Savings Sum
        self.assertEqual(data['total_savings'], 1500)
        
        # Check Loans Sum
        self.assertEqual(data['total_loans'], 400)
        
        # Check Net Calculation (1500 - 400)
        self.assertEqual(data['net_savings'], 1100)

    def test_zero_values_for_new_user(self):
        """Ensure a user with no history returns 0 instead of None."""
        new_user = User.objects.create_user(username='fresh_user', email='f@gmail.com', password='p')
        serializer = UserFinancialDetailsSerializer(instance=new_user)
        
        self.assertEqual(serializer.data['total_savings'], 0)
        self.assertEqual(serializer.data['total_loans'], 0)
        self.assertEqual(serializer.data['net_savings'], 0)

    def test_basic_user_info_inclusion(self):
        """Verify core user fields are still present alongside financial data."""
        serializer = UserFinancialDetailsSerializer(instance=self.user)
        self.assertEqual(serializer.data['username'], 'dashboard_user')
        self.assertEqual(serializer.data['email'], 'dash@gmail.com')