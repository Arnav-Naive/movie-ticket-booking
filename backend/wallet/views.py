from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Wallet
from .serializers import WalletSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_wallet(request):
    wallet, _ = Wallet.objects.get_or_create(user=request.user)
    return Response(WalletSerializer(wallet).data)