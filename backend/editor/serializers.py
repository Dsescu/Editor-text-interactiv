from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserColor, Style, MediaFile, Document

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    
class UserColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserColor
        fields = "__all__"

class StyleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Style
        fields = "__all__"
        read_only_fields = ['user']

class MediaFileSerializer(serializers.ModelSerializer): #poze si link
    class Meta:
        model = MediaFile
        fields = "__all__"
        read_only_fields = ['user', 'uploaded_at']

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = "__all__"
        read_only_fields = ['user', 'created_at', 'updated_at']

