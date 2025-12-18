from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserColor, Style, MediaFile, Document, DocumentCollaborator

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
        UserColor.assign_color(user)
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

class MediaFileSerializer(serializers.ModelSerializer): 
    file = serializers.SerializerMethodField()

    class Meta:
        model = MediaFile
        fields = ["id", "file"]

    def get_file(self,obj):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

class DocumentSerializer(serializers.ModelSerializer):
    collaborators = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=DocumentCollaborator.objects.all(),
        required=False
    )

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'content','user', 'created_at', 'updated_at', 'share_token',
            'is_public', 'auto_save_enabled', 'last_auto_save' ,'collaborators'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'share_token', 'last_auto_save']

class DocumentCollaboratorSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = DocumentCollaborator
        fields = ['id', 'document', 'user', 'username', 'email', 'can_edit', 'added_at']

