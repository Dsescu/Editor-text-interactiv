import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

import {
  fetchDocuments,
  updateDocument,
  deleteDocument,
  createDocument,
  fetchStyles,
  uploadMedia
} from "../api/api";

import "../styles/editorPage.css";

export default function EditorPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [doc, setDoc] = useState(null); //doc curent

  const [stylesList, setStylesList] = useState([]); //lista stiluri din backend
  const [selectedStyleId, setSelectedStyleId] = useState(""); //stilul selectat
  const editorRef = useRef(null);
  //incarca doc selectat
  useEffect(() => {
    async function load() {
      const res = await fetchDocuments();
      const found = res.data.find((d) => d.id === Number(id));
      setDoc(found);
    }
    load();
  }, [id]);

  //incarca stilurile din backend
  useEffect(() => {
    async function loadStyles() {
      const res = await fetchStyles();
      setStylesList(res.data);
    }
    loadStyles();
  }, []);

  //aplicare formatare text
  function applyFormat(cmd) {
    document.execCommand(cmd, false, null);
  }

  //aplica stilul selectat pe text
  function applySelectedStyle() {
    if (!selectedStyleId) {
      alert("Select a style first!");
      return;
    }

    const style = stylesList.find((s) => s.id === Number(selectedStyleId));
    if (!style) return;

    document.execCommand("styleWithCSS", false, true);

    if (style.bold) document.execCommand("bold");
    if (style.italic) document.execCommand("italic");
    if (style.underline) document.execCommand("underline");

    document.execCommand("foreColor", false, style.text_color);
    document.execCommand("fontSize", false, "7"); 

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const node = selection.anchorNode.parentElement;
      node.style.fontSize = style.font_size + "px";
      node.style.fontFamily = style.font_family;
    }
  }

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if(url) applyFormat("createLink", url);
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
        document.execCommand("insertImage", false, media.file)
      } catch(err){
        console.error(err);
        alert("Image upload failed!");
      }
    };
    input.click();
  };

  const insertTable = () => {
    const rows = parseInt(prompt("Number of rows:", 2));
    const cols = parseInt(prompt("Number of columns:", 2));
    if(isNaN(rows) || isNaN(cols)) return;

    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";
    table.style.margin = "10px 0";

    for(let r = 0; r < rows; r++){
      const tr = document.createElement("tr");
      for(let c = 0; c < cols; c++){
        const td = document.createElement("td");
        td.innerHTML = "&nbsp;";
        td.style.border = "1px solid #000";
        td.style.padding = "8px 8px";
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    const editor = editorRef.current;
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    range.insertNode(table);
    range.setStartAfter(table);
  };

  //salvare modificari
  async function save() {
    const newContent = document.getElementById("editor-area").innerHTML;

    await updateDocument(id, {
      title: doc.title,
      content: newContent,
    });

    alert("Saved!");
  }

  //stergere doc
  async function del() {
    if (!confirm("Are you sure you want to delete this document?")) return;
    await deleteDocument(id);
    nav("/dashboard"); //dupa stergere ma intorc la dashboard
  }

  //creeaza si deschide doc nou
  async function newDoc() {
    const res = await createDocument({ title: "New Document", content: "" });
    nav(`/editor/${res.data.id}`);
  }

  if (!doc) return <p>Loading...</p>;

  return (
    <div className="editor-container">

      {/*BARA DE SUS (back, save, delete)*/}
      <div className="editor-top-bar">
        <button onClick={() => nav("/dashboard")} className="nav-btn">
          ← Back
        </button>

        <div className="top-actions">
          <button onClick={save} className="save-btn-small">Save</button>
          <button onClick={() => del()} className="delete-btn-small">Delete</button>
        </div>
      </div>

      {/*TITLU*/}
      <input
        className="title-input"
        value={doc.title}
        onChange={(e) => setDoc({ ...doc, title: e.target.value })}
      />

      {/*TOOLBAR*/}
      <div className="toolbar">
        <button onClick={() => applyFormat("bold")}>B</button>
        <button onClick={() => applyFormat("italic")}>I</button>
        <button onClick={() => applyFormat("underline")}>U</button>
        <button onClick={() => document.execCommand("undo")}>↩</button>
        <button onClick={() => document.execCommand("redo")}>↪</button>
        <button onClick={insertLink}>Link</button>
        <button onClick={insertImage}>Image</button>
        <button onClick={insertTable}>Table</button>

        {/*Dropdown stiluri*/}
        <select
          value={selectedStyleId}
          onChange={(e) => setSelectedStyleId(e.target.value)}
          className="style-dropdown"
        >
          <option value="">Select Style</option>
          {stylesList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/*Aplică stilul*/}
        <button onClick={applySelectedStyle}>Apply Style</button>

        <select
          onChange={(e) => applyFormat("fontName", e.target.value)}
          defaultValue=""
        > 
          <option value="">Font</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
          <option value="Georgia">Georgia</option>
        </select>

        <select
          onChange={(e) => applyFormat("fontSize", e.target.value)}
          defaultValue=""
        >
          <option value="">Size</option>  
          <option value="1">8px</option>  
          <option value="2">12px</option>  
          <option value="3">14px</option>  
          <option value="4">18px</option>  
          <option value="5">24px</option>  
          <option value="6">32px</option>  
          <option value="7">64px</option>  
        </select>  

        <input
          type="color"
          onChange={(e) => applyFormat("foreColor", e.target.value)}
        />
        
      </div>

      {/*ZONA EDITARE*/}
      <div
        id="editor-area"
        ref={editorRef}
        className="editor-area"
        contentEditable
        dangerouslySetInnerHTML={{ __html: doc.content }}
      ></div>
    </div>
  );
}