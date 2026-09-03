from django.shortcuts import render

from rest_framework import viewsets, permissions
from .models import City, Theatre, Screen, Seat
from .serializers import CitySerializer, TheatreSerializer, ScreenSerializer, SeatSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:  # GET, HEAD, OPTIONS
            return True
        return request.user and request.user.is_staff


class CityViewSet(viewsets.ModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    permission_classes = [IsAdminOrReadOnly]


class TheatreViewSet(viewsets.ModelViewSet):
    queryset = Theatre.objects.all()
    serializer_class = TheatreSerializer
    permission_classes = [IsAdminOrReadOnly]


class ScreenViewSet(viewsets.ModelViewSet):
    queryset = Screen.objects.all()
    serializer_class = ScreenSerializer
    permission_classes = [IsAdminOrReadOnly]


class SeatViewSet(viewsets.ModelViewSet):
    queryset = Seat.objects.all()
    serializer_class = SeatSerializer
    permission_classes = [IsAdminOrReadOnly]
    
@api_view(['POST'])
@permission_classes([IsAdminUser])
def build_seat_layout(request, screen_id):
    try:
        screen = Screen.objects.get(id=screen_id)
    except Screen.DoesNotExist:
        return Response({"error": "Screen not found"}, status=404)

    layout = request.data.get('layout', [])
    if not layout:
        return Response({"error": "layout is required, e.g. [{'row':'A','count':10,'seat_type':'REGULAR'}]"}, status=400)

    created, skipped = 0, 0
    for row_def in layout:
        row = row_def.get('row')
        count = row_def.get('count')
        seat_type = row_def.get('seat_type', 'REGULAR')
        if not row or not count:
            continue
        for number in range(1, count + 1):
            _, was_created = Seat.objects.get_or_create(
                screen=screen, row=row, number=number,
                defaults={'seat_type': seat_type}
            )
            created += 1 if was_created else 0
            skipped += 0 if was_created else 1

    return Response({"message": f"{created} seats created, {skipped} already existed"})