
from datetime import datetime, timedelta

from django.contrib.auth import authenticate
from django.shortcuts import render
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import permission_classes, api_view
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import viewsets, permissions, status, generics, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum
from django.db.models import Q
from six import raise_from
from yaml import serialize

from . import models
from .models import User,Category,Transaction,Note,Reminder,BudgetLimit
from .serializers import TransactionSerializer, NoteSerializer, ReminderSerializer, \
    BudgetlimitSerializer, CategorySerializer, RegisterSerializer, LoginSerializer, ChangePasswordSerializer, \
    UserUpdateSerializer, UserProfileSerializer, FinanceReportSerializer, WeeklySummarySerializer


class UserRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

class UserLoginView(GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data["username"]
            password = serializer.validated_data["password"]
            user = authenticate(username=username, password=password)
            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }, status=status.HTTP_200_OK)
            return Response({"detail": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(GenericAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({"detail": "User deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

class ChangePasswordView(GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        user = request.user
        if serializer.is_valid():
            old_password = serializer.validated_data["old_password"]
            new_password = serializer.validated_data["new_password"]
            if not user.check_password(old_password):
                return Response({"old_password": "Wrong password."}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()
            return Response({"detail": "Password updated successfully."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Category.objects.filter(
            Q(is_default=True) | Q(user=user),
            is_active=True
        )

    def perform_create(self, serializer):
        user = self.request.user
        is_admin = user.is_staff or user.is_superuser
        is_default = self.request.data.get('is_default', False)
        if is_admin and is_default:
            serializer.save(user=None, is_default=True)
        else:
            serializer.save(user=user, is_default=False)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def weekly_summary(request):
    user = request.user
    today = datetime.now()
    # Tuần trước: từ thứ 2 tuần trước đến chủ nhật tuần trước
    last_monday = today - timedelta(days=today.weekday() + 7)
    last_sunday = last_monday + timedelta(days=6)

    transactions = user.transactions.filter(
        transaction_date__date__gte=last_monday.date(),
        transaction_date__date__lte=last_sunday.date()
    )

    income = transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
    expense = transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0

    # Thống kê theo từng category
    categories = user.categories.all()
    category_stats = []
    for cat in categories:
        cat_expense = transactions.filter(type='expense', category=cat).aggregate(Sum('amount'))['amount__sum'] or 0
        cat_income = transactions.filter(type='income', category=cat).aggregate(Sum('amount'))['amount__sum'] or 0
        if cat_expense > 0 or cat_income > 0:
            category_stats.append({
                "category": cat.name,
                "expense": cat_expense,
                "income": cat_income,
            })
    # Sắp xếp category theo expense giảm dần, lấy top 3
    category_stats = sorted(category_stats, key=lambda x: x['expense'], reverse=True)[:3]

    result = {
        "week": f"{last_monday.date()} - {last_sunday.date()}",
        "total_income": income,
        "total_expense": expense,
        "top_categories": category_stats,
    }
    serializer = WeeklySummarySerializer(data=result)
    serializer.is_valid(raise_exception=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_report(request):
    month = request.GET.get('month')
    user = request.user

    today = datetime.now()
    if not month:
        year = today.year
        mon = today.month
    else:
        year,mon = map(int,month.split('-'))

    start = datetime(year,mon,1)
    if mon == 12:
        end = datetime(year+1,1,1)
    else:
        end = datetime(year,mon+1,1)

    transactions = user.transactions.filter(transaction_date__gte=start, transaction_date__lt=end)
    budget_limits = user.budget_limits.filter(month__year=year,month__month=mon)

    income = transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
    expense = transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
    balance = income - expense

    category_summary =[]
    categories = user.categories.all()
    for cat in categories:
        cat_income = transactions.filter(type ='income').aggregate(Sum('amount'))['amount__sum'] or 0
        cat_expense = transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
        category_summary.append({
            "category": cat.name,
            "expense": cat_expense,
            "income": cat_income,
        })

    budget_limit_exceeded = []
    for bl in budget_limits:
        expense_in_limit = transactions.filter(type='expense', category =bl.category).aggregate(Sum('amount'))['amount__sum'] or 0
        if expense_in_limit > bl.amount_limit:
            budget_limit_exceeded.append({
                "category" : bl.category.name,
                "limit" : bl.amount_limit,
                "actual_expense": expense_in_limit,
            })

    data ={
        "total_income":income,
        "toatal_expense":expense,
        "balance": balance,
        "category_summary": category_summary,
        "limit_exceeded": budget_limit_exceeded,
    }

    serializer = FinanceReportSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    return Response(serializer.data)

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.filter(is_active=True)
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)  # Tự gán user là user hiện tại

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.filter(is_active=True)
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ReminderViewSet(viewsets.ModelViewSet):
    queryset = Reminder.objects.filter(is_active=True)
    serializer_class = ReminderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reminder.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BudgetLimitViewSet(viewsets.ModelViewSet):
    queryset = BudgetLimit.objects.filter(is_active=True)
    serializer_class = BudgetlimitSerializer
    permission_classes = [permissions.IsAuthenticated]


    def get_queryset(self):
        return BudgetLimit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def finance_overview(request):
    month = request.GET.get('month')  # VD: "2025-08"
    user = request.user

    # Lọc theo tháng nếu có truyền
    if month:
        year, mon = map(int, month.split('-'))
        start = datetime(year, mon, 1)
        if mon == 12:
            end = datetime(year+1, 1, 1)
        else:
            end = datetime(year, mon+1, 1)
        transactions = user.transactions.filter(transaction_date__gte=start, transaction_date__lt=end)
        budget_limits = user.budget_limits.filter(month__year=year, month__month=mon)
    else:
        transactions = user.transactions.all()
        budget_limits = user.budget_limits.all()

    # Tổng thu, chi, số dư
    income = transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
    expense = transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
    balance = income - expense

    # Thống kê từng Category
    category_summary = []
    categories = user.categories.all()
    for cat in categories:
        cat_expense = transactions.filter(type='expense', category=cat).aggregate(Sum('amount'))['amount__sum'] or 0
        cat_income = transactions.filter(type='income', category=cat).aggregate(Sum('amount'))['amount__sum'] or 0
        category_summary.append({
            "category": cat.name,
            "expense": cat_expense,
            "income": cat_income,
        })

    # Kiểm tra vượt hạn mức
    budget_limit_exceeded = []
    for bl in budget_limits:
        expense_in_limit = transactions.filter(type='expense', category=bl.category).aggregate(Sum('amount'))['amount__sum'] or 0
        if expense_in_limit > bl.amount_limit:
            budget_limit_exceeded.append({
                "category": bl.category.name,
                "limit": bl.amount_limit,
                "actual_expense": expense_in_limit,
            })

    # Đóng gói dữ liệu trả về
    data = {
        "total_income": income,
        "total_expense": expense,
        "balance": balance,
        "category_summary": category_summary,
        "budget_limit_exceeded": budget_limit_exceeded,
    }
    serializer = FinanceReportSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    return Response(serializer.data)