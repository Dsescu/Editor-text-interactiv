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
import { autoSaveDocument } from "../api/api";


export default function EditorPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [doc, setDoc] = useState(null);
  const [stylesList, setStylesList] = useState([]);
  const [selectedStyleId, setSelectedStyleId] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // stare pentru cursori
  const [remoteCursors, setRemoteCursors] = useState({});

  const editorRef = useRef(null);
  const socketRef = useRef(null);
  const hasLoadedContent = useRef(false);
  
  const savedSelection = useRef(null);
  const autosaveTimeout = useRef(null);

  // salvam selectia curenta cand userul da click sau scrie
  const saveSelectionRange = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      savedSelection.current = selection.getRangeAt(0);
    }
  };

  // restauram selectia inainte de a aplica un font
  const restoreSelectionRange = () => {
    const selection = window.getSelection();
    if (savedSelection.current) {
      selection.removeAllRanges();
      selection.addRange(savedSelection.current);
    }
  };

  // initializare document
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
          console.error("Document not found");
        }
      } catch (error) {
        console.error("Error loading document:", error);
      }
    }
    load();
  }, [id]);

  // initializare WebSocket
  useEffect(() => {
    const token = localStorage.getItem("access"); 
    const hostname = window.location.hostname;
    const wsUrl = `ws://${hostname}:8000/ws/documents/${id}/?token=${token}`;
    
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === 'content_change') {
        if (editorRef.current) {
            const currentContent = editorRef.current.innerHTML;
            if (currentContent !== data.content) {
                 editorRef.current.innerHTML = data.content;
            }
        }
      } 
      else if (data.type === 'cursor_change') {
        setRemoteCursors(prev => ({
            ...prev,
            [data.username]: {
                color: data.color,
                top: data.cursor.top,
                left: data.cursor.left,
                height: data.cursor.height
            }
        }));
      }
      else if (data.type === 'user_left') {
          setRemoteCursors(prev => {
              const newState = {...prev};
              delete newState[data.username];
              return newState;
          });
      }
    };

    return () => {
        if (socketRef.current) socketRef.current.close();
    };
  }, [id]);

  
  const sendCursorPosition = () => {
      const selection = window.getSelection();
      if (selection.rangeCount > 0 && editorRef.current) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const editorRect = editorRef.current.getBoundingClientRect();

          const relativeTop = rect.top - editorRect.top;
          const relativeLeft = rect.left - editorRect.left;

          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({
                  type: 'cursor_change',
                  cursor: {
                      top: relativeTop,
                      left: relativeLeft,
                      height: rect.height || 20
                  }
              }));
          }
      }
  };


  const handleInput = (e) => {
      if (!hasLoadedContent.current) return;
      
      const html = e.currentTarget.innerHTML;
      
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
              type: 'content_change',
              content: html
          }));
      }

      handleAutoSave(html);
      sendCursorPosition();
  };

  // stiluri
  useEffect(() => {
    async function loadStyles() {
      const res = await fetchStyles();
      setStylesList(res.data);
    }
    loadStyles();
  }, []);

  useEffect(() => {
    async function loadCollaborators() {
      try {
        const res = await getDocumentCollaborators(id);
        setCollaborators(res.data);
      } catch (err) { console.error(err); }
    }
    if (id) loadCollaborators();
  }, [id]);


  // formatari
  const applyFormat = (cmd, value = null) => {
    restoreSelectionRange(); 
    if(editorRef.current) editorRef.current.focus();

    document.execCommand(cmd, false, value);
    
    sendCursorPosition();
    if (editorRef.current) handleInput({ currentTarget: editorRef.current });
  };

  const applySelectedStyle = () => {
    if (!selectedStyleId) { alert("Select a style first!"); return; }
    const style = stylesList.find((s) => s.id === Number(selectedStyleId));
    if (!style) return;

    restoreSelectionRange();
    if(editorRef.current) editorRef.current.focus();

    document.execCommand("styleWithCSS", false, true);
    if (style.bold) document.execCommand("bold");
    if (style.italic) document.execCommand("italic");
    if (style.underline) document.execCommand("underline");
    document.execCommand("foreColor", false, style.text_color);

    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.anchorNode) {
      document.execCommand("fontName", false, style.font_family);
      const node = selection.anchorNode.nodeType === 3 ? selection.anchorNode.parentElement : selection.anchorNode;
      if(node) {
          node.style.fontSize = style.font_size + "px";
      }
    }
    
    sendCursorPosition();
    if (editorRef.current) handleInput({ currentTarget: editorRef.current });
  };

  const insertLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) {
        restoreSelectionRange();
        document.execCommand("createLink", false, url);
        if (editorRef.current) handleInput({ currentTarget: editorRef.current });
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
        restoreSelectionRange();
        const imgHtml = `<img src="${media.file}" style="max-width: 100%; width: 300px;" />`;
        document.execCommand("insertHTML", false, imgHtml);
        if (editorRef.current) handleInput({ currentTarget: editorRef.current });
      } catch(err) { alert("Image upload failed!"); }
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
            tableHtml += `<td style="border: 1px solid black; padding: 5px;">Example</td>`;
        }
        tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><br/>`;
    
    restoreSelectionRange();
    document.execCommand("insertHTML", false, tableHtml);
    if (editorRef.current) handleInput({ currentTarget: editorRef.current });
  };

  const handleAutoSave = (newContent) => {
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    autosaveTimeout.current = setTimeout(() => {
      autoSaveDocument(id, newContent).catch(err => console.error(err));
    }, 1500);
  };

  async function save() {
    if (!editorRef.current) return;
    setIsSaving(true);
    try {
      await updateDocument(id, { title: doc.title, content: editorRef.current.innerHTML });
      alert("Saved!");
    } catch (error) { alert("Save failed!"); } 
    finally { setIsSaving(false); }
  }

  async function del() {
    if (!confirm("Delete document?")) return;
    try { await deleteDocument(id); nav("/dashboard"); } 
    catch (error) { alert("Delete failed!"); }
  }

  const handleShare = async (type, data) => {
     try {
        if (type === 'pdf') {
            const response = await shareDocument(id, 'pdf');
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', `${doc.title}.pdf`);
            document.body.appendChild(link); link.click(); link.remove();
            return;
        }
        const response = await shareDocument(id, type, data);
        if (type === 'link') {
            const fullLink = `${window.location.origin}/shared/${doc.share_token}`;
            navigator.clipboard.writeText(fullLink);
            alert("Link copied!");
        } else alert("Done!");
        setShowShareModal(false);
     } catch(e) { alert("Error sharing"); }
  };

  if (!doc) return <p style={{padding: 20}}>Loading...</p>;

  return (
    <div className="editor-container">
      {/* Top Bar */}
      <div className="editor-top-bar">
        <button onClick={() => nav("/dashboard")} className="nav-btn">← Back</button>
        <div className="top-actions">
          <button onClick={save} className="save-btn-small" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button onClick={() => setShowShareModal(true)} className="share-btn">Share</button>
          <button onClick={del} className="delete-btn-small">Delete</button>
        </div>
      </div>

      <input className="title-input" value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} />

      {/* Toolbar */}
      <div className="toolbar" onMouseDown={(e) => {
          if (e.target.tagName !== "SELECT" && e.target.tagName !== "OPTION" && e.target.tagName !== "INPUT") {
             e.preventDefault();
          }
      }}>
        <button onClick={() => applyFormat("bold")}><b>B</b></button>
        <button onClick={() => applyFormat("italic")}><i>I</i></button>
        <button onClick={() => applyFormat("underline")}><u>U</u></button>
        <button onClick={() => document.execCommand("undo")}>↩</button>
        <button onClick={() => document.execCommand("redo")}>↪</button>
        <button onClick={insertLink}>🔗</button>
        <button onClick={insertImage}>🖼️</button>
        <button onClick={insertTable}>📊</button>
        
        <select 
            onChange={(e) => applyFormat("fontName", e.target.value)} 
            className="style-dropdown"
        >
             <option value="">Font</option>
             <option value="Arial">Arial</option>
             <option value="Times New Roman">Times New Roman</option>
             <option value="Verdana">Verdana</option>
             <option value="Courier New">Courier New</option>
        </select>

        <select 
            onChange={(e) => applyFormat("fontSize", e.target.value)} 
            className="style-dropdown"
        >
             <option value="">Size</option>
             <option value="1">Small</option>
             <option value="3">Normal</option>
             <option value="5">Large</option>
             <option value="7">Huge</option>
        </select>
        
        <select onChange={(e) => setSelectedStyleId(e.target.value)} className="style-dropdown">
            <option value="">Saved Styles</option>
            {stylesList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={applySelectedStyle}>Apply</button>

        <input type="color" onChange={(e) => applyFormat("foreColor", e.target.value)} />
      </div>

      <div style={{ position: 'relative' }}>
          <div
            id="editor-area"
            ref={editorRef}
            className="editor-area"
            contentEditable
            suppressContentEditableWarning={true}
            onInput={handleInput}
            // salvam selectia cand dam click sau scriem
            onMouseUp={saveSelectionRange} 
            onKeyUp={(e) => {
                saveSelectionRange();
                sendCursorPosition();
            }}
            onClick={sendCursorPosition}
          ></div>

          {/* Cursori Remote */}
          {Object.entries(remoteCursors).map(([username, cursor]) => (
              <div
                key={username}
                className="remote-cursor"
                style={{
                    top: cursor.top,
                    left: cursor.left,
                    height: cursor.height,
                    backgroundColor: cursor.color
                }}
              >
                  <div className="remote-cursor-flag" style={{ backgroundColor: cursor.color }}>
                      {username}
                  </div>
              </div>
          ))}
      </div>

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