from django.urls import path
from .views import create_booking, MyBookingsView, booking_ticket, verify_ticket, cancel_booking, pay_with_wallet, AdminBookingsView

urlpatterns = [
    path('bookings/', create_booking, name='create-booking'),
    path('bookings/my/', MyBookingsView.as_view(), name='my-bookings'),
    path('bookings/admin/all/', AdminBookingsView.as_view(), name='admin-bookings'),
    path('bookings/<int:booking_id>/ticket/', booking_ticket, name='booking-ticket'),
    path('bookings/verify-ticket/', verify_ticket, name='verify-ticket'),
    path('bookings/<int:booking_id>/cancel/', cancel_booking, name='cancel-booking'),
    path('bookings/<int:booking_id>/pay-with-wallet/', pay_with_wallet, name='pay-with-wallet'),
]