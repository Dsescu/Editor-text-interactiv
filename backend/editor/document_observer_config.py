from .observer_pattern import EmailNotifier, ConsoleNotifier

def setup_document_observers(document):
    """
    Configurează observerii pentru un document
    Poate fi apelată din orice view sau semnal Django
    """
    document.attach_observer(ConsoleNotifier())
    
    # document.attach_observer(EmailNotifier())
    
    return document

# document = setup_document_observers(document)