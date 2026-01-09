import { use, useEffect, useState } from "react";  
import { useParams } from "react-router-dom";
import { fetchSharedDocument, updateShareDocument } from "../api/api";
import "../styles/editorPage.css";


export default function sharedDocPage() {
    const { token } = useParams();
    const [doc, setDoc] = useState(null);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function load () {
            try {
                const res = await fetchSharedDocument(token);
                setDoc(res.data);
            } catch (err) {
                setError ("Document not found or access denied.");
            }
        }
        load();
    }, [token]); 

    const handleSave = async () => {
        const content = document.getElementById("shared-editor-area").innerHTML;
        setIsSaving (true);
        try {
            await updateShareDocument(token, content);
            alert ("Document saved successfully.");
        } catch (err) {
            alert ("Error saving. You might not have permission.");
        } finally {
            setIsSaving (false);
        }
    };

    if (error) {
        return <div style = {{ padding: 20, textAlign: "center", color: "red" }}>{error}</div>;
    }
    if (!doc) {
        return <div style = {{ padding: 20, textAlign: "center" }}>Loading document...</div>;
    }

    return (
    <div className="editor-container">
      <div className="editor-top-bar">
        <h2>{doc.title} <small>(Shared by {doc.owner})</small></h2>
        <button onClick={handleSave} className="save-btn-small" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div 
        id="shared-editor-area"
        className="editor-area"
        contentEditable
        dangerouslySetInnerHTML={{ __html: doc.content }}
      />
    </div>
  );
}    