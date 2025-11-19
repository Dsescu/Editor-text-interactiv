import { useParams, useNavigate } from "react-router-dom";

import { useEffect, useState } from "react";

import {
  fetchDocuments,
  updateDocument,
  deleteDocument,
  createDocument,
} from "../api/api";

import "../styles/editorPage.css";




export default function EditorPage() {
  const { id } = useParams(); 
  const nav = useNavigate();
  const [doc, setDoc] = useState(null); //doc curent

  // încarcă documentul selectat
  useEffect(() => {
    async function load() {
      const res = await fetchDocuments();
      const found = res.data.find((d) => d.id === Number(id));
      setDoc(found);
    }
    load();
  }, [id]);

  //aplicare formatare text
  function applyFormat(cmd) {
    document.execCommand(cmd, false, null);
  }

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
      
      {/* BARA DE SUS (back, save, delete) */}
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
      </div>

      {/*ZONA EDITARE*/}
      <div
        id="editor-area"
        className="editor-area"
        contentEditable
        dangerouslySetInnerHTML={{ __html: doc.content }}
      ></div>
    </div>
  );
}
