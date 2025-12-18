import { useState } from "react";
import { addDocumentCollaborator, removeDocumentCollaborator, updateDocument } from "../api/api";
import "../styles/shareModal.css";

const ShareModal = ({ document, onClose, onShare, collaborators = [], docId, onCollaboratorAdded }) => {
  const [shareType, setShareType] = useState("link");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [newCollabEmail, setNewCollabEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isPublic,  setIsPublic] = useState(false);

  if (!document) return null;

  const shareToken = document.share_token || "";
  const shareLink = shareToken ? `${window.location.origin}/shared/${shareToken}` : "Link generating...";

  const handleShareAction = () => {
    onShare(shareType, { email_to: email, message });
  };

  const togglePublicAccess = async (e) => {
    const newValue = e.target.checked;
    setIsPublic(newValue);
    try {
        await updateDocument(docId, {is_public: newValue});
    } catch (err){
        alert("Failed to update public access settings.");
        setIsPublic(!newValue); //revenire in caz de eroare
    }
  }

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
        
        <div className="modal-header">
            <h2>Share "{document.title || "Document"}"</h2>
            <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="share-options">
            <div className="option-tabs">
                <button className={`tab-btn ${shareType === 'link' ? 'active' : ''}`} onClick={() => setShareType('link')}>🔗 Link</button>
                <button className={`tab-btn ${shareType === 'email' ? 'active' : ''}`} onClick={() => setShareType('email')}>✉️ Email</button>
                <button className={`tab-btn ${shareType === 'pdf' ? 'active' : ''}`} onClick={() => setShareType('pdf')}>📄 PDF</button>
            </div>

            <div className="option-content">
                {shareType === 'link' && (
                    <div className="link-option">
                        <p>Public link:</p>
                        <div className="link-display">{shareLink}</div>
                        
                        <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                            <button className="copy-btn" onClick={() => {
                                navigator.clipboard.writeText(shareLink);
                                alert("Link copied!");
                            }}>Copy Link</button>
                        </div>

                        {/* AICI ESTE NOUL CHECKBOX */}
                        <div style={{marginTop: '20px', padding: '10px', background: '#f9f9f9', borderRadius: '5px', border:'1px solid #eee'}}>
                            <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold'}}>
                                <input 
                                    type="checkbox" 
                                    checked={isPublic} 
                                    onChange={togglePublicAccess}
                                    style={{width:'18px', height:'18px'}}
                                />
                                Allow anyone with the link to edit
                            </label>
                            <p style={{fontSize:'12px', color:'#666', margin:'5px 0 0 28px'}}>
                                If checked, anyone who has this link can modify the document without logging in.
                            </p>
                        </div>
                    </div>
                )}

                {shareType === 'email' && (
                  <div className="email-option">
                    <input type="email" placeholder="Recipient Email" className="email-input" value={email} onChange={e => setEmail(e.target.value)}/>
                    <textarea placeholder="Optional message..." className="message-input" value={message} onChange={e => setMessage(e.target.value)}/>
                  </div>
                )}

                {shareType === 'pdf' && (
                    <div className="pdf-option">
                        <p>Download as PDF.</p>
                        <p className="note">* Save changes before downloading.</p>
                    </div>
                )}
            </div>
        </div>

        <hr style={{border: '0', borderTop: '1px solid #eee', margin: '0 20px'}}/>

        <div className="collaborators-section">
            <h3>Active Collaborators</h3>
            <div className="collaborators-list">
                {(!collaborators || collaborators.length === 0) && <p style={{color:'#999'}}>No collaborators yet.</p>}
                {collaborators && collaborators.map(c => (
                    <div key={c.id || Math.random()} className="collaborator-item">
                        <span>{c.email || c.username}</span>
                        <button onClick={() => handleRemoveCollaborator(c.user)} style={{color:'red', border:'none', background:'none'}}>×</button>
                    </div>
                ))}
            </div>
            
            <div className="add-collaborator">
                <input type="email" placeholder="Add specific user email..." className="collaborator-input" value={newCollabEmail} onChange={(e) => setNewCollabEmail(e.target.value)}/>
                <button className="add-btn" onClick={handleAddCollaborator} disabled={isAdding}>{isAdding ? "..." : "Add"}</button>
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