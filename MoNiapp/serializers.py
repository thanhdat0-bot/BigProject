from rest_framework.serializers import ModelSerializer
from .models import User, Category,Note,Transaction,BudgetLimit,Reminder


class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class CategorySerializer(ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class TransactionSerializer(ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

class BudgetlimitSerializer(ModelSerializer):
    class Meta:
        model = BudgetLimit
        fields = '__all__'

class ReminderSerializer(ModelSerializer):
    class Meta:
        model = Reminder
        fields = '__all__'

class NoteSerializer(ModelSerializer):
    class Meta:
        model = Note
        fields = '__all__'
