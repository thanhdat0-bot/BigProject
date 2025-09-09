import random
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
from .models import EmailOTP

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