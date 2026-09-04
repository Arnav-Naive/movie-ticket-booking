from django.db import transaction
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from shows.models import ShowSeat, Show
from .models import Booking, BookingSeat
from .serializers import BookingSerializer
import qrcode
import io
import base64
from django.db.models import Sum
from decimal import Decimal
from snacks.models import Snack, BookingSnack
from rest_framework.permissions import BasePermission


class IsAdminOrVerifier(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_verifier))

CONVENIENCE_FEE = Decimal('30.00')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_booking(request):
    show_id = request.data.get('show_id')
    seat_ids = request.data.get('show_seat_ids', [])
    snack_items = request.data.get('snacks', [])  # [{"snack_id": 1, "quantity": 2}, ...]

    if not show_id or not seat_ids:
        return Response({"error": "show_id and show_seat_ids are required"}, status=400)

    now = timezone.now()

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
        ticket_amount = show.price * len(seat_ids)

        # Validate and price snacks from the DB — never trust frontend-supplied prices
        snack_lines = []
        snack_total = Decimal('0.00')
        for item in snack_items:
            snack_id = item.get('snack_id')
            quantity = item.get('quantity', 0)
            if not snack_id or quantity < 1:
                continue
            try:
                snack = Snack.objects.get(id=snack_id, is_available=True)
            except Snack.DoesNotExist:
                return Response({"error": f"Snack {snack_id} not found or unavailable"}, status=400)
            line_total = snack.price * quantity
            snack_total += line_total
            snack_lines.append((snack, quantity, line_total))

        total_amount = ticket_amount + snack_total + CONVENIENCE_FEE

        booking = Booking.objects.create(
            user=request.user,
            show=show,
            total_amount=total_amount,
            status='PENDING'
        )

        for s in show_seats:
            BookingSeat.objects.create(booking=booking, show_seat=s)

        for snack, quantity, line_total in snack_lines:
            BookingSnack.objects.create(
                booking=booking, snack=snack, quantity=quantity,
                unit_price=snack.price, total_price=line_total
            )

    serializer = BookingSerializer(booking)
    return Response(serializer.data, status=201)


class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).order_by('-created_at')
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def booking_ticket(request, booking_id):
    """Get full ticket details with QR code for a confirmed booking."""
    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=404)

    if booking.status != 'CONFIRMED':
        return Response({"error": "Ticket only available for confirmed bookings"}, status=400)

    # Generate QR code encoding the verification token (not the raw booking ID)
    qr = qrcode.make(booking.verification_token)
    buffer = io.BytesIO()
    qr.save(buffer, format='PNG')
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()

    serializer = BookingSerializer(booking)
    data = serializer.data
    data['qr_code'] = f"data:image/png;base64,{qr_base64}"

    return Response(data)

# verification endpoint
@api_view(['POST'])
@permission_classes([IsAdminOrVerifier])
def verify_ticket(request):
    token = request.data.get('token')
    if not token:
        return Response({"error": "token is required"}, status=400)

    try:
        booking = Booking.objects.get(verification_token=token)
    except Booking.DoesNotExist:
        return Response({"valid": False, "reason": "Ticket not found"}, status=404)

    if booking.status != 'CONFIRMED':
        return Response({"valid": False, "reason": f"Booking status is {booking.status}, not CONFIRMED"})

    show_datetime = timezone.make_aware(datetime.combine(booking.show.date, booking.show.start_time))
    if show_datetime < timezone.now() - timedelta(hours=3):
        return Response({"valid": False, "reason": "Show has already ended"})

    return Response({
        "valid": True,
        "booking_reference": booking.booking_reference,
        "movie": booking.show.movie.title,
        "seats": [f"{bs.show_seat.seat.row}{bs.show_seat.seat.number}" for bs in booking.booking_seats.all()],
    })
   
# Booking Cancellation + Release Seats    
CANCELLATION_DEADLINE_MINUTES = 30


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_booking(request, booking_id):
    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=404)

    if booking.status != 'CONFIRMED':
        return Response({"error": f"Cannot cancel a booking with status {booking.status}"}, status=400)

    show_datetime = timezone.make_aware(datetime.combine(booking.show.date, booking.show.start_time))
    deadline = show_datetime - timedelta(minutes=CANCELLATION_DEADLINE_MINUTES)

    if timezone.now() > deadline:
        return Response({"error": "Cancellation window has passed (must cancel 30+ minutes before showtime)"}, status=400)

    with transaction.atomic():
        booking.status = 'CANCELLED'
        booking.save()

        show_seat_ids = booking.booking_seats.values_list('show_seat_id', flat=True)
        ShowSeat.objects.filter(id__in=show_seat_ids).update(status='AVAILABLE', hold_expires_at=None)

        from wallet.models import Wallet, WalletTransaction
        wallet, _ = Wallet.objects.get_or_create(user=booking.user)

        earned = booking.wallet_transactions.filter(transaction_type='EARNED').aggregate(total=Sum('amount'))['total'] or 0
        if earned:
            reverse_amount = min(earned, wallet.balance)
            wallet.balance -= reverse_amount
            WalletTransaction.objects.create(wallet=wallet, booking=booking, amount=reverse_amount, transaction_type='REVERSED')

        spent = booking.wallet_transactions.filter(transaction_type='SPENT').aggregate(total=Sum('amount'))['total'] or 0
        if spent:
            wallet.balance += spent
            WalletTransaction.objects.create(wallet=wallet, booking=booking, amount=spent, transaction_type='REFUNDED')

        wallet.save()

    return Response({"message": "Booking cancelled successfully", "booking_reference": booking.booking_reference})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pay_with_wallet(request, booking_id):
    from wallet.models import Wallet, WalletTransaction

    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=404)

    if booking.status != 'PENDING':
        return Response({"error": "Booking is not in a payable state"}, status=400)

    wallet, _ = Wallet.objects.get_or_create(user=request.user)
    if wallet.balance < booking.total_amount:
        return Response({"error": "Insufficient CineRP balance"}, status=400)

    with transaction.atomic():
        wallet.balance -= booking.total_amount
        wallet.save()
        WalletTransaction.objects.create(wallet=wallet, booking=booking, amount=booking.total_amount, transaction_type='SPENT')

        booking.status = 'CONFIRMED'
        booking.save()

        show_seat_ids = booking.booking_seats.values_list('show_seat_id', flat=True)
        ShowSeat.objects.filter(id__in=show_seat_ids).update(status='BOOKED', hold_expires_at=None)

    return Response({"message": "Booking confirmed using CineRP", "booking_reference": booking.booking_reference})

class AdminBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Booking.objects.all().order_by('-created_at')
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(booking_reference__icontains=search)
        return queryset