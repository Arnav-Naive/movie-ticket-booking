from django.shortcuts import render

from rest_framework import viewsets
from cinemas.views import IsAdminOrReadOnly
from .models import Show
from .serializers import ShowSerializer


class ShowViewSet(viewsets.ModelViewSet):
    queryset = Show.objects.all()
    serializer_class = ShowSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Show.objects.all()
        movie_id = self.request.query_params.get('movie')
        city_id = self.request.query_params.get('city')
        theatre_id = self.request.query_params.get('theatre')
        date = self.request.query_params.get('date')

        if movie_id:
            queryset = queryset.filter(movie_id=movie_id)
        if city_id:
            queryset = queryset.filter(screen__theatre__city_id=city_id)
        if theatre_id:
            queryset = queryset.filter(screen__theatre_id=theatre_id)
        if date:
            queryset = queryset.filter(date=date)

        return queryset