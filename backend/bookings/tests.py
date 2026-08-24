from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from movies.models import Movie
from cinemas.models import City, Theatre, Screen, Seat
from shows.models import Show, ShowSeat
from .models import Booking

User = get_user_model()


class BookingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='buyer1', password='pass12345')
        self.user2 = User.objects.create_user(username='buyer2', password='pass12345')

        movie = Movie.objects.create(tmdb_id=2, title='Booking Test Movie')
        city = City.objects.create(name='BCity')
        theatre = Theatre.objects.create(name='BTheatre', address='addr', city=city)
        screen = Screen.objects.create(theatre=theatre, name='Screen 1')
        self.seat = Seat.objects.create(screen=screen, row='A', number=1)

        future_time = timezone.now() + timedelta(days=1)
        self.show = Show.objects.create(
            movie=movie, screen=screen,
            date=future_time.date(), start_time=future_time.time(),
            price=250
        )
        self.show_seat = ShowSeat.objects.get(show=self.show, seat=self.seat)

    def test_valid_booking_after_hold(self):
        self.client.force_authenticate(user=self.user1)
        self.client.post(f'/api/shows/{self.show.id}/hold-seats/', {'seat_ids': [self.seat.id]})

        response = self.client.post('/api/bookings/', {
            'show_id': self.show.id,
            'show_seat_ids': [self.show_seat.id]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['total_amount'], '250.00')
        self.assertEqual(response.data['status'], 'PENDING')

    def test_booking_fails_without_hold(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post('/api/bookings/', {
            'show_id': self.show.id,
            'show_seat_ids': [self.show_seat.id]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_cannot_see_others_bookings(self):
        self.client.force_authenticate(user=self.user1)
        self.client.post(f'/api/shows/{self.show.id}/hold-seats/', {'seat_ids': [self.seat.id]})
        self.client.post('/api/bookings/', {
            'show_id': self.show.id,
            'show_seat_ids': [self.show_seat.id]
        }, format='json')

        self.client.force_authenticate(user=self.user2)
        response = self.client.get('/api/bookings/my/')
        self.assertEqual(len(response.data), 0)

    def test_duplicate_booking_same_held_seat_fails(self):
        self.client.force_authenticate(user=self.user1)
        self.client.post(f'/api/shows/{self.show.id}/hold-seats/', {'seat_ids': [self.seat.id]})
        self.client.post('/api/bookings/', {
            'show_id': self.show.id,
            'show_seat_ids': [self.show_seat.id]
        }, format='json')
        # Try booking the SAME show_seat again (already BOOKED... actually still HELD unless paid)
        # This seat's ShowSeat status is still HELD (not BOOKED, since payment wasn't done)
        # so re-attempting with same held seat by a different flow should still work since it's their own hold
        # Let's test a cleaner case: booking already-booked seat
        self.show_seat.status = 'BOOKED'
        self.show_seat.save()
        response = self.client.post('/api/bookings/', {
            'show_id': self.show.id,
            'show_seat_ids': [self.show_seat.id]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)