from django.db import models


class City(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Theatre(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=500)
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='theatres')
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.city.name})"


class Screen(models.Model):
    theatre = models.ForeignKey(Theatre, on_delete=models.CASCADE, related_name='screens')
    name = models.CharField(max_length=100)  # e.g. "Screen 1"

    def __str__(self):
        return f"{self.name} - {self.theatre.name}"


class Seat(models.Model):
    SEAT_TYPES = [
        ('REGULAR', 'Regular'),
        ('PREMIUM', 'Premium'),
    ]

    screen = models.ForeignKey(Screen, on_delete=models.CASCADE, related_name='seats')
    row = models.CharField(max_length=2)      # e.g. "A", "B"
    number = models.IntegerField()             # e.g. 1, 2, 3
    seat_type = models.CharField(max_length=10, choices=SEAT_TYPES, default='REGULAR')

    class Meta:
        unique_together = ('screen', 'row', 'number')  # same seat can't repeat on a screen

    def __str__(self):
        return f"{self.row}{self.number} - {self.screen}"