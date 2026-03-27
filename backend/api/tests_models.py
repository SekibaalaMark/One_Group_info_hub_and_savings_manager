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