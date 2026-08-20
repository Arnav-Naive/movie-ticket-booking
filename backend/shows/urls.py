from rest_framework.routers import DefaultRouter
from .views import ShowViewSet

from django.urls import path
from .views import show_seats, hold_seats

router = DefaultRouter()
router.register('shows', ShowViewSet)


urlpatterns = router.urls + [
    path('shows/<int:show_id>/seats/', show_seats, name='show-seats'),
    path('shows/<int:show_id>/hold-seats/', hold_seats, name='hold-seats'),
]