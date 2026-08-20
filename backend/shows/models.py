from django.db import models
from movies.models import Movie
from cinemas.models import Screen


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