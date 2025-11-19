import { useEffect, useState } from "react";

import {
  fetchDocuments,
  createDocument,
  deleteDocument,
} from "../api/api";

import { useNavigate } from "react-router-dom";

import "../styles/dashboard.css";



export default function Dashboard() {
  const nav = useNavigate();
  const [docs, setDocs] = useState([]); //lista de documente

  //incarcam doc din backend
  async function load() {
    const res = await fetchDocuments();
    setDocs(res.data);
  }

  //lload o singura data la deschidere pagina
  useEffect(() => {
    load();
  }, []);

  //creeaza doc nou si merge in editor direct pentru editarea lui
  async function newDoc() {
    const res = await createDocument({ title: "New Document", content: "" });
    nav(`/editor/${res.data.id}`);
  }

  //sterge document
  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this document?")) return;
    await deleteDocument(id);
    load();//da din nou load dupa stergere
  }

  return (
    <div className="dash-container">
      <h1>Your Documents</h1>

      {/* buton document nou */}
      <button className="new-doc-btn" onClick={newDoc}>
        + New Document
      </button>

      {/* lista cu doc */}
      <div className="docs-grid">
        {docs.map((d) => (
          <div key={d.id} className="doc-card">
            <div
              className="doc-info"
              onClick={() => nav(`/editor/${d.id}`)}
            >
              <h3>{d.title}</h3>
              <p>Last edited: {new Date(d.updated_at).toLocaleString()}</p>
            </div>

            {/* buton delete*/}
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(d.id);
              }}
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
