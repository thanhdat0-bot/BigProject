from django.contrib import admin
from .models import Category,User,Note,Reminder,Transaction,BudgetLimit
# Register your models here.
class CourseAppAdminSite(admin.AdminSite):
    site_header = 'Hệ thống quản lý chi tiêu'
    site_title = 'Trang Quản Trị'


admin.site.register(User)
admin.site.register(Category)
admin.site.register(Note)
admin.site.register(Reminder)
admin.site.register(Transaction)
admin.site.register(BudgetLimit)