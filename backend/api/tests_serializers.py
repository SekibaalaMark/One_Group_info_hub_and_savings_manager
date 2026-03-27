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