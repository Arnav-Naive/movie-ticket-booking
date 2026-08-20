from rest_framework.routers import DefaultRouter
from .views import CityViewSet, TheatreViewSet, ScreenViewSet, SeatViewSet

router = DefaultRouter()
router.register('cities', CityViewSet)
router.register('theatres', TheatreViewSet)
router.register('screens', ScreenViewSet)
router.register('seats', SeatViewSet)

urlpatterns = router.urls