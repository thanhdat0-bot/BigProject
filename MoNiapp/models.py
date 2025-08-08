from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class BaseModel(models.Model):
    is_active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True



class User(AbstractUser,BaseModel):
    balance = models.FloatField(default=0.0)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.username


class Note(BaseModel):
    title = models.CharField(max_length=100)
    content = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')

    def __str__(self):
        return self.title


class Category(BaseModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories', null=True, blank=True)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ('user', 'name')


class Transaction(BaseModel):
    TRANSACTION_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]

    amount = models.FloatField()
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='transactions')
    notes = models.ManyToManyField(Note, blank=True, related_name='transactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.username} - {self.type} - {self.amount}"


class Reminder(BaseModel):
    title = models.CharField(max_length=100)
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reminders')
    remind_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title


class BudgetLimit(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budget_limits')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='budget_limits')
    amount_limit = models.FloatField()
    notes = models.ManyToManyField(Note, blank=True, related_name='budget_limits')
    month = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.category.name}: {self.amount_limit}"
