from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Movie

User = get_user_model()


class MovieTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(username='admin1', password='adminpass123')
        self.normal_user = User.objects.create_user(username='user1', password='userpass123')
        self.movie = Movie.objects.create(
            tmdb_id=9999, title='Test Movie', overview='A test movie'
        )

    def test_list_movies_public(self):
        response = self.client.get('/api/movies/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_movie_detail_public(self):
        response = self.client.get(f'/api/movies/{self.movie.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Movie')

    def test_tmdb_search_requires_admin(self):
        self.client.force_authenticate(user=self.normal_user)
        response = self.client.get('/api/movies/tmdb/search/?query=avengers')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)