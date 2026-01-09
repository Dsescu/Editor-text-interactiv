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
  const [docs, setDocs] = useState([]); // lista de documente

  // incarcam doc din backend
  async function load() {
    const res = await fetchDocuments();
    setDocs(res.data);
  }

  // load o singura data la deschidere pagina
  useEffect(() => {
    load();
  }, []);

  // creeaza doc nou si merge in editor direct pentru editarea lui
  async function newDoc() {
    const res = await createDocument({ title: "New Document", content: "" });
    nav(`/editor/${res.data.id}`);
  }

  // sterge document
  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this document?")) return;
    await deleteDocument(id);
    load(); // da din nou load dupa stergere
  }

  function handleLogout(){
    if(!confirm("Are you sure you want to logout?")) return;
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    nav("/");
  }

  return (
    <div className="dash-container">
      <h1>Your Documents</h1>

    <div className="top-buttons-container">
        <button 
          className="logout-btn" 
          onClick={handleLogout}
        >
          Logout
        </button>

    </div>

    <div className="right-buttons">
        {/*buton doc nou*/}
        <button className="new-doc-btn" onClick={newDoc}>
          + New Document
        </button>

      

        {/*buton manage styles*/}
        <button
          className="styles-btn"
          onClick={() => nav("/styles")}
          style={{ marginLeft: "10px" }}
        >
          Manage Styles
        </button>
    </div>


      {/*lista cu doc*/}
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

            {/*buton delete*/}
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
