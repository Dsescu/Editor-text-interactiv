import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  fetchDocuments,
  updateDocument,
  deleteDocument,
  fetchStyles,
  uploadMedia,
  shareDocument,
  getDocumentCollaborators,
} from "../api/api";
import "../styles/editorPage.css";
import ShareModal from "../components/ShareModal";

export default function EditorPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [doc, setDoc] = useState(null); //doc curent
  const [stylesList, setStylesList] = useState([]); //lista stiluri din backend
  const [selectedStyleId, setSelectedStyleId] = useState(""); //stilul selectat
  const [showShareModal, setShowShareModal] = useState(false); //afisare share
  const [collaborators, setCollaborators] = useState([]); //lista colaboratori
  const [isSaving, setIsSaving] = useState(false);

  
  const editorRef = useRef(null);
  const hasLoadedContent = useRef(false);

  //incarca doc selectat
  useEffect(() => {
    async function load() {
      try {
        const res = await fetchDocuments();
        const found = res.data.find((d) => d.id === Number(id));
        
        if (found) {
          setDoc(found);
          
          if (editorRef.current && !hasLoadedContent.current) {
            editorRef.current.innerHTML = found.content;
            hasLoadedContent.current = true; 
          }
        } else {
          console.error("Document not found with id:", id);
        }
      } catch (error) {
        console.error("Error loading document:", error);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (doc && editorRef.current && !hasLoadedContent.current) {
        editorRef.current.innerHTML = doc.content;
        hasLoadedContent.current = true;
    }
  }, [doc]);

  //incarca stilurile din backend
  useEffect(() => {
    async function loadStyles() {
      const res = await fetchStyles();
      setStylesList(res.data);
    }
    loadStyles();
  }, []);

  //incarcare colaboratori
  useEffect(() => {
    async function loadCollaborators() {
      try {
        const res = await getDocumentCollaborators(id);
        setCollaborators(res.data);
      } catch (err) {
        console.error("Failed to load collaborators:", err);
      }
    }
    if (id) {
      loadCollaborators();
    }
  }, [id]);

  //aplicare formatare text
  const applyFormat = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    if(editorRef.current) editorRef.current.focus();
  };

  //aplica stilul selectat pe text
  const applySelectedStyle = () => {
    if (!selectedStyleId) {
      alert("Select a style first!");
      return;
    }
    const style = stylesList.find((s) => s.id === Number(selectedStyleId));
    if (!style) return;

    document.execCommand("styleWithCSS", false, true);

    if (style.bold) applyFormat("bold");
    if (style.italic) applyFormat("italic");
    if (style.underline) applyFormat("underline");
    applyFormat("foreColor", style.text_color);

    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.anchorNode) {
      const node = selection.anchorNode.nodeType === 3 ? selection.anchorNode.parentElement : selection.anchorNode;
      if(node) {
          node.style.fontSize = style.font_size + "px";
          node.style.fontFamily = style.font_family;
      }
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) {
        document.execCommand("createLink", false, url);
    }
  };

  const insertImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if(!file) return;
      try{
        const media = await uploadMedia(file);
        // inseram imaginea ca HTML
        const imgHtml = `<img src="${media.file}" style="max-width: 100%; width: 300px;" />`;
        document.execCommand("insertHTML", false, imgHtml);
      } catch(err) {
        console.error(err);
        alert("Image upload failed!");
      }
    };
    input.click();
  };

  const insertTable = () => {
    const rows = parseInt(prompt("Number of rows:", 3)) || 3;
    const cols = parseInt(prompt("Number of columns:", 3)) || 3;

    let tableHtml = `<table style="border-collapse: collapse; width: 100%; border: 1px solid black;"><tbody>`;
    
    for(let r=0; r<rows; r++){
        tableHtml += `<tr>`;
        for(let c=0; c<cols; c++){
            tableHtml += `<td style="border: 1px solid black; padding: 5px;"></td>`;
        }
        tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><br/>`;
    
    document.execCommand("insertHTML", false, tableHtml);
  };

  //salvare modificari
  async function save() {
    if (!editorRef.current) return;
    const currentContent = editorRef.current.innerHTML;
    
    setIsSaving(true);
    try {
      await updateDocument(id, {
        title: doc.title,
        content: currentContent,
      });
      
      alert("Saved!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Save failed!");
    } finally {
      setIsSaving(false);
    }
  }

  //stergere doc
  async function del() {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(id);
      nav("/dashboard");
    } catch (error) {
      alert("Delete failed!");
    }
  }

  const handleShare = async (type, data) => {
    try {
      // Logica PDF
      if (type === 'pdf') {
        const response = await shareDocument(id, 'pdf');
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${doc.title}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      const response = await shareDocument(id, type, data);
      
      if (type === 'link') {
        const fullLink = `${window.location.origin}/shared/${doc.share_token}`;
        navigator.clipboard.writeText(fullLink);
        alert(`Link copied to clipboard: ${fullLink}`);
      } else if (type === 'email') {
        alert(response.data.message || "Email sent successfully!");
      }
      
      setShowShareModal(false);

    } catch (err) {
      console.error("Sharing error:", err);
      const errorMessage = err.response?.data?.error || "An error occurred while processing your request.";
      alert(`Error: ${errorMessage}`);
    }
  };

  if (!doc) return <p style={{padding: 20}}>Loading document...</p>;

  return (
    <div className="editor-container">
      {/* Bara de sus */}
      <div className="editor-top-bar">
        <button onClick={() => nav("/dashboard")} className="nav-btn">
          ← Back
        </button>
        
        <div className="top-actions">
          <button onClick={save} className="save-btn-small" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button onClick={() => setShowShareModal(true)} className="share-btn">
            Share / Export
          </button>
          <button onClick={del} className="delete-btn-small">Delete</button>
        </div>
      </div>

      {/* Titlu */}
      <input
        className="title-input"
        value={doc.title}
        onChange={(e) => setDoc({ ...doc, title: e.target.value })}
      />

      {/* Toolbar */}
      <div className="toolbar">
        <button onClick={() => applyFormat("bold")} title="Bold"><b>B</b></button>
        <button onClick={() => applyFormat("italic")} title="Italic"><i>I</i></button>
        <button onClick={() => applyFormat("underline")} title="Underline"><u>U</u></button>
        
        <button onClick={() => document.execCommand("undo")} title="Undo">↩</button>
        <button onClick={() => document.execCommand("redo")} title="Redo">↪</button>
        
        <button onClick={insertLink} title="Insert Link">🔗</button>
        <button onClick={insertImage} title="Insert Image">🖼️</button>
        <button onClick={insertTable} title="Insert Table">📊</button>
        
        {/* Dropdown Stiluri */}
        <select
          value={selectedStyleId}
          onChange={(e) => setSelectedStyleId(e.target.value)}
          className="style-dropdown"
          title="Select Style"
        >
          <option value="">Select Style</option>
          {stylesList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        
        <button onClick={applySelectedStyle} title="Apply Selected Style">
          Apply
        </button>
        
        {/* Font Family */}
        <select
          onChange={(e) => applyFormat("fontName", e.target.value)}
          defaultValue=""
          title="Font Family"
        >
          <option value="">Font</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier New</option>
        </select>
        
        {/* Font Size */}
        <select
          onChange={(e) => applyFormat("fontSize", e.target.value)}
          defaultValue=""
          title="Font Size"
        >
          <option value="">Size</option>
          <option value="1">Small (8pt)</option>
          <option value="2">Normal (10pt)</option>
          <option value="3">Normal (12pt)</option>
          <option value="4">Large (14pt)</option>
          <option value="5">Large (18pt)</option>
          <option value="6">Huge (24pt)</option>
          <option value="7">Huge (36pt)</option>
        </select>
        
        {/* Culoare */}
        <input
          type="color"
          onChange={(e) => applyFormat("foreColor", e.target.value)}
          title="Text Color"
        />
      </div>

      {/* Zona de editare */}
      <div
        id="editor-area"
        ref={editorRef}
        className="editor-area"
        contentEditable
        suppressContentEditableWarning={true}
      ></div>

      {/* Modal Partajare */}
      {showShareModal && (
        <ShareModal
          document={doc}
          onClose={() => setShowShareModal(false)}
          onShare={handleShare}
          collaborators={collaborators}
          docId={id} 
          onCollaboratorAdded={async () => {
             const res = await getDocumentCollaborators(id);
             setCollaborators(res.data);
          }}
        />
      )}
    </div>
  );
}