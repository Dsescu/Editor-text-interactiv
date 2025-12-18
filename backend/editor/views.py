import os
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils import timezone
from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import PermissionDenied

from .models import UserColor, Style, MediaFile, Document, DocumentCollaborator
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    UserColorSerializer,
    StyleSerializer,
    MediaFileSerializer,
    DocumentSerializer,
    DocumentCollaboratorSerializer,
)

from .strategy_pattern import (
    SharingContext,
    LinkSharingStrategy,
    EmailSharingStrategy,
    PDFSharingStrategy
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
            return Response({"error" : "No file provided"}, status=400)
        
        media_file = MediaFile.objects.create(
            user=request.user, 
            file=file_obj
        )
        serializer = self.get_serializer(media_file, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Document.objects.filter(
            Q(user=user) |
            Q(collaborators__user=user)
        ).distinct()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        document = self.get_object()
        user = se;f.request.user

        #proprietarul are voie sa faca orice
        if document.user == user:
            serializer.save()
            return

        #verificam daca e colaborator si are dreptul de editare
        is_editor = document.collaborators.filter(user = user, can_edit = True).exists()
        if is_editor:
            serializer.save()
        else:
            raise PermissionDenied("You have view-only access to this document")

    @action(detail=True, methods=['post'])
    def auto_save(self, request, pk=None):
        document = self.get_object()
        content = request.data.get("content", "")
        
        if content is not None:
            document.content = content
            document.last_auto_save = timezone.now()
            document.save()
            return Response({'message': 'Document auto-saved', 'timestamp': document.last_auto_save}, status=200)
        return Response({'error': 'No content provided'}, status=400)
    
    @action(detail=True, methods=['post']) 
    def share(self, request, pk=None):
        document = self.get_object()
        share_type = request.data.get('type', 'link')
        
        context = SharingContext()

        if share_type == 'email':
            context.set_strategy(EmailSharingStrategy())
        elif share_type == 'pdf':
            context.set_strategy(PDFSharingStrategy())
        else:
            context.set_strategy(LinkSharingStrategy())

        try:
            result = context.share_document(document, request, **request.data)
            if share_type == 'pdf':
                return result
            return Response(result, status=200)
        except Exception as e:
            print(f"Share error: {e}")
            return Response({'error': str(e)}, status=500)
        
    @action(detail=True, methods=['get', 'post' , 'delete'])
    def collaborators(self, request, pk=None):
        document = self.get_object()

        if request.method == 'GET':
            collaborators = document.collaborators.all()
            serializer = DocumentCollaboratorSerializer(collaborators, many=True)
            return Response(serializer.data, status=200)

        elif request.method == 'POST':
            email = request.data.get('email').strip()
            can_edit = request.data.get('can_edit', True)

            if not email:
                return Response({'error': 'Email required'}, status=400)

            try:
                user = User.objects.filter(email__iexact=email).first()
                if not user:
                    return Response({'error': f'User not found with email: {email}, status = 404'})
                if user == request.user:
                    return Response({'error': 'Cannot add yourself'}, status=400)
                    
                collaborator, created = DocumentCollaborator.objects.get_or_create(
                    document=document,
                    user=user,
                    defaults={'can_edit': can_edit}
                )
                if not created:
                    collaborator.can_edit = can_edit
                    collaborator.save()

                serializer = DocumentCollaboratorSerializer(collaborator)
                return Response(serializer.data, status=201 if created else 200)
            except User.DoesNotExist:
                return Response({'error': 'User not found with this email'}, status=404)

        elif request.method == 'DELETE':
            user_id = request.data.get('user_id')
            if user_id:
                document.collaborators.filter(user_id=user_id).delete()
                return Response({'message': 'Collaborator removed'}, status=200)
            return Response({'error': 'User ID not provided'}, status=400)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_image(request):
    file_obj = request.FILES.get("image")
    if not file_obj:
        return Response({"error": "No image uploaded"}, status=400)
        
    upload_dir = os.path.join("uploads", "images")
    full_path = os.path.join(settings.MEDIA_ROOT, upload_dir)
    os.makedirs(full_path, exist_ok=True)

    file_path = os.path.join(upload_dir, file_obj.name)
    saved_path = default_storage.save(file_path, ContentFile(file_obj.read()))
    
    file_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path)
    return Response({"file": file_url}, status=200) 

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
        "is_public": document.is_public,
        "share_token": document.share_token
    }
    return Response(data, status=200)

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def update_shared_document(request, token):
    try:
        document = Document.objects.get(share_token=token)
    except Document.DoesNotExist:
        return Response({"error": "Invalid share link"}, status=404)
    
    can_edit = False

    if request.user.is_authenticated and document.user == request.user:
        can_edit = True
    elif document.is_public:
        can_edit = True
    elif request.user.is_authenticated and document.collaborators.filter(user = request.user, can_edit = True).exists():
        can_edit = True
    
    if not can_edit:
        return Response({"error": "You do not have permission to edit this document"}, status=403)
    
    content = request.data.get("content")
    if content is None:
        return Response({"error": "No content provided"}, status=400)
        
    document.content = content
    document.updated_at = timezone.now()
    document.save()

    return Response({"message": "Document updated"}, status=200)