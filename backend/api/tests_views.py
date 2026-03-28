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