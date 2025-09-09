from django.urls import path
from django.template.response import TemplateResponse
from django.contrib import admin
from .models import Category, User, Note, Reminder, Transaction, BudgetLimit, StatisticsLink
from django.db.models import Sum, Count, Q
from django.utils import timezone
import datetime

class MoNiAppAdminSite(admin.AdminSite):
    site_header = 'Expense Management System'
    site_title = 'Admin Dashboard'

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('statistics/', self.admin_view(self.statistics_view), name='statistics'),
        ]
        return custom_urls + urls

    def statistics_view(self, request):
        month = request.GET.get('month')
        year = request.GET.get('year')
        today = timezone.localdate()
        if month and year:
            month = int(month)
            year = int(year)
        else:
            month = today.month
            year = today.year

        month_list = list(range(1, 13))
        year_list = list(range(today.year - 2, today.year + 2))
        month_start = datetime.date(year, month, 1)
        if month == 12:
            next_month = datetime.date(year+1, 1, 1)
        else:
            next_month = datetime.date(year, month+1, 1)

        user_count_by_month = []
        for m in range(1, 13):
            m_start = datetime.date(year, m, 1)
            m_end = datetime.date(year+1, 1, 1) if m == 12 else datetime.date(year, m+1, 1)
            count = User.objects.filter(created_date__lt=m_end).count()
            user_count_by_month.append(count)
        user_count_labels = [f"{m:02d}-{year}" for m in range(1, 13)]

        days_in_month = (next_month - month_start).days
        transaction_count_by_day = []
        transaction_count_labels = []
        for d in range(days_in_month):
            day = month_start + datetime.timedelta(days=d)
            transaction_count = Transaction.objects.filter(transaction_date=day).count()
            transaction_count_by_day.append(transaction_count)
            transaction_count_labels.append(day.strftime('%d-%m'))

        income_data = []
        expense_data = []
        income_expense_labels = []
        for d in range(days_in_month):
            day = month_start + datetime.timedelta(days=d)
            day_income = Transaction.objects.filter(type='income', transaction_date=day).aggregate(Sum('amount'))['amount__sum'] or 0
            day_expense = Transaction.objects.filter(type='expense', transaction_date=day).aggregate(Sum('amount'))['amount__sum'] or 0
            income_data.append(day_income)
            expense_data.append(day_expense)
            income_expense_labels.append(day.strftime('%d-%m'))

        new_users_by_day = []
        new_users_labels = []
        for d in range(days_in_month):
            day = month_start + datetime.timedelta(days=d)
            count = User.objects.filter(created_date=day).count()
            new_users_by_day.append(count)
            new_users_labels.append(day.strftime('%d-%m'))

        total_users = User.objects.count()
        total_transactions = Transaction.objects.filter(transaction_date__gte=month_start, transaction_date__lt=next_month).count()
        total_income = sum(income_data)
        total_expense = sum(expense_data)
        new_users = sum(new_users_by_day)

        default_categories = Category.objects.filter(is_default=True)
        category_labels = []
        category_transaction_counts = []
        for cat in default_categories:
            count = Transaction.objects.filter(category=cat, transaction_date__gte=month_start, transaction_date__lt=next_month).count()
            category_labels.append(cat.name)
            category_transaction_counts.append(count)

        top_users_qs = User.objects.annotate(
            transaction_count=Count(
                'transactions',
                filter=Q(transactions__transaction_date__gte=month_start, transactions__transaction_date__lt=next_month)
            )
        ).order_by('-transaction_count')[:5]
        top_user_labels = [u.username for u in top_users_qs]
        top_user_values = [u.transaction_count for u in top_users_qs]

        monthly_transaction_labels = []
        monthly_transaction_counts = []
        for m in range(1, 13):
            m_start = datetime.date(year, m, 1)
            m_end = datetime.date(year+1, 1, 1) if m == 12 else datetime.date(year, m+1, 1)
            count = Transaction.objects.filter(transaction_date__gte=m_start, transaction_date__lt=m_end).count()
            monthly_transaction_labels.append(f"{m:02d}-{year}")
            monthly_transaction_counts.append(count)

        month_income = Transaction.objects.filter(type='income', transaction_date__gte=month_start, transaction_date__lt=next_month).aggregate(Sum('amount'))['amount__sum'] or 0
        month_expense = Transaction.objects.filter(type='expense', transaction_date__gte=month_start, transaction_date__lt=next_month).aggregate(Sum('amount'))['amount__sum'] or 0
        pie_labels = ['Income', 'Expense']
        pie_data = [month_income, month_expense]

        context = dict(
            self.each_context(request),
            total_users=total_users,
            total_transactions=total_transactions,
            total_income=total_income,
            total_expense=total_expense,
            new_users=new_users,
            year=year,
            month=month,
            month_list=month_list,
            year_list=year_list,
            user_count_labels=user_count_labels,
            user_count_by_month=user_count_by_month,
            transaction_count_labels=transaction_count_labels,
            transaction_count_by_day=transaction_count_by_day,
            income_expense_labels=income_expense_labels,
            income_data=income_data,
            expense_data=expense_data,
            new_users_labels=new_users_labels,
            new_users_by_day=new_users_by_day,
            category_labels=category_labels,
            category_transaction_counts=category_transaction_counts,
            top_user_labels=top_user_labels,
            top_user_values=top_user_values,
            monthly_transaction_labels=monthly_transaction_labels,
            monthly_transaction_counts=monthly_transaction_counts,
            pie_labels=pie_labels,
            pie_data=pie_data,
        )
        return TemplateResponse(request, "admin/statistics.html", context)

admin_site = MoNiAppAdminSite(name='myadmin')
admin_site.register(User)
admin_site.register(Category)
admin_site.register(Note)
admin_site.register(Reminder)
admin_site.register(Transaction)
admin_site.register(BudgetLimit)

from django.http import HttpResponseRedirect
class StatisticsLinkAdmin(admin.ModelAdmin):
    def changelist_view(self, request, extra_context=None):
        return HttpResponseRedirect('/admin/statistics/')
admin_site.register(StatisticsLink, StatisticsLinkAdmin)