from rest_framework import serializers
from .models import Snack, BookingSnack


class SnackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Snack
        fields = '__all__'


class BookingSnackSerializer(serializers.ModelSerializer):
    snack_name = serializers.CharField(source='snack.name', read_only=True)
    category = serializers.CharField(source='snack.category', read_only=True)

    class Meta:
        model = BookingSnack
        fields = ['id', 'snack', 'snack_name', 'category', 'quantity', 'unit_price', 'total_price']