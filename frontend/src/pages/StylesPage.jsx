import { useEffect, useState } from "react";
// Asigura-te ca ai 'deleteStyle' in import!
import { fetchStyles, createStyle, deleteStyle } from "../api/api";
import { useNavigate } from "react-router-dom";
import "../styles/myStyles.css";


export default function StylesPage() {
  const nav = useNavigate();

  const [stylesList, setStylesList] = useState([]); // lista stiluri

  const [form, setForm] = useState({
    name: "",
    font_family: "Arial",
    font_size: 16,
    bold: false,
    italic: false,
    underline: false,
    text_color: "#000000",
  });

  // incarcam stiluri din backend
  async function load() {
    try {
      const res = await fetchStyles();
      setStylesList(res.data);
    } catch (error) {
      console.error("Error loading styles:", error);
    }
  }

  // incarcare o singura data
  useEffect(() => {
    load();
  }, []);

  // actualizare formular
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  // salvare stil nou
  async function saveStyle() {
    if (!form.name) {
      alert("Please enter a name for the style!");
      return;
    }
    try {
      await createStyle(form);
      load(); // reload lista de stiluri
      // resetam formularul la default dupa salvare
      setForm({ ...form, name: "" }); 
      alert("Style created!");
    } catch (error) {
      alert("Error creating style");
    }
  }

  // Stergere
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this style?")) return;
    
    try {
        await deleteStyle(id);
        load();
    } catch (error) {
        console.error("Failed to delete style:", error);
        alert("Could not delete style.");
    }
  }

  return (
    <div className="styles-container">

      {/*buton back*/}
      <button className="back-btn" onClick={() => nav("/dashboard")}>
        ← Back
      </button>

      <h2>Your Custom Styles</h2>

      {/*afisare lista stiluri*/}
      <div className="styles-grid">
        {stylesList.map((s) => (
          <div key={s.id} className="style-card">
            
            <div style={{flex: 1}}>
                <h3>{s.name}</h3>

                {/*text exemplu*/}
                <p
                style={{
                    fontFamily: s.font_family,
                    fontSize: `${s.font_size}px`, // Adaugat 'px' pentru siguranta
                    fontWeight: s.bold ? "bold" : "normal",
                    fontStyle: s.italic ? "italic" : "normal",
                    textDecoration: s.underline ? "underline" : "none",
                    color: s.text_color,
                    margin: "10px 0",
                    lineHeight: "1.4"
                }}
                >
                Example text
                </p>
            </div>

            {/* Buton delete */}
            <button 
                className="delete-card-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(s.id);
                }}
            >
                Delete
            </button>

          </div>
        ))}
      </div>

      <h2 style={{marginTop: '40px', borderTop: '2px solid #f1f5f9', paddingTop: '20px'}}>Create new style</h2>

      <div className="style-form">

        {/*nume stil*/}
        <input
          className="input-field"
          name="name"
          placeholder="Style name (e.g. My Title)"
          value={form.name}
          onChange={handleChange}
        />

        <div style={{display: 'flex', gap: '10px'}}>
            <div style={{flex: 1}}>
                <label>Font Family:</label>
                <select
                className="select-field"
                name="font_family"
                value={form.font_family}
                onChange={handleChange}
                >
                <option>Arial</option>
                <option>Times New Roman</option>
                <option>Verdana</option>
                <option>Courier New</option>
                <option>Georgia</option>
                <option>Tahoma</option>
                </select>
            </div>

            <div style={{width: '100px'}}>
                <label>Size:</label>
                <input
                className="input-field"
                type="number"
                name="font_size"
                value={form.font_size}
                onChange={handleChange}
                />
            </div>
        </div>

        {/* Checkboxes pe un rand */}
        <div style={{display: 'flex', gap: '20px', justifyContent: 'center', margin: '10px 0'}}>
            <label style={{cursor: 'pointer'}}>
            <input
                type="checkbox"
                name="bold"
                checked={form.bold}
                onChange={handleChange}
            /> Bold
            </label>

            <label style={{cursor: 'pointer'}}>
            <input
                type="checkbox"
                name="italic"
                checked={form.italic}
                onChange={handleChange}
            /> Italic
            </label>

            <label style={{cursor: 'pointer'}}>
            <input
                type="checkbox"
                name="underline"
                checked={form.underline}
                onChange={handleChange}
            /> Underline
            </label>
        </div>

        {/*color*/}
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <label>Text color:</label>
            <input
            type="color"
            name="text_color"
            value={form.text_color}
            onChange={handleChange}
            style={{height: '40px', width: '60px', border: 'none', background: 'transparent', cursor: 'pointer'}}
            />
        </div>

        {/*buton save*/}
        <button className="save-style-btn" onClick={saveStyle}>
          Create Style
        </button>

      </div>
    </div>
  );
}