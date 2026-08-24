from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'

    def test_valid_register(self):
        response = self.client.post(self.register_url, {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_duplicate_username_register(self):
        User.objects.create_user(username='dupuser', password='pass12345')
        response = self.client.post(self.register_url, {
            'username': 'dupuser',
            'email': 'dup@example.com',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_login(self):
        User.objects.create_user(username='loginuser', password='testpass123')
        response = self.client.post(self.login_url, {
            'username': 'loginuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_invalid_password_login(self):
        User.objects.create_user(username='loginuser2', password='correctpass123')
        response = self.client.post(self.login_url, {
            'username': 'loginuser2',
            'password': 'wrongpass'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)