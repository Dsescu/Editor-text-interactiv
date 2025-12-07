from django.db import models
from django.contrib.auth.models import User
import uuid

class UserColor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    color = models.CharField(max_length=20, unique=True)  

    def __str__(self):
        return f"{self.user.username} - {self.color}"
    
    @staticmethod
    def assign_color(user):
        colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
            '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
        ]

        used_colors = UserColor.objects.values_list('color', flat = True)
        available_colors = [c for c in colors if c not in used_colors]
        if available_colors:
            color = available_colors[0]
        else:
            import random
            color = f'#{random.randint(0, 0xFFFFFF):06x}'
        UserColor.objects.create(user = user, color = color)
        return color

    
class Style(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='styles')
    name = models.CharField(max_length=100)
    font_family = models.CharField(max_length=100, default='Arial')
    font_size = models.PositiveIntegerField(default = 14)
    bold = models.BooleanField(default=False)
    italic = models.BooleanField(default=False)
    underline = models.BooleanField(default=False)
    text_color = models.CharField(max_length=20, default='#000000')

    def __str__(self):
        return f"{self.name} ({self.user.username})"
    
class MediaFile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='media_files')
    file = models.FileField(upload_to="uploads/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name
    
class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=200)
    content = models.TextField(blank = True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    #pentru partajare
    share_token = models.CharField(max_length=64, null=True, blank=True)  # scoate unique=True !!!

    is_public = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} ({self.user.username})"
    
    def get_share_link(self, request):
        return f"{request.scheme}://{request.get_host()}/shared/{self.share_token}"
    
class DocumentCollaborator(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='collaborators') 
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    can_edit = models.BooleanField(default=True)
    added_at = models.DateTimeField(auto_now_add = True)

    class Meta:
        unique_together = ('document', 'user')
    
    def __str__(self):
        return f"{self.user.username} on {self.document.title}"
   
class ActiveEditor(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name = 'active_editors')
    user = models.ForeignKey(User, on_delete= models.CASCADE)
    last_seen = models.DateTimeField(auto_now=True)
    cursor_position = models.IntegerField(default=0)

    class Meta:
        unique_together = ('document', 'user')

    def __Str__(self):
        return f"{self.user.username} editing {self.document.title}"