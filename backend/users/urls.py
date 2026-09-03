from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, MeView, AdminUserListView, toggle_user_active

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('admin/list/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/<int:user_id>/toggle-active/', toggle_user_active, name='toggle-user-active'),
]