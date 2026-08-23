import razorpay
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from bookings.models import Booking
from shows.models import ShowSeat
from .models import Payment
from .razorpay_client import client


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    booking_id = request.data.get('booking_id')

    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=404)

    if booking.status != 'PENDING':
        return Response({"error": "Booking is not in a payable state"}, status=400)

    # Amount must be in paise (smallest currency unit) — Razorpay requirement
    amount_paise = int(booking.total_amount * 100)

    razorpay_order = client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "payment_capture": 1,
    })

    payment, created = Payment.objects.update_or_create(
        booking=booking,
        defaults={
            "amount": booking.total_amount,
            "currency": "INR",
            "razorpay_order_id": razorpay_order['id'],
            "status": "CREATED",
        }
    )

    return Response({
        "order_id": razorpay_order['id'],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": client.auth[0],
        "booking_reference": booking.booking_reference,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    razorpay_order_id = request.data.get('razorpay_order_id')
    razorpay_payment_id = request.data.get('razorpay_payment_id')
    razorpay_signature = request.data.get('razorpay_signature')

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return Response({"error": "Missing payment verification fields"}, status=400)

    try:
        payment = Payment.objects.get(razorpay_order_id=razorpay_order_id, booking__user=request.user)
    except Payment.DoesNotExist:
        return Response({"error": "Payment record not found"}, status=404)

    params_dict = {
        'razorpay_order_id': razorpay_order_id,
        'razorpay_payment_id': razorpay_payment_id,
        'razorpay_signature': razorpay_signature,
    }

    try:
        client.utility.verify_payment_signature(params_dict)
    except razorpay.errors.SignatureVerificationError:
        payment.status = 'FAILED'
        payment.save()
        return Response({"error": "Payment verification failed"}, status=400)

    # Signature valid — confirm booking and mark seats as booked
    payment.razorpay_payment_id = razorpay_payment_id
    payment.razorpay_signature = razorpay_signature
    payment.status = 'SUCCESS'
    payment.save()

    booking = payment.booking
    booking.status = 'CONFIRMED'
    booking.save()

    show_seat_ids = booking.booking_seats.values_list('show_seat_id', flat=True)
    ShowSeat.objects.filter(id__in=show_seat_ids).update(status='BOOKED', hold_expires_at=None)

    return Response({"message": "Payment verified, booking confirmed", "booking_reference": booking.booking_reference})