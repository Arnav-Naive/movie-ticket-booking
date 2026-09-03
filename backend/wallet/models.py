from django.db import models
from django.conf import settings


class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.user.username} - ₹{self.balance}"


class WalletTransaction(models.Model):
    TYPE_CHOICES = [
        ('EARNED', 'Earned'),
        ('SPENT', 'Spent'),
        ('REFUNDED', 'Refunded'),
        ('REVERSED', 'Reversed'),
    ]
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True, related_name='wallet_transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_type} ₹{self.amount} - {self.wallet.user.username}"