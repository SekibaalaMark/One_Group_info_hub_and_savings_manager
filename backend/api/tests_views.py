from django.urls import reverse
from django.core import mail
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

class UserRegistrationViewTest(APITestCase):

    def setUp(self):
        self.url = reverse('user-registration') # Ensure this matches your urls.py name
        self.valid_payload = {
            "username": "tester",
            "email": "tester@gmail.com",
            "password": "securepassword123",
            "password2": "securepassword123",
            "role": "general_user"
        }

    def test_registration_success_and_email_sent(self):
        """Verify successful registration creates a user and sends a verification email."""
        response = self.client.post(self.url, self.valid_payload, format='json')

        # 1. Check response status
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["message"], "User registered successfully. A confirmation code has been sent to your email.")

        # 2. Check Database
        user = User.objects.get(username="tester")
        self.assertFalse(user.is_verified)
        self.assertIsNotNone(user.confirmation_code)

        # 3. Check Email Outbox
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Verify Your Email")
        self.assertIn(user.confirmation_code, mail.outbox[0].body)
        self.assertEqual(mail.outbox[0].to, ["tester@gmail.com"])

    def test_registration_invalid_data(self):
        """Verify registration fails with incorrect data (e.g., non-gmail)."""
        invalid_payload = self.valid_payload.copy()
        invalid_payload["email"] = "tester@yahoo.com" # Should fail per serializer logic

        response = self.client.post(self.url, invalid_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Check that no user was created
        self.assertFalse(User.objects.filter(username="tester").exists())
        # Check no email was sent
        self.assertEqual(len(mail.outbox), 0)

    def test_registration_missing_fields(self):
        """Verify 400 error when required fields are missing."""
        response = self.client.post(self.url, {"username": "incomplete"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        
        
        



from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

class VerifyEmailCodeViewTest(APITestCase):

    def setUp(self):
        self.url = reverse('verify-email')  # Ensure this matches your urls.py name
        self.user = User.objects.create_user(
            username='verify_tester',
            email='verify@gmail.com',
            password='password123'
        )
        self.user.confirmation_code = "123456"
        self.user.is_verified = False
        self.user.save()

    def test_verification_success(self):
        """Verify that a correct email and code successfully verify the user."""
        payload = {
            "email": "verify@gmail.com",
            "confirmation_code": "123456"
        }
        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Email verified successfully. You can now log in.")

        # Refresh from DB and check state
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_verified)
        self.assertIsNone(self.user.confirmation_code)

    def test_incorrect_code_fails(self):
        """Verify that an incorrect code does not verify the user."""
        payload = {
            "email": "verify@gmail.com",
            "confirmation_code": "999999"  # Wrong code
        }
        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Invalid confirmation code.")
        
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_verified)

    def test_missing_fields_returns_400(self):
        """Verify that a request with missing data is rejected."""
        response = self.client.post(self.url, {"email": "verify@gmail.com"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Email and confirmation code are required", response.data["error"])

    def test_non_existent_user_returns_404(self):
        """Verify that an email not in the system returns 404."""
        payload = {
            "email": "ghost@gmail.com",
            "confirmation_code": "123456"
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)