import uuid
from abc import ABC, abstractmethod
from django.core.mail import send_mail
from django.conf import settings
from django.http import HttpResponse
from io import BytesIO
from django.utils.html import strip_tags 
from django.template.loader import get_template
from xhtml2pdf import pisa


#functie de adaugare imagini in PDF
def fetch_resources(uri,rel):
    import os
    from django.conf import settings

    path = ''
    #daca e fisier media incarcat de utilizator
    if uri.startswith(settings.MEDIA_URL):
        path = os.path.join(settings.MEDIA_ROOT, uri.replace(settings.MEDIA_URL, ""))
    #daca e fisier static
    elif uri.startswith(settings.STATIC_URL):
        path = os.path.join(settings.STATIC_ROOT, uri.replace(settings.STATIC_URL, ""))

    #daca calea nu exista returnam None si imaginea nu va aparea
    if not os.path.isfile(path):
        return None
    return path

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
        #pt tabel
        html_string = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <styles>
                body {{ font-family: Helvetica, Arial, sans-serif; line-height: 1.5;}}
                h1 {{ color : #333; text-align:center; }}
                /*stiluri tabele*/
                table {{
                    width: 100%;
                    boarder-collapse: collapse;
                    margin-bottom: 20px;
                }}
                th, td {{
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }}
                /*stiluri imagini*/
                img {{
                    max-width: 100%;
                    height: auto;
                }}
            </style>
        </head>
        <body>
            <h1>{document.title}</h1>
            <div>
                {document.content}
            </div>
        </body>
        </html>
        """
        buffer = BytesIO()
        pisa_statis = pisa.CreatePDF(
            html_string,
            dest = buffer,
            link_callback = fetch_resources
        ) 

        if pisa_statis.err:
            return HttpResponse('We had some errors <pre>' + html_string + '</pre>')
        
        buffer.seek(0)
        response = HttpResponse(buffer, content_type = 'application/pdf')
        response['Content-Disposition'] = f'attachment; filename = "{document.title}.pdf'
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