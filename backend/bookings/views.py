from django.db import transaction
from django.utils import timezone
from datetime import datetime
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from shows.models import ShowSeat, Show
from .models import Booking, BookingSeat
from .serializers import BookingSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_booking(request):
    show_id = request.data.get('show_id')
    seat_ids = request.data.get('show_seat_ids', [])

    if not show_id or not seat_ids:
        return Response({"error": "show_id and show_seat_ids are required"}, status=400)

    now = timezone.now()

    # Reject booking for a show that has already started
    try:
        show_obj = Show.objects.get(id=show_id)
    except Show.DoesNotExist:
        return Response({"error": "Show not found"}, status=404)

    show_datetime = timezone.make_aware(datetime.combine(show_obj.date, show_obj.start_time))
    if show_datetime < now:
        return Response({"error": "Cannot book seats for a show that has already started"}, status=400)

    with transaction.atomic():
        show_seats = ShowSeat.objects.select_for_update().filter(
            id__in=seat_ids, show_id=show_id
        )

        if show_seats.count() != len(seat_ids):
            return Response({"error": "One or more seats not found for this show"}, status=400)

        invalid = []
        for s in show_seats:
            is_expired = s.hold_expires_at and s.hold_expires_at < now
            if s.status != 'HELD' or is_expired:
                invalid.append(f"{s.seat.row}{s.seat.number}")

        if invalid:
            return Response(
                {"error": f"Seats not properly held (hold missing/expired): {', '.join(invalid)}"},
                status=400
            )

        show = show_seats.first().show
        total_amount = show.price * len(seat_ids)

        booking = Booking.objects.create(
            user=request.user,
            show=show,
            total_amount=total_amount,
            status='PENDING'
        )

        for s in show_seats:
            BookingSeat.objects.create(booking=booking, show_seat=s)

    serializer = BookingSerializer(booking)
    return Response(serializer.data, status=201)


class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).order_by('-created_at')