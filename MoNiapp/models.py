from cloudinary.models import CloudinaryField
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class BaseModel(models.Model):
    is_active = models.BooleanField(default=True)
    created_date = models.DateField(auto_now_add=True)
    updated_date = models.DateField(auto_now=True)

    class Meta:
        abstract = True



class User(AbstractUser,BaseModel):
    avatar = CloudinaryField(null=True, blank=True, folder='user_avatar')
    email = models.EmailField(unique=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('male', 'Nam'), ('female', 'Nữ'), ('other', 'Khác')], null=True, blank=True)
    phone = models.CharField(max_length=15, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.username

class EmailOTP(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=10)
    otp_type = models.CharField(max_length=20, choices=(
        ('register', 'Register'),
        ('forgot_password', 'Forgot Password'),
    ))
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.expires_at

class Note(BaseModel):
    title = models.CharField(max_length=100)
    content = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    is_pinned = models.BooleanField(default=False)

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
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, related_name='transactions')
    note = models.CharField(max_length=255, blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_date = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.user.username} - {self.type} - {self.amount}"


class Reminder(BaseModel):
    title = models.CharField(max_length=100)
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reminders')
    remind_at = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.title


class BudgetLimit(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budget_limits')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='budget_limits')
    amount_limit = models.FloatField()
    note = models.CharField(max_length=255, blank=True, null=True)
    month = models.DateField(null=True, blank=True)
    warning_threshold = models.FloatField(default=100)

    def __str__(self):
        return f"{self.user.username} - {self.category.name}: {self.amount_limit}"

    class Meta:
        unique_together = ('user', 'category', 'month')
