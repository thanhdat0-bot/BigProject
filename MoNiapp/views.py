from calendar import month
from datetime import datetime, timedelta
from http.client import responses
from logging import warning

from django.contrib.auth import authenticate
from django.shortcuts import render
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import permission_classes, api_view
from rest_framework.exceptions import ValidationError
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import viewsets, permissions, status, generics, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum
from django.db.models import Q
from six import raise_from
from unicodedata import category
from yaml import serialize, warnings

from . import models
from .models import User, Category, Transaction, Note, Reminder, BudgetLimit
from .serializers import TransactionSerializer, NoteSerializer, ReminderSerializer, \
    BudgetlimitSerializer, CategorySerializer, RegisterSerializer, LoginSerializer, ChangePasswordSerializer, \
    FinanceReportSerializer, WeeklySummarySerializer, UserSerializer


class UserRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]


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
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
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
    this_monday = today - timedelta(days=today.weekday())
    this_sunday = this_monday + timedelta(days=6)

    transactions = user.transactions.filter(
        transaction_date__date__gte=this_monday.date(),
        transaction_date__date__lte=this_sunday.date()
    )

    income = transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
    expense = transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0

    category_ids = transactions.values_list("category", flat=True).distinct()
    categories = Category.objects.filter(
        id__in=category_ids
    ).filter(
        Q(is_default=True) | Q(user=user)
    )
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

    category_stats = sorted(category_stats, key=lambda x: x['expense'], reverse=True)[:3]

    result = {
        "week": f"{this_monday.date()} - {this_sunday.date()}",
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
        year, mon = map(int, month.split('-'))

    start = datetime(year, mon, 1)
    if mon == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, mon + 1, 1)

    transactions = user.transactions.filter(transaction_date__gte=start, transaction_date__lt=end)
    budget_limits = user.budget_limits.filter(month__year=year, month__month=mon)

    income = transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
    expense = transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
    balance = income - expense

    category_summary = []
    categories = user.categories.all()  # Chỉ lấy các category thuộc user này

    for cat in categories:
        cat_income = transactions.filter(type='income', category=cat).aggregate(Sum('amount'))['amount__sum'] or 0
        cat_expense = transactions.filter(type='expense', category=cat).aggregate(Sum('amount'))['amount__sum'] or 0
        category_summary.append({
            "category": cat.name,
            "expense": cat_expense,
            "income": cat_income,
        })

    budget_limit_exceeded = []
    for bl in budget_limits:
        # Chỉ xét hạn mức với category hợp lệ (thuộc user hoặc mặc định)
        if bl.category.is_default or bl.category.user == user:
            expense_in_limit = transactions.filter(type='expense', category=bl.category).aggregate(Sum('amount'))['amount__sum'] or 0
            if expense_in_limit > bl.amount_limit:
                budget_limit_exceeded.append({
                    "category": bl.category.name,
                    "limit": bl.amount_limit,
                    "actual_expense": expense_in_limit,
                })

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


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.filter(is_active=True)
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        transaction = serializer.save(user=self.request.user)

        user = self.request.user
        category = serializer.validated_data.get("category")

        if category and not (category.is_default or category.user == user):
            raise ValidationError("Bạn không được phép sử dụng danh mục này.")
        transaction = serializer.save(user=user)

        if category and transaction.type == 'expense':
            month_start = transaction.transaction_date.replace(day=1)

            budget_limit = BudgetLimit.objects.filter(
                user=user, category=category, month=month_start.date()
            ).first()

            warning = None
            if budget_limit:
                mon = month_start.month
                year = month_start.year
                if mon == 12:
                    next_month = month_start.replace(year=year + 1, month=1)
                else:
                    next_month = month_start.replace(month=mon + 1)
                expense = Transaction.objects.filter(
                    user=user, category=category, type='expense',
                    transaction_date__gte=month_start,
                    transaction_date__lt=next_month
                ).aggregate(Sum('amount'))['amount__sum'] or 0
                percent = expense / budget_limit.amount_limit * 100 if budget_limit.amount_limit > 0 else 0
                if percent >= budget_limit.warning_threshold:
                    warning = f"chi tiêu danh mục {category.name} đã đạt {percent:.1f}% hạn mức!"
            self.extra_warning = warning

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        warning = getattr(self, "extra_warning", None)
        if warning:
            data = response.data.copy()
            data['budget_warning'] = warning
            response.data = data
        return response

    def perform_update(self, serializer):
        user = self.request.user
        category = serializer.validated_data.get("category")
        if category and not (category.is_default or category.user == user):
            raise ValidationError("Bạn không được phép sử dụng danh mục này.")
        serializer.save(user=user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_transactions(request):
    user = request.user
    category_id = request.GET.get('category_id')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    min_amount = request.GET.get('min_amount')
    max_amount = request.GET.get('max_amount')

    queryset = user.transactions.all()

    if category_id:
        queryset = queryset.filter(category_id=category_id)
    if start_date:
        queryset = queryset.filter(transaction_date__gte=start_date)
    if end_date:
        queryset = queryset.filter(transaction_date__lte=end_date)
    if min_amount:
        queryset = queryset.filter(amount__gte=min_amount)
    if max_amount:
        queryset = queryset.filter(amount__lte=max_amount)

    queryset = queryset.order_by('-transaction_date')

    serializer = TransactionSerializer(queryset, many=True)
    return Response(serializer.data)


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
        user = self.request.user
        category = serializer.validated_data.get("category")

        if category and not (category.is_default or category.user == user):
            raise ValidationError("Bạn không được phép đặt hạn mức cho danh mục này.")
        month_str = self.request.data.get('month', None)

        if month_str:
            try:
                if len(month_str) == 7:
                    year, mon = map(int, month_str.split('-'))
                    month = datetime(year, mon, 1).date()
                else:
                    month = datetime.strptime(month_str, "%Y-%m-%d").date().replace(day=1)
            except Exception:
                now = datetime.now()
                month = datetime(now.year, now.month, 1).date()
        else:
            now = datetime.now()
            month = datetime(now.year, now.month, 1).date()

        serializer.save(user=self.request.user, month=month)

    def perform_update(self, serializer):
        user = self.request.user
        category = serializer.validated_data.get("category")
        # Kiểm tra quyền sở hữu category khi cập nhật
        if category and not (category.is_default or category.user == user):
            raise ValidationError("Bạn không được phép đặt hạn mức cho danh mục này.")
        serializer.save(user=user)


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
            end = datetime(year + 1, 1, 1)
        else:
            end = datetime(year, mon + 1, 1)
        transactions = user.transactions.filter(transaction_date__gte=start, transaction_date__lt=end)
        budget_limits = user.budget_limits.filter(month__year=year, month__month=mon)
    else:
        transactions = user.transactions.all()
        budget_limits = user.budget_limits.all()

    # Tổng thu, chi, số dư
    income = transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
    expense = transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
    balance = income - expense

    # Thống kê từng Category (chỉ lấy category default hoặc thuộc user)
    category_ids = transactions.values_list('category', flat=True).distinct()
    categories = Category.objects.filter(
        id__in=category_ids
    ).filter(
        Q(is_default=True) | Q(user=user)
    )
    category_summary = []

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
        if (bl.category.is_default or bl.category.user == user):  # Chỉ kiểm tra hạn mức với category hợp lệ
            expense_in_limit = transactions.filter(type='expense', category=bl.category).aggregate(Sum('amount'))[
                                   'amount__sum'] or 0
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
