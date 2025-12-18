import uuid
from abc import ABC, abstractmethod
from django.core.mail import send_mail
from django.conf import settings
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from io import BytesIO
from django.utils.html import strip_tags 

class SharingStrategy(ABC):
    @abstractmethod
    def share(self, document, request, **kwargs):
        pass

class LinkSharingStrategy(SharingStrategy):
    def share(self, document, request, **kwargs):
        if not document.share_token:
            document.share_token = uuid.uuid4()
            document.save()
        
        share_link = document.get_share_link(request)
        return {
            'type' : 'link',
            'link' : share_link,
            'message': f"Document shared via link: {share_link}"    
        }
    
class EmailSharingStrategy(SharingStrategy):
    def share(self, document, request, **kwargs):
        email_to = kwargs.get('email_to')
        message = kwargs.get('message', '')
        if not email_to:
            return {'error' : 'No email provided for sharing.'}
        share_link = document.get_share_link(request)
        subject = f"Document Shared: {document.title}"
        body = f"""
            Hello!

            {request.user.username} has shared a document with you.

            Title: {document.title}
            Link: {share_link}
            Message from sender: {message}
            You can view and edit the document using the link above.
        """
        try:
            send_mail(
                subject,
                strip_tags(body),
                settings.DEFAULT_FROM_EMAIL,
                [email_to],
                fail_silently=False,
            )
            return {
                'type': 'email',
                'status': True,
                'message': f"Document shared via email to {email_to}."
            }
        except Exception as e:
            return {
                'type': 'email',
                'status': False,
                'message': f"Failed to send email: {str(e)}"
            }
        
class PDFSharingStrategy(SharingStrategy):
    def share(self, document, request, **kwargs):
        buffer = BytesIO()
        p = canvas.Canvas(buffer)
        
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 800, document.title)

        p.setFont("Helvetica", 12)
        content = strip_tags(document.content)
        lines = content.split('\n')
        y_position = 750
        for line in lines:
            if y_position < 50:
                break
            p.drawString(100, y_position, line[:80])
            y_position -= 15
        p.showPage()
        p.save()
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{document.title}.pdf"'
        return response
    
#context class for strategy pattern    
class SharingContext:
    def __init__(self, strategy: SharingStrategy = None):
        self._strategy = strategy

    def set_strategy(self, strategy: SharingStrategy):
        self.strategy = strategy

    def share_document(self, document, request, **kwargs):
        if not self.strategy:
            raise ValueError("Sharing strategy not set.")
        return self.strategy.share(document, request, **kwargs)