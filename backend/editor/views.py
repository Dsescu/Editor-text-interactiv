from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
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
                status = status.HTTP_400_BAD_REQUEST
            )
        media_file = MediaFile.objects.create(
            user = request.user, 
            file = file_obj
        )

        serializer = self.get_serializer(media_file)
        return Response(serializer.data, stattus = status.HTTP_201_CREATED)


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


        