from rest_framework import viewsets
from django.db.models import Q
from cinemas.views import IsAdminOrReadOnly
from .models import Snack
from .serializers import SnackSerializer


class SnackViewSet(viewsets.ModelViewSet):
    serializer_class = SnackSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Snack.objects.all()
        theatre_id = self.request.query_params.get('theatre')
        if theatre_id:
            queryset = queryset.filter(Q(theatre_id=theatre_id) | Q(theatre__isnull=True))
        if not (self.request.user and self.request.user.is_staff):
            queryset = queryset.filter(is_available=True)
        return queryset.distinct()