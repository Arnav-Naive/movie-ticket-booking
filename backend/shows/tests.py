from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from movies.models import Movie
from cinemas.models import City, Theatre, Screen, Seat
from .models import Show, ShowSeat

User = get_user_model()


class SeatHoldTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='user1', password='pass12345')
        self.user2 = User.objects.create_user(username='user2', password='pass12345')

        movie = Movie.objects.create(tmdb_id=1, title='Test Movie')
        city = City.objects.create(name='TestCity')
        theatre = Theatre.objects.create(name='TestTheatre', address='addr', city=city)
        screen = Screen.objects.create(theatre=theatre, name='Screen 1')
        self.seat = Seat.objects.create(screen=screen, row='A', number=1)

        future_time = (timezone.now() + timedelta(days=1))
        self.show = Show.objects.create(
            movie=movie, screen=screen,
            date=future_time.date(), start_time=future_time.time(),
            price=200
        )
        # Signal auto-creates ShowSeat, but let's confirm
        self.show_seat = ShowSeat.objects.get(show=self.show, seat=self.seat)

    def test_available_seat_can_be_held(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            f'/api/shows/{self.show.id}/hold-seats/',
            {'seat_ids': [self.seat.id]},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.show_seat.refresh_from_db()
        self.assertEqual(self.show_seat.status, 'HELD')

    def test_already_held_seat_cannot_be_held_again(self):
        self.show_seat.status = 'HELD'
        self.show_seat.hold_expires_at = timezone.now() + timedelta(minutes=5)
        self.show_seat.save()

        self.client.force_authenticate(user=self.user2)
        response = self.client.post(
            f'/api/shows/{self.show.id}/hold-seats/',
            {'seat_ids': [self.seat.id]},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_expired_hold_can_be_held_by_another_user(self):
        self.show_seat.status = 'HELD'
        self.show_seat.hold_expires_at = timezone.now() - timedelta(minutes=1)
        self.show_seat.save()


        self.client.force_authenticate(user=self.user2)
        response = self.client.post(
            f'/api/shows/{self.show.id}/hold-seats/',
            {'seat_ids': [self.seat.id]},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_booked_seat_cannot_be_held(self):
        self.show_seat.status = 'BOOKED'
        self.show_seat.save()

        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            f'/api/shows/{self.show.id}/hold-seats/',
            {'seat_ids': [self.seat.id]},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)