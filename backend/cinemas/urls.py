from django.urls import path
from .views import CityViewSet, TheatreViewSet, ScreenViewSet, SeatViewSet, build_seat_layout

router = DefaultRouter()
router.register('cities', CityViewSet)
router.register('theatres', TheatreViewSet)
router.register('screens', ScreenViewSet)
router.register('seats', SeatViewSet)

urlpatterns = router.urls + [
    path('screens/<int:screen_id>/build-layout/', build_seat_layout, name='build-seat-layout'),
]