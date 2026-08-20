from rest_framework import serializers
from .models import Show

from .models import ShowSeat

class ShowSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source='movie.title', read_only=True)
    theatre_name = serializers.CharField(source='screen.theatre.name', read_only=True)
    screen_name = serializers.CharField(source='screen.name', read_only=True)

    class Meta:
        model = Show
        fields = '__all__'

class ShowSeatSerializer(serializers.ModelSerializer):
    seat_row = serializers.CharField(source='seat.row', read_only=True)
    seat_number = serializers.IntegerField(source='seat.number', read_only=True)
    seat_type = serializers.CharField(source='seat.seat_type', read_only=True)

    class Meta:
        model = ShowSeat
        fields = ['id', 'show', 'seat', 'seat_row', 'seat_number', 'seat_type', 'status', 'hold_expires_at']