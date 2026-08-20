from django.db import models
from movies.models import Movie
from cinemas.models import Screen
from cinemas.models import Seat

from django.db.models.signals import post_save
from django.dispatch import receiver

class Show(models.Model):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='shows')
    screen = models.ForeignKey(Screen, on_delete=models.CASCADE, related_name='shows')
    date = models.DateField()
    start_time = models.TimeField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('screen', 'date', 'start_time')  # same screen can't have 2 shows at same time

    def __str__(self):
        return f"{self.movie.title} - {self.screen} - {self.date} {self.start_time}"


class ShowSeat(models.Model):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('HELD', 'Held'),
        ('BOOKED', 'Booked'),
    ]

    show = models.ForeignKey(Show, on_delete=models.CASCADE, related_name='show_seats')
    seat = models.ForeignKey(Seat, on_delete=models.CASCADE, related_name='show_seats')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='AVAILABLE')
    hold_expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('show', 'seat')

    def __str__(self):
        return f"{self.seat} - {self.show} - {self.status}"
    
@receiver(post_save, sender=Show)
def create_show_seats(sender, instance, created, **kwargs):
    if created:
        seats = instance.screen.seats.all()
        show_seats = [
            ShowSeat(show=instance, seat=seat, status='AVAILABLE')
            for seat in seats
        ]
        ShowSeat.objects.bulk_create(show_seats)