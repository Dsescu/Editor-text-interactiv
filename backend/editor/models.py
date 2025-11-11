from django.db import models
from django.contrib.auth.models import User

class UserColor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    color = models.CharField(max_length=20, unique=True)  

    def __str__(self):
        return f"{self.user.username} - {self.color}"
    
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
    content = models.TextField()
    created_at = models.DataTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.user.username})"
