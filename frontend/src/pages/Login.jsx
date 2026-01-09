import { useState } from "react";
import { login } from "../api/api";
import { useNavigate } from "react-router-dom";


export default function Login() {
  const nav = useNavigate();

  // valori username si parola
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // login
  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await login(username, password); // trimit la backend

      // salvare token-uri
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      nav("/dashboard"); // daca e ok trecem la dashboard
    } catch {
      alert("Login failed. Check your username or password.");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Log in to continue</p>

        {/*login*/}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            className="auth-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="auth-btn">Login</button>
        </form>

        {/*link la register*/}
        <p className="auth-switch">
          Don't have an account?{" "}
          <span className="auth-link" onClick={() => nav("/register")}>
            Register
          </span>
        </p>

      </div>
    </div>
  );
}
