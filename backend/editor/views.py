import os
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserColor, Style, MediaFile, Document
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    UserColorSerializer,
    StyleSerializer,
    MediaFileSerializer,
    DocumentSerializer,
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Logout successful"})
        except Exception as e:
            return Response({"error": "invalid token"}, status=400)
        
class UserColorViewSet(viewsets.ModelViewSet):
    queryset = UserColor.objects.all()
    serializer_class = UserColorSerializer
    permission_classes = [permissions.IsAuthenticated]

class StyleViewSet(viewsets.ModelViewSet):
    queryset = Style.objects.all()
    serializer_class = StyleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Style.objects.filter(user=self.request.user)
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MediaFileViewSet(viewsets.ModelViewSet):
    queryset = MediaFile.objects.all()
    serializer_class = MediaFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        return MediaFile.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response(
                {"error" : "No file provided"},
                status = 400
            )
        media_file = MediaFile.objects.create(
            user = request.user, 
            file = file_obj
        )

        serializer = self.get_serializer(media_file, context={'request' : request})
        return Response(serializer.data, status = status.HTTP_201_CREATED)


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


#upload image
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_image(request):
    file_obj = request.FILES.get("image")
    if not file_obj:
        return Response({"error": "No image uploaded"}, status = 400)
    upload_dir = os.path.join("uploads", "images")
    os.makedirs(os.path.join(settings.MEDIA_ROOT, upload_dir), exist_ok = True)

    file_path = os.path.join(upload_dir, file_obj.name)
    saved_path = default_storage.save(file_path, ContentFile(file_obj.read()))
    file_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path)
    return Response({"url" :  file_url}, status = 200)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def shared_document(request, token):
    try:
        document = Document.objects.get(share_token=token)
    except Document.DoesNotExist:
        return Response({"error": "Invalid share link"}, status=404)

    data = {
        "title": document.title,
        "content": document.content,
        "owner": document.user.username,
    }

    return Response(data, status=200)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def update_shared_document(request, token):
    try:
        document = Document.objects.get(share_token=token)
    except Document.DoesNotExist:
        return Response({"error": "Invalid share link"}, status=404)

    if (
        request.user != document.user and
        not document.collaborators.filter(user=request.user, can_edit=True).exists()
    ):
        return Response({"error": "No permission to edit"}, status=403)

    content = request.data.get("content")
    if content is None:
        return Response({"error": "Missing content"}, status=400)

    document.content = content
    document.save()

    return Response({"message": "Document updated"}, status=200)


