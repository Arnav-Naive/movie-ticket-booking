from django.urls import path
from .views import my_wallet

urlpatterns = [
    path('wallet/', my_wallet, name='my-wallet'),
]