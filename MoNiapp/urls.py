from django.urls import path, include
from . import views
from rest_framework import routers


router = routers.DefaultRouter()
router.register('User', views.UserViewSet)
router.register('Category', views.CategoryViewSet)
router.register('Transaction', views.TransactionViewSet)
router.register('Note', views.NoteViewSet)
router.register('Reminder', views.ReminderViewSet)
router.register('BudgetLimit', views.BudgetLimitViewSet)



urlpatterns = [
path('', include(router.urls))
]