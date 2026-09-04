from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    is_verifier = models.BooleanField(default=False)