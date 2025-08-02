from django.contrib import admin
from .models import Category,User,Note,Reminder,Transaction,BudgetLimit
# Register your models here.
class MoNiAppAdminSite(admin.AdminSite):
    site_header = 'Hệ thống quản lý chi tiêu'
    site_title = 'Trang Quản Trị'

admin_site = MoNiAppAdminSite(name='myadmin')
admin_site.register(User)
admin_site.register(Category)
admin_site.register(Note)
admin_site.register(Reminder)
admin_site.register(Transaction)
admin_site.register(BudgetLimit)