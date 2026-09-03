from django.core.management.base import BaseCommand
from movies.models import Movie
from movies.tmdb_service import get_movie_details, extract_cast_and_trailer


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        movies = Movie.objects.filter(cast__isnull=True) | Movie.objects.filter(cast='')
        count = 0
        for m in movies.distinct():
            try:
                data = get_movie_details(m.tmdb_id)
                cast, trailer_key = extract_cast_and_trailer(data)
                m.cast = cast
                m.trailer_key = trailer_key
                m.save()
                count += 1
            except Exception as e:
                self.stdout.write(f"Skipped {m.title}: {e}")
        self.stdout.write(f"Backfilled {count} movies")