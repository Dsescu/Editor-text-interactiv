# backend/editor/observer_pattern.py

from abc import ABC, abstractmethod
from django.core.mail import send_mail
from django.conf import settings

class DocumentObserver(ABC):
    @abstractmethod
    def update(self, document, user, change_type, change_details):
        pass

class EmailNotify(DocumentObserver):
    # trimitere notificari prin email
    def update(self, document, user, change_type, change_details):
        # --- MODIFICARE: Ignoram complet autosave-ul ---
        if change_type == 'autosave':
            return
        # ---------------------------------------------

        recipients = self._get_recipients(document, user)
        
        if not recipients:
            return  # nimeni de notificat
        
        subject, message = self._create_email_content(document, user, change_type, change_details)
        
        for email in recipients:
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=True, 
                )
                print(f"Email sent to {email} for document '{document.title}'")
            except Exception as e:
                print(f"Failed to send email to {email}: {e}")

    def _get_recipients(self, document, modifying_user):
            """Returnează lista de email-uri pentru notificare"""
            recipients = []
            
            # proprietarul documentului
            if document.user.email and document.user.email != modifying_user.email:
                recipients.append(document.user.email)
            
            # toti colaboratorii
            for collaborator in document.collaborators.all():
                if (collaborator.user.email and 
                    collaborator.user.email != modifying_user.email and
                    collaborator.user.email not in recipients):
                    recipients.append(collaborator.user.email)
            
            return recipients
        
    def _create_email_content(self, document, user, change_type, change_details):
        change_titles = {
            'autosave': 'Auto-saved', # Putem lasa asta aici pt istoric, dar nu va mai fi folosit la email
            'manual_save': 'Manually saved',
            'title_change': 'Title changed',
            'collaborator_added': 'Collaborator added',
            'content_updated': 'Content updated',
        }
        
        action = change_titles.get(change_type, 'Modified')
        
        subject = f"{action}: {document.title}"
        
        # Link-ul catre frontend (ajusteaza portul daca e diferit)
        share_link = f"http://localhost:5173/shared/{document.share_token}"
        
        message = f"""
        Document: {document.title}
        
        Modified by: {user.username} ({user.email})
        Action: {change_type.replace('_', ' ').title()}
        Time: {document.updated_at}
        
        Details: {change_details}
        
        You can view the document here (no login required):
        {share_link}
        
        ---
        This is an automated notification from your Text Editor.
        """
        
        return subject, message


class ConsoleNotifier(DocumentObserver):
    # debug
        
    def update(self, document, user, change_type, change_details):
            print(f"""
            [CONSOLE NOTIFICATION]
            Document: {document.title} (ID: {document.id})
            Modified by: {user.username}
            Change type: {change_type}
            Details: {change_details}
            Time: {document.updated_at}
            """)