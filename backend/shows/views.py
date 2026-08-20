from rest_framework.response import Response
from rest_framework import viewsets
from cinemas.views import IsAdminOrReadOnly
from .models import Show
from .serializers import ShowSerializer

from django.db import transaction
from django.utils import timezone
from datetime import timedelta, datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import ShowSeat
from .serializers import ShowSeatSerializer


class ShowViewSet(viewsets.ModelViewSet):
    queryset = Show.objects.all()
    serializer_class = ShowSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Show.objects.all()
        movie_id = self.request.query_params.get('movie')
        city_id = self.request.query_params.get('city')
        theatre_id = self.request.query_params.get('theatre')
        date = self.request.query_params.get('date')

        if movie_id:
            queryset = queryset.filter(movie_id=movie_id)
        if city_id:
            queryset = queryset.filter(screen__theatre__city_id=city_id)
        if theatre_id:
            queryset = queryset.filter(screen__theatre_id=theatre_id)
        if date:
            queryset = queryset.filter(date=date)

        return queryset

HOLD_DURATION_MINUTES = 5


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def show_seats(request, show_id):
    """List all seats for a show with current status (expired holds treated as available)."""
    now = timezone.now()
    seats = ShowSeat.objects.filter(show_id=show_id)
    data = []
    for s in seats:
        status = s.status
        if status == 'HELD' and s.hold_expires_at and s.hold_expires_at < now:
            status = 'AVAILABLE'
        serialized = ShowSeatSerializer(s).data
        serialized['status'] = status
        data.append(serialized)
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def hold_seats(request, show_id):
    """Hold one or more seats for a show. Handles concurrency with row locking."""
    seat_ids = request.data.get('seat_ids', [])
    if not seat_ids:
        return Response({"error": "seat_ids is required"}, status=400)

    now = timezone.now()

    # Reject holding seats for a show that has already started
    try:
        show = Show.objects.get(id=show_id)
    except Show.DoesNotExist:
        return Response({"error": "Show not found"}, status=404)

    show_datetime = timezone.make_aware(datetime.combine(show.date, show.start_time))
    if show_datetime < now:
        return Response({"error": "Cannot hold seats for a show that has already started"}, status=400)

    expires_at = now + timedelta(minutes=HOLD_DURATION_MINUTES)

    with transaction.atomic():
        show_seats = ShowSeat.objects.select_for_update().filter(
            show_id=show_id, seat_id__in=seat_ids
        )

        if show_seats.count() != len(seat_ids):
            return Response({"error": "One or more seats not found for this show"}, status=400)

        unavailable = []
        for s in show_seats:
            is_expired_hold = s.status == 'HELD' and s.hold_expires_at and s.hold_expires_at < now
            if s.status == 'BOOKED' or (s.status == 'HELD' and not is_expired_hold):
                unavailable.append(f"{s.seat.row}{s.seat.number}")

        if unavailable:
            return Response(
                {"error": f"Seats already unavailable: {', '.join(unavailable)}"},
                status=400
            )

        show_seats.update(status='HELD', hold_expires_at=expires_at)

    return Response({
        "message": "Seats held successfully",
        "expires_at": expires_at
    })