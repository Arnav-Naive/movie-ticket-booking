from rest_framework import serializers
from .models import Booking, BookingSeat
from snacks.serializers import BookingSnackSerializer


class BookingSeatSerializer(serializers.ModelSerializer):
    seat_row = serializers.CharField(source='show_seat.seat.row', read_only=True)
    seat_number = serializers.IntegerField(source='show_seat.seat.number', read_only=True)

    class Meta:
        model = BookingSeat
        fields = ['id', 'show_seat', 'seat_row', 'seat_number']


class BookingSerializer(serializers.ModelSerializer):
    booking_seats = BookingSeatSerializer(many=True, read_only=True)
    booking_snacks = BookingSnackSerializer(many=True, read_only=True)
    movie_title = serializers.CharField(source='show.movie.title', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'booking_reference', 'user', 'username', 'show', 'movie_title', 'total_amount', 'status', 'created_at', 'booking_seats', 'booking_snacks']
        read_only_fields = ['user', 'total_amount', 'status', 'booking_reference']