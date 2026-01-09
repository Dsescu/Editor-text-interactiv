import { useState } from "react";
import { register } from "../api/api";
import { useNavigate } from "react-router-dom";


export default function Register() {
  const nav = useNavigate();

  // date
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // functie register
  async function handleRegister(e) {
    e.preventDefault();
    try {
      await register(form.username, form.email, form.password); // trimit date
      alert("Account created!");
      nav("/"); // mergem la login
    } catch {
      alert("Registration failed");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Sign in to continue</p>

        <form onSubmit={handleRegister}>
          <input
            name="username"
            placeholder="Username"
            className="auth-input"
            onChange={handleChange}
            required
          />

          <input
            name="email"
            placeholder="Email"
            type="email"
            className="auth-input"
            onChange={handleChange}
            required
          />

          <input
            name="password"
            placeholder="Password"
            type="password"
            className="auth-input"
            onChange={handleChange}
            required
          />

          <button className="auth-btn">Register</button>
        </form>

        {/*link la login*/}
        <p className="auth-switch">
          Already have an account?{" "}
          <span className="auth-link" onClick={() => nav("/")}>
            Login
          </span>
        </p>

      </div>
    </div>
  );
}
