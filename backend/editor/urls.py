from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    LogoutView,
    UserColorViewSet,
    StyleViewSet,
    MediaFileViewSet,
    DocumentViewSet,
    upload_image,
    shared_document,
    update_shared_document,
)

router = DefaultRouter()
router.register(r'user-colors', UserColorViewSet)
router.register(r'styles', StyleViewSet)
router.register(r'media-files', MediaFileViewSet)
router.register(r'documents', DocumentViewSet)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    
    path("uploads/image/", upload_image, name="upload-image"),

    # documente partajate
    path('shared/<uuid:token>/', shared_document, name='share_document'),
    path('shared/<uuid:token>/update/', update_shared_document, name = 'update_shared_document'),

    path('', include(router.urls)),
]


