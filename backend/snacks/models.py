from django.db import models
from cinemas.models import Theatre


class Snack(models.Model):
    CATEGORY_CHOICES = [
        ('POPCORN', 'Popcorn'),
        ('BEVERAGE', 'Beverage'),
        ('SNACK', 'Snack'),
        ('COMBO', 'Combo'),
    ]

    theatre = models.ForeignKey(Theatre, on_delete=models.CASCADE, related_name='snacks', null=True, blank=True)
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default='SNACK')
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image = models.CharField(max_length=500, blank=True)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class BookingSnack(models.Model):
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='booking_snacks')
    snack = models.ForeignKey(Snack, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    total_price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.snack.name} ({self.booking.booking_reference})"