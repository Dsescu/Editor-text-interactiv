import { useState } from "react";
import { addDocumentCollaborator, removeDocumentCollaborator } from "../api/api";
import "../styles/shareModal.css";

const ShareModal = ({ document, onClose, onShare, collaborators = [], docId, onCollaboratorAdded }) => {
  const [shareType, setShareType] = useState("link");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [newCollabEmail, setNewCollabEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  
  if (!document) return null;

  const shareToken = document.share_token || "";
  const shareLink = shareToken ? `${window.location.origin}/shared/${shareToken}` : "Link generating...";

  const handleShareAction = () => {
    onShare(shareType, { email_to: email, message });
  };

  const handleAddCollaborator = async () => {
      if(!newCollabEmail) return;
      setIsAdding(true);
      try {
          await addDocumentCollaborator(docId, newCollabEmail);
          setNewCollabEmail("");
          if(onCollaboratorAdded) onCollaboratorAdded();
          alert("Collaborator added successfully!");
      } catch (err) {
          console.error(err);
          alert(err.response?.data?.error || "Failed to add user. Ensure they are registered.");
      } finally {
          setIsAdding(false);
      }
  };

  const handleRemoveCollaborator = async (userId) => {
      if(!confirm("Remove access for this user?")) return;
      try {
          await removeDocumentCollaborator(docId, userId);
          if(onCollaboratorAdded) onCollaboratorAdded();
      } catch(err) {
          alert("Failed to remove collaborator.");
      }
  }

  return (
    <div className="modal-overlay">
      <div className="share-modal">
        
        {/* Header Modal */}
        <div className="modal-header">
            <h2>Share "{document.title || "Document"}"</h2>
            <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Tab-urile */}
        <div className="share-options">
            <div className="option-tabs">
                <button 
                    className={`tab-btn ${shareType === 'link' ? 'active' : ''}`} 
                    onClick={() => setShareType('link')}
                >
                    🔗 Link
                </button>
                <button 
                    className={`tab-btn ${shareType === 'email' ? 'active' : ''}`} 
                    onClick={() => setShareType('email')}
                >
                    ✉️ Email
                </button>
                <button 
                    className={`tab-btn ${shareType === 'pdf' ? 'active' : ''}`} 
                    onClick={() => setShareType('pdf')}
                >
                    📄 PDF
                </button>
            </div>

            {/* Conținut Tabs */}
            <div className="option-content">
                
                {/* 1. TAB LINK */}
                {shareType === 'link' && (
                    <div className="link-option">
                        <p>Public link:</p>
                        <div className="link-display">
                            {shareLink}
                        </div>
                        <button className="copy-btn" onClick={() => {
                            navigator.clipboard.writeText(shareLink);
                            alert("Link copied!");
                        }}>Copy Link</button>
                    </div>
                )}

                {/* 2. TAB EMAIL */}
                {shareType === 'email' && (
                  <div className="email-option">
                    <p>Send invitation:</p>
                    <input 
                      type="email" 
                      placeholder="Recipient Email" 
                      className="email-input"
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                    />
                    <textarea 
                       placeholder="Optional message..." 
                       className="message-input"
                       value={message} 
                       onChange={e => setMessage(e.target.value)}
                    />
                  </div>
                )}

                {/* 3. TAB PDF */}
                {shareType === 'pdf' && (
                    <div className="pdf-option">
                        <p>Download as PDF.</p>
                        <p className="note" style={{fontSize: '12px', color: '#666'}}>
                            * Save changes before downloading.
                        </p>
                    </div>
                )}
            </div>
        </div>

        <hr style={{border: '0', borderTop: '1px solid #eee', margin: '0 20px'}}/>

        {/* Secțiunea Colaboratori */}
        <div className="collaborators-section">
            <h3>Active Collaborators</h3>
            <div className="collaborators-list">
                {(!collaborators || collaborators.length === 0) && (
                    <p style={{color:'#999', fontStyle:'italic'}}>No collaborators yet.</p>
                )}
                
                {collaborators && collaborators.map(c => (
                    <div key={c.id || Math.random()} className="collaborator-item">
                        <div style={{display:'flex', flexDirection:'column'}}>
                             <span className="collaborator-name">{c.email || c.username || "User"}</span>
                        </div>
                        <button 
                            onClick={() => handleRemoveCollaborator(c.user)} 
                            style={{color:'#ff4444', border:'none', background:'none', cursor:'pointer', fontSize:'18px'}}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
            
            <div className="add-collaborator">
                <input 
                    type="email" 
                    placeholder="User Email to add" 
                    className="collaborator-input"
                    value={newCollabEmail}
                    onChange={(e) => setNewCollabEmail(e.target.value)}
                />
                <button className="add-btn" onClick={handleAddCollaborator} disabled={isAdding}>
                    {isAdding ? "..." : "Add"}
                </button>
            </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Close</button>
          <button className="share-action-btn" onClick={handleShareAction}>
             {shareType === 'pdf' ? 'Download' : (shareType === 'email' ? 'Send' : 'Copy Link')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;