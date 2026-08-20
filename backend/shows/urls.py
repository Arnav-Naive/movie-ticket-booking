from rest_framework.routers import DefaultRouter
from .views import ShowViewSet

router = DefaultRouter()
router.register('shows', ShowViewSet)

urlpatterns = router.urls