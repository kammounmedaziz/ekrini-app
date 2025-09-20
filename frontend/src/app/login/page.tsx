"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setToken(null);
    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Login successful!");
        setToken(data.token);
      } else {
        setMessage(data.message || "Login failed.");
      }
    } catch {
      setMessage("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>Email<br />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
        </label>
        <label>Password<br />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={{ width: "100%", marginBottom: 12 }} />
        </label>
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 8 }}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      {message && <div style={{ marginTop: 16 }}>{message}</div>}
      {token && (
        <div style={{ marginTop: 16, wordBreak: "break-all" }}>
          <strong>JWT Token:</strong>
          <div style={{ fontSize: 12 }}>{token}</div>
        </div>
      )}
    </div>
  );
}
