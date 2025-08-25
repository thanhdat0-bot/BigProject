from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from .models import User, Category,Note,Transaction,BudgetLimit,Reminder

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "confirm_password", "first_name", "last_name", "avatar",
                  "date_of_birth", "gender", "phone", "address", "bio")

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': "Mật khẩu nhập lại không khớp."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        return User.objects.create_user(**validated_data)

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)
    class Meta:
        model = User
        fields = (
            "id", "username", "email", "first_name", "last_name", "avatar",
            "date_of_birth", "gender", "phone", "address", "bio"
        )
        read_only_fields = ("id",)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class FinanceReportSerializer(serializers.Serializer):
    total_income = serializers.FloatField()
    total_expense = serializers.FloatField()
    balance = serializers.FloatField()
    category_summary = serializers.ListField(child=serializers.DictField())
    budget_limit_exceeded = serializers.ListField(child=serializers.DictField())
    daily_expense = serializers.ListField(child=serializers.DictField(), required=False)


class CategoryStatSerializer(serializers.Serializer):
    category = serializers.CharField()
    expense = serializers.FloatField()
    income = serializers.FloatField()

class WeeklySummarySerializer(serializers.Serializer):
    week = serializers.CharField()
    total_income = serializers.FloatField()
    total_expense = serializers.FloatField()
    top_categories = CategoryStatSerializer(many=True)

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'type', 'note', 'transaction_date', 'category', 'category_name']

    def get_note(self, obj):
        return obj.notes.first().title if obj.notes.exists() else ""

    def get_date(self, obj):
        return obj.transaction_date.strftime("%Y-%m-%d %H:%M")

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None


class CategorySerializer(ModelSerializer):
    transactions = TransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = '__all__'


class BudgetlimitSerializer(ModelSerializer):
    class Meta:
        model = BudgetLimit
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True},
        }

class ReminderSerializer(ModelSerializer):
    class Meta:
        model = Reminder
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True},
        }

class NoteSerializer(ModelSerializer):
    class Meta:
        model = Note
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True},
        }
