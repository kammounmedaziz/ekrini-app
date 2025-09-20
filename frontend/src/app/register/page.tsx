"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("http://localhost:3001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          profile: {
            firstName,
            lastName,
            phone,
            driverLicense,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Registration successful!");
      } else {
        setMessage(data.message || "Registration failed.");
      }
    } catch {
      setMessage("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <label>Email<br />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
        </label>
        <label>Password<br />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={{ width: "100%", marginBottom: 12 }} />
        </label>
        <label>First Name<br />
          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
        </label>
        <label>Last Name<br />
          <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
        </label>
        <label>Phone<br />
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
        </label>
        <label>Driver License<br />
          <input type="text" value={driverLicense} onChange={e => setDriverLicense(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
        </label>
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 8 }}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      {message && <div style={{ marginTop: 16 }}>{message}</div>}
    </div>
  );
}
