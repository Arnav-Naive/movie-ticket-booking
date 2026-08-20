from django.urls import path
from .views import create_booking, MyBookingsView

urlpatterns = [
    path('bookings/', create_booking, name='create-booking'),
    path('bookings/my/', MyBookingsView.as_view(), name='my-bookings'),
]