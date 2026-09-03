from rest_framework import serializers
from .models import Wallet, WalletTransaction


class WalletTransactionSerializer(serializers.ModelSerializer):
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)

    class Meta:
        model = WalletTransaction
        fields = ['id', 'amount', 'transaction_type', 'booking_reference', 'created_at']


class WalletSerializer(serializers.ModelSerializer):
    transactions = WalletTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Wallet
        fields = ['balance', 'transactions']