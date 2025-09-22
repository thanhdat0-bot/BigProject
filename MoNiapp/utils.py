import random
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
from .models import EmailOTP
from datetime import date
from .models import Transaction
from django.db import models

def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_email(email, otp):
    subject = 'Mã xác thực OTP'
    message = f'Mã OTP của bạn là: {otp}'
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])

def create_and_send_otp(email, otp_type):
    otp = generate_otp()
    expires_at = timezone.now() + timedelta(minutes=10)
    EmailOTP.objects.create(
        email=email, code=otp, otp_type=otp_type, expires_at=expires_at
    )
    send_otp_email(email, otp)


def calculate_credit_score(user):
    total_spend = user.transactions.filter(type='expense').aggregate(models.Sum('amount'))['amount__sum'] or 0
    total_income = user.transactions.filter(type='income').aggregate(models.Sum('amount'))['amount__sum'] or 0
    account_age_months = max(1, (date.today() - user.created_date).days // 30)
    total_transactions = user.transactions.count()


    score = 0
    if total_income > 0:
        score += max(0, (1 - total_spend / (total_income + 1)) * 300)
    score += min(total_income / 1000000 * 400, 400)
    score += min(account_age_months * 10, 300)
    score += min(total_transactions * 2, 100)
    return round(score)