from rest_framework import serializers
from .models import Show


class ShowSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source='movie.title', read_only=True)
    theatre_name = serializers.CharField(source='screen.theatre.name', read_only=True)
    screen_name = serializers.CharField(source='screen.name', read_only=True)

    class Meta:
        model = Show
        fields = '__all__'