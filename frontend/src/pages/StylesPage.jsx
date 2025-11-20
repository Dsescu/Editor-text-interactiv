import { useEffect, useState } from "react";
import { fetchStyles, createStyle } from "../api/api";
import { useNavigate } from "react-router-dom";
import "../styles/myStyles.css";


export default function StylesPage() {
  const nav = useNavigate();

  const [stylesList, setStylesList] = useState([]); //lista stiluri

  const [form, setForm] = useState({
    name: "",
    font_family: "Arial",
    font_size: 16,
    bold: false,
    italic: false,
    underline: false,
    text_color: "#000000",
  });

  //incarcam stiluri din backend
  async function load() {
    const res = await fetchStyles();
    setStylesList(res.data);
  }

  //incarcare o singura data
  useEffect(() => {
    load();
  }, []);

  //actualizare formular
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  //salvare stil nou
  async function saveStyle() {
    if (!form.name) {
      alert("Please enter a name for the style!");
      return;
    }

    await createStyle(form);
    load(); //reload lista de stiluri
    alert("Style created!");
  }

  return (
    <div className="styles-container">

      {/*buton back*/}
      <button className="back-btn" onClick={() => nav("/dashboard")}>
        ← Back
      </button>

      <h1>Your Styles</h1>

      {/*afisare lista stiluri*/}
      <div className="styles-grid">
        {stylesList.map((s) => (
          <div key={s.id} className="style-card">

            <h3>{s.name}</h3>

            {/*text exemplu*/}
            <p
              style={{
                fontFamily: s.font_family,
                fontSize: s.font_size,
                fontWeight: s.bold ? "bold" : "normal",
                fontStyle: s.italic ? "italic" : "normal",
                textDecoration: s.underline ? "underline" : "none",
                color: s.text_color,
              }}
            >
              Example text
            </p>
          </div>
        ))}
      </div>

      <h2>Create new style</h2>

      <div className="style-form">

        {/*nume stil*/}
        <input
          className="input-field"
          name="name"
          placeholder="Style name"
          value={form.name}
          onChange={handleChange}
        />

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
          <option>Georgia</option>
        </select>

        {/*font size*/}
        <label>Font Size:</label>
        <input
          className="input-field"
          type="number"
          name="font_size"
          value={form.font_size}
          onChange={handleChange}
        />

        {/*bold*/}
        <label>
          <input
            type="checkbox"
            name="bold"
            checked={form.bold}
            onChange={handleChange}
          />
          Bold
        </label>

        {/*italic*/}
        <label>
          <input
            type="checkbox"
            name="italic"
            checked={form.italic}
            onChange={handleChange}
          />
          Italic
        </label>

        {/*underline*/}
        <label>
          <input
            type="checkbox"
            name="underline"
            checked={form.underline}
            onChange={handleChange}
          />
          Underline
        </label>

        {/*color*/}
        <label>Text color:</label>
        <input
          type="color"
          name="text_color"
          value={form.text_color}
          onChange={handleChange}
        />

        {/*buton save*/}
        <button className="save-style-btn" onClick={saveStyle}>
          Save
        </button>

      </div>
    </div>
  );
}
