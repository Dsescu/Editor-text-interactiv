from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    LogoutView,
    UserColorViewSet,
    StyleViewSet,
    MediaFileViewSet,
    DocumentViewSet,
)

router = DefaultRouter()
router.register(r'user-colors', UserColorViewSet)
router.register(r'styles', StyleViewSet)
router.register(r'media-files', MediaFileViewSet)
router.register(r'documents', DocumentViewSet)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('', include(router.urls)),
]

