from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import User,Category,Transaction,Note,Reminder,BudgetLimit
from .serializers import UserSerializer, TransactionSerializer, NoteSerializer, ReminderSerializer, \
    BudgetlimitSerializer, CategorySerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.filter(is_active=True)
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.filter(is_active=True)
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

class ReminderViewSet(viewsets.ModelViewSet):
    queryset = Reminder.objects.filter(is_active=True)
    serializer_class = ReminderSerializer
    permission_classes = [permissions.IsAuthenticated]

class BudgetLimitViewSet(viewsets.ModelViewSet):
    queryset = BudgetLimit.objects.filter(is_active=True)
    serializer_class = BudgetlimitSerializer
    permission_classes = [permissions.IsAuthenticated]
