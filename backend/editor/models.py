from django.db import models
from django.contrib.auth.models import User
import uuid
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class UserColor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    color = models.CharField(max_length=20, unique=True)  

    def __str__(self):
        return f"{self.user.username} - {self.color}"
    
    @staticmethod
    def assign_color(user):
        colors = [
            '#FF6B6B', '#4ECDC4', '#FFA07A', '#F7DC6F', '#BB8FCE', '#52B788']

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
    

class DocumentObservable:
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._observers = []
    
    def attach_observer(self, observer):
        if observer not in self._observers:
            self._observers.append(observer)
            print(f"Observer attached to {self.__class__.__name__}")
    
    def detach_observer(self, observer):
        if observer in self._observers:
            self._observers.remove(observer)
    
    def notify_observers(self, user, change_type="updated", change_details=""):
        if not hasattr(self, '_observers'):
            self._observers = []
            
        for observer in self._observers:
            try:
                observer.update(self, user, change_type, change_details)
            except Exception as e:
                print(f"Error notifying observer {observer.__class__.__name__}: {e}")
    
    def clear_observers(self):
        self._observers.clear()

    
class Document(DocumentObservable, models.Model): 
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    auto_save_enabled = models.BooleanField(default=True)
    last_auto_save = models.DateTimeField(null=True, blank=True)

    # pentru partajare
    share_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_public = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} ({self.user.username})"
    
    def get_share_link(self, request):
        host = request.get_host().split(':')[0]
        return f"http://{host}:5173/shared/{self.share_token}"
    
    def save_with_notification(self, user, change_type="content_updated", change_details="", *args, **kwargs):
        # salveaza documentul normal
        super().save(*args, **kwargs)
        
        # notifica 
        self.notify_observers(user, change_type, change_details)
        
        print(f"Document '{self.title}' saved and observers notified")
    

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
