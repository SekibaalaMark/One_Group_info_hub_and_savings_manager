# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLES = [
        ("sports_manger", "Sports Manager"),
        ("general_user", "General"),
        ("Treasurer", "Treasurer")
    ]
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLES)
    #is_active = models.BooleanField(default=False)
    confirmation_code = models.CharField(max_length=6, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    def __str__(self):
        return self.username



class Saving(models.Model):
    amount_saved = models.IntegerField()
    person_saving = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="savings")
    date_saved = models.DateTimeField(auto_now_add=True)
    total_savings = models.IntegerField()
    total_loan = models.IntegerField()
    net_saving = models.IntegerField()

    def __str__(self):
        return f"{self.person_saving.username} saved {self.amount_saved}"


class Loan(models.Model):
    amount_loaned = models.IntegerField()
    person_loaning = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="loans")
    date_loaned = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.person_loaning.username} loaned {self.amount_loaned}"
