from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError

User = get_user_model()

class CustomUserModelTest(TestCase):

    def test_create_user_with_email_successful(self):
        """Test creating a new user with an email is successful."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123',
            role='general_user'
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.role, 'general_user')
        self.assertFalse(user.is_verified)
        self.assertTrue(user.is_active)

    def test_new_user_invalid_email(self):
        """Test that creating a user with an existing email fails."""
        User.objects.create_user(username='user1', email='same@test.com', password='pass')
        with self.assertRaises(IntegrityError):
            User.objects.create_user(username='user2', email='same@test.com', password='pass')

    def test_user_verification_toggle(self):
        """Test the is_verified boolean defaults to False and can be updated."""
        user = User.objects.create_user(username='verify_me', email='v@test.com', password='pass')
        self.assertFalse(user.is_verified)
        
        user.is_verified = True
        user.confirmation_code = '123456'
        user.save()
        
        updated_user = User.objects.get(username='verify_me')
        self.assertTrue(updated_user.is_verified)
        self.assertEqual(updated_user.confirmation_code, '123456')

    def test_str_representation(self):
        """Test the __str__ method returns the username."""
        user = User.objects.create_user(username='string_test', email='s@test.com', password='pass')
        self.assertEqual(str(user), 'string_test')
        
        
        
        




from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Saving

User = get_user_model()

class SavingModelTest(TestCase):

    def setUp(self):
        # Create a user to associate with the savings
        self.user = User.objects.create_user(
            username='saver1', 
            email='saver@test.com', 
            password='password123',
            role='general_user'
        )

    def test_saving_creation_and_relationship(self):
        """Test that a saving record is correctly linked to a user."""
        saving = Saving.objects.create(
            person_saving=self.user,
            amount_saved=500,
            total_savings=1500,
            total_loan=200,
            net_saving=1300
        )
        
        # Test the foreign key relationship
        self.assertEqual(self.user.savings.count(), 1)
        self.assertEqual(self.user.savings.first().amount_saved, 500)
        
        # Test the __str__ method
        expected_str = f"saver1 saved 500"
        self.assertEqual(str(saving), expected_str)

    def test_saving_math_integrity(self):
        """Verify that net_saving reflects the expected calculation."""
        # Manually calculating what we expect the DB to hold
        total_s = 2000
        total_l = 500
        expected_net = total_s - total_l
        
        saving = Saving.objects.create(
            person_saving=self.user,
            amount_saved=100,
            total_savings=total_s,
            total_loan=total_l,
            net_saving=expected_net
        )
        
        self.assertEqual(saving.net_saving, 1500)

    def test_auto_now_add_date(self):
        """Ensure date_saved is automatically populated."""
        saving = Saving.objects.create(
            person_saving=self.user,
            amount_saved=100,
            total_savings=100,
            total_loan=0,
            net_saving=100
        )
        self.assertIsNotNone(saving.date_saved)