from django.urls import path
from django.template.response import TemplateResponse
from django.contrib import admin
from .models import Category, User, Note, Reminder, Transaction, BudgetLimit, StatisticsLink
from django.utils import timezone
import datetime

from django.http import HttpResponseRedirect, HttpResponse
import openpyxl

class MoNiAppAdminSite(admin.AdminSite):
    site_header = 'Expense Management System'
    site_title = 'Admin Dashboard'

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('statistics/', self.admin_view(self.statistics_view), name='statistics'),
            path('statistics/export_excel/', self.admin_view(self.export_excel_view), name='export_excel'),
        ]
        return custom_urls + urls

    def statistics_view(self, request):
        # Lấy input tháng-năm kiểu "YYYY-MM" từ input type="month"
        monthyear = request.GET.get("monthyear")
        today = timezone.localdate()
        if monthyear:
            try:
                year, month = map(int, monthyear.split("-"))
            except Exception:
                year = today.year
                month = today.month
        else:
            month = int(request.GET.get("month") or today.month)
            year = int(request.GET.get("year") or today.year)

        month_start = datetime.date(year, month, 1)
        if month == 12:
            next_month = datetime.date(year+1, 1, 1)
        else:
            next_month = datetime.date(year, month+1, 1)

        total_users = User.objects.count()
        total_transactions = Transaction.objects.filter(transaction_date__gte=month_start, transaction_date__lt=next_month).count()

        context = dict(
            self.each_context(request),
            total_users=total_users,
            total_transactions=total_transactions,
            year=year,
            month=month,
        )
        return TemplateResponse(request, "admin/statistics.html", context)

    def export_excel_view(self, request):
        # Xử lý input tháng-năm kiểu "YYYY-MM" nếu có
        monthyear = request.GET.get("monthyear")
        today = timezone.localdate()
        if monthyear:
            try:
                year, month = map(int, monthyear.split("-"))
            except Exception:
                year = today.year
                month = today.month
        else:
            month = int(request.GET.get("month") or today.month)
            year = int(request.GET.get("year") or today.year)

        month_start = datetime.date(year, month, 1)
        if month == 12:
            next_month = datetime.date(year+1, 1, 1)
        else:
            next_month = datetime.date(year, month+1, 1)

        total_users = User.objects.count()
        total_transactions = Transaction.objects.filter(transaction_date__gte=month_start, transaction_date__lt=next_month).count()

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Overview"

        # Header
        ws.append(['Chỉ số', 'Giá trị'])
        ws.append(['Tổng số user', total_users])
        ws.append(['Tổng số giao dịch', total_transactions])

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename=overview_{month:02d}_{year}.xlsx'
        wb.save(response)
        return response

admin_site = MoNiAppAdminSite(name='myadmin')
admin_site.register(User)
admin_site.register(Category)
admin_site.register(Note)
admin_site.register(Reminder)
admin_site.register(Transaction)
admin_site.register(BudgetLimit)

class StatisticsLinkAdmin(admin.ModelAdmin):
    def changelist_view(self, request, extra_context=None):
        return HttpResponseRedirect('/admin/statistics/')
admin_site.register(StatisticsLink, StatisticsLinkAdmin)