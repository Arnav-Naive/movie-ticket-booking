from django.utils import timezone
from django.db.models import Sum, Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from movies.models import Movie
from cinemas.models import Theatre
from shows.models import Show
from users.models import User
from bookings.models import Booking


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard(request):
    today = timezone.now().date()

    total_movies = Movie.objects.count()
    total_theatres = Theatre.objects.count()
    total_shows = Show.objects.count()
    total_users = User.objects.count()
    total_bookings = Booking.objects.filter(status='CONFIRMED').count()
    todays_bookings = Booking.objects.filter(status='CONFIRMED', created_at__date=today).count()

    total_revenue = Booking.objects.filter(status='CONFIRMED').aggregate(
        total=Sum('total_amount')
    )['total'] or 0

    top_movies = (
        Booking.objects.filter(status='CONFIRMED')
        .values('show__movie__title')
        .annotate(booking_count=Count('id'))
        .order_by('-booking_count')[:5]
    )

    return Response({
        "total_movies": total_movies,
        "total_theatres": total_theatres,
        "total_shows": total_shows,
        "total_users": total_users,
        "total_bookings": total_bookings,
        "todays_bookings": todays_bookings,
        "total_revenue": total_revenue,
        "top_movies": list(top_movies),
    })