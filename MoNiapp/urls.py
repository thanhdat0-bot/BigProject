from django.urls import path, include
from . import views
from rest_framework import routers

from .views import UserProfileView, ChangePasswordView, UserRegisterView, UserLoginView, finance_overview, \
    weekly_summary, monthly_report

router = routers.DefaultRouter()
router.register('Category', views.CategoryViewSet)
router.register('Transaction', views.TransactionViewSet)
router.register('Note', views.NoteViewSet)
router.register('Reminder', views.ReminderViewSet)
router.register('BudgetLimit', views.BudgetLimitViewSet)



urlpatterns = [
    path('', include(router.urls)),
    path('user/register/', UserRegisterView.as_view(), name='register'),
    path('user/login/', UserLoginView.as_view(), name='login'),
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('user/change-password/', ChangePasswordView.as_view(), name='user-change-password'),
    path('statistics/overview/', finance_overview, name='finance-overview'),
    path('statistics/weekly-summary/', weekly_summary, name='weekly-summary'),
    path('statistics/monthly-report/', monthly_report, name='monthly-report'),

]