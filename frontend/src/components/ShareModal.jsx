import { useEffect, useState } from "react";
import {
  addDocumentCollaborator,
  removeDocumentCollaborator,
  updateDocument,
} from "../api/api";
import "../styles/shareModal.css";

const ShareModal = ({
  document: doc, // ✅ rename prop locally so it doesn't shadow window.document
  onClose,
  onShare,
  collaborators = [],
  docId,
  onCollaboratorAdded,
}) => {
  const [shareType, setShareType] = useState("link");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [newCollabEmail, setNewCollabEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  // keep checkbox in sync with server state when modal opens / doc changes
  useEffect(() => {
    setIsPublic(!!doc?.is_public);
  }, [doc?.is_public]);

  if (!doc) return null;

  const shareToken = doc.share_token || "";
  const shareLink =
    typeof window !== "undefined" && shareToken
      ? `${window.location.origin}/shared/${shareToken}`
      : "Link generating...";

  /* =======================
     CLIPBOARD SAFE COPY (browser-only)
     ======================= */
  const handleCopyLink = async () => {
    if (typeof window === "undefined") {
      alert("Copy not supported in this environment.");
      return;
    }

    try {
      // ✅ Prefer modern Clipboard API
      if (window.navigator?.clipboard?.writeText) {
        await window.navigator.clipboard.writeText(shareLink);
      } else {
        // ✅ Fallback (older browsers)
        const textarea = window.document.createElement("textarea");
        textarea.value = shareLink;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.opacity = "0";
        window.document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const ok = window.document.execCommand("copy");
        window.document.body.removeChild(textarea);

        if (!ok) throw new Error("execCommand copy failed");
      }

      alert("Link copied!");
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Failed to copy link");
    }
  };

  /* =======================
     SHARE ACTION
     ======================= */
  const handleShareAction = () => {
    if (shareType === "link") {
      handleCopyLink();
    } else {
      onShare(shareType, { email_to: email, message });
    }
  };

  /* =======================
     PUBLIC ACCESS
     ======================= */
  const togglePublicAccess = async (e) => {
    const newValue = e.target.checked;
    setIsPublic(newValue);
    try {
      await updateDocument(docId, { is_public: newValue });
    } catch (err) {
      console.error(err);
      alert("Failed to update public access settings.");
      setIsPublic(!newValue);
    }
  };

  /* =======================
     COLLABORATORS
     ======================= */
  const handleAddCollaborator = async () => {
    if (!newCollabEmail) return;
    setIsAdding(true);
    try {
      await addDocumentCollaborator(docId, newCollabEmail);
      setNewCollabEmail("");
      onCollaboratorAdded?.();
      alert("Collaborator added successfully!");
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.error ||
          "Failed to add user. Ensure they are registered."
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    if (!confirm("Remove access for this user?")) return;
    try {
      await removeDocumentCollaborator(docId, userId);
      onCollaboratorAdded?.();
    } catch {
      alert("Failed to remove collaborator.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="share-modal">
        {/* HEADER */}
        <div className="modal-header">
          <h2>Share "{doc.title || "Document"}"</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* SHARE OPTIONS */}
        <div className="share-options">
          <div className="option-tabs">
            <button
              className={`tab-btn ${shareType === "link" ? "active" : ""}`}
              onClick={() => setShareType("link")}
            >
              🔗 Link
            </button>
            <button
              className={`tab-btn ${shareType === "email" ? "active" : ""}`}
              onClick={() => setShareType("email")}
            >
              ✉️ Email
            </button>
            <button
              className={`tab-btn ${shareType === "pdf" ? "active" : ""}`}
              onClick={() => setShareType("pdf")}
            >
              📄 PDF
            </button>
          </div>

          <div className="option-content">
            {shareType === "link" && (
              <div className="link-option">
                <p>Public link:</p>
                <div className="link-display">{shareLink}</div>

                <div style={{ marginTop: "10px" }}>
                  <button
                    className="copy-btn"
                    onClick={handleCopyLink}
                    disabled={shareLink === "Link generating..."}
                  >
                    Copy Link
                  </button>
                </div>

                <div
                  style={{
                    marginTop: "20px",
                    padding: "10px",
                    background: "#f9f9f9",
                    borderRadius: "5px",
                    border: "1px solid #eee",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={togglePublicAccess}
                      style={{ width: "18px", height: "18px" }}
                    />
                    Allow anyone with the link to edit
                  </label>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      margin: "5px 0 0 28px",
                    }}
                  >
                    If checked, anyone who has this link can modify the document
                    without logging in.
                  </p>
                </div>
              </div>
            )}

            {shareType === "email" && (
              <div className="email-option">
                <input
                  type="email"
                  placeholder="Recipient Email"
                  className="email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <textarea
                  placeholder="Optional message..."
                  className="message-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            )}

            {shareType === "pdf" && (
              <div className="pdf-option">
                <p>Download as PDF.</p>
                <p className="note">* Save changes before downloading.</p>
              </div>
            )}
          </div>
        </div>

        <hr />

        {/* COLLABORATORS */}
        <div className="collaborators-section">
          <h3>Active Collaborators</h3>

          <div className="collaborators-list">
            {collaborators.length === 0 && (
              <p style={{ color: "#999" }}>No collaborators yet.</p>
            )}

            {collaborators.map((c) => (
              <div key={c.id} className="collaborator-item">
                <span>{c.email || c.username}</span>
                <button
                  onClick={() => handleRemoveCollaborator(c.user)}
                  style={{
                    color: "red",
                    border: "none",
                    background: "none",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="add-collaborator">
            <input
              type="email"
              placeholder="Add specific user email..."
              className="collaborator-input"
              value={newCollabEmail}
              onChange={(e) => setNewCollabEmail(e.target.value)}
            />
            <button
              className="add-btn"
              onClick={handleAddCollaborator}
              disabled={isAdding}
            >
              {isAdding ? "..." : "Add"}
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Close
          </button>
          <button className="share-action-btn" onClick={handleShareAction}>
            {shareType === "pdf"
              ? "Download"
              : shareType === "email"
              ? "Send"
              : "Copy Link"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
