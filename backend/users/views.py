from django.shortcuts import render

from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from .serializers import RegisterSerializer, AdminUserSerializer
from django.contrib.auth import get_user_model

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "is_staff": request.user.is_staff,
        })

class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    queryset = User.objects.all().order_by('-date_joined')

User = get_user_model()

@api_view(['POST'])
@permission_classes([IsAdminUser])
def toggle_user_active(request, user_id):
    try:
        target = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    if target.is_staff:
        return Response({"error": "Cannot deactivate an admin account"}, status=400)
    target.is_active = not target.is_active
    target.save()
    return Response({"id": target.id, "is_active": target.is_active})