from rest_framework.serializers import ModelSerializer
from .models import User, Category,Note,Transaction,BudgetLimit,Reminder


class UserSerializer(ModelSerializer):
    model = User
    fields = '__all__'

class CategorySerializer(ModelSerializer):
    model = Category
    fields = '__all__'

class TransactionSerializer(ModelSerializer):
    model = Transaction
    fields = '__all__'

class BudgetlimitSerializer(ModelSerializer):
    model = BudgetLimit
    fields = '__all__'

class ReminderSerializer(ModelSerializer):
    model = Reminder
    fields = '__all__'

class NoteSerializer(ModelSerializer):
    model = Note
    fields = '__all__'
