from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from .models import User, Category,Note,Transaction,BudgetLimit,Reminder

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "first_name", "last_name", "avatar")

    def create(self, validated_data):
        avatar = validated_data.pop("avatar", None)
        user = User(**validated_data)
        user.set_password(validated_data["password"])
        if avatar:
            user.avatar = avatar
        user.save()
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "avatar", "balance")

class UserUpdateSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)
    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "avatar")

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
