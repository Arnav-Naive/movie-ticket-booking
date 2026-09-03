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
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def release_seats(request, show_id):
    """Manually release held seats (e.g. user navigates away before booking)."""
    seat_ids = request.data.get('seat_ids', [])
    if not seat_ids:
        return Response({"error": "seat_ids is required"}, status=400)

    with transaction.atomic():
        show_seats = ShowSeat.objects.select_for_update().filter(
            show_id=show_id, seat_id__in=seat_ids, status='HELD'
        )
        show_seats.update(status='AVAILABLE', hold_expires_at=None)

    return Response({"message": "Seats released successfully"})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def find_seats(request, show_id):
    count = request.data.get('count')
    if not isinstance(count, int) or count < 1:
        return Response({"error": "count must be a positive integer"}, status=400)

    now = timezone.now()
    seats = ShowSeat.objects.filter(show_id=show_id).select_related('seat')

    def is_available(s):
        if s.status == 'AVAILABLE':
            return True
        return s.status == 'HELD' and s.hold_expires_at and s.hold_expires_at < now

    rows = {}
    for s in seats:
        rows.setdefault(s.seat.row, []).append(s)

    # Look for a contiguous available block within a single row
    for row_seats in rows.values():
        row_seats.sort(key=lambda s: s.seat.number)
        block = []
        for s in row_seats:
            if is_available(s):
                block.append(s)
                if len(block) == count:
                    return Response({
                        "recommended_seats": [f"{b.seat.row}{b.seat.number}" for b in block],
                        "show_seat_ids": [b.id for b in block],
                    })
            else:
                block = []

    # No contiguous block anywhere — fall back to any available seats
    all_available = [s for row_seats in rows.values() for s in row_seats if is_available(s)]
    if len(all_available) >= count:
        chosen = all_available[:count]
        return Response({
            "message": f"No {count}-seat contiguous block available, showing best alternative",
            "recommended_seats": [f"{c.seat.row}{c.seat.number}" for c in chosen],
            "show_seat_ids": [c.id for c in chosen],
        })

    return Response({"error": "Not enough available seats for this show"}, status=400)