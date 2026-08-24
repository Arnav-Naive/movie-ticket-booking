from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from movies.models import Movie
from cinemas.models import City, Theatre, Screen, Seat
from shows.models import Show
from bookings.models import Booking

User = get_user_model()


class PaymentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='payer1', password='pass12345')

        movie = Movie.objects.create(tmdb_id=3, title='Pay Test Movie')
        city = City.objects.create(name='PCity')
        theatre = Theatre.objects.create(name='PTheatre', address='addr', city=city)
        screen = Screen.objects.create(theatre=theatre, name='Screen 1')
        Seat.objects.create(screen=screen, row='A', number=1)

        future_time = timezone.now() + timedelta(days=1)
        self.show = Show.objects.create(
            movie=movie, screen=screen,
            date=future_time.date(), start_time=future_time.time(),
            price=300
        )

    def test_order_creation_fails_for_nonexistent_booking(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/payments/create-order/', {'booking_id': 9999})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_order_creation_fails_for_already_confirmed_booking(self):
        booking = Booking.objects.create(
            user=self.user, show=self.show, total_amount=300, status='CONFIRMED'
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/payments/create-order/', {'booking_id': booking.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_fails_with_invalid_signature(self):
        booking = Booking.objects.create(
            user=self.user, show=self.show, total_amount=300, status='PENDING'
        )
        from payments.models import Payment
        Payment.objects.create(booking=booking, amount=300, razorpay_order_id='order_fake123')

        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/payments/verify/', {
            'razorpay_order_id': 'order_fake123',
            'razorpay_payment_id': 'pay_fake123',
            'razorpay_signature': 'invalid_signature_xyz'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)