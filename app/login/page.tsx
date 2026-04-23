"use client";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json();
        setError(data.error || "Nieprawidłowe dane logowania.");
      }
    } catch (err) {
      setError("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "16px", padding: "3rem 2rem",
        width: "90%", maxWidth: "400px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        textAlign: "center"
      }}>
        <h1 style={{ color: "#f8fafc", margin: "0 0 0.5rem 0", fontSize: "2rem", fontWeight: "800" }}>Wymagana Autoryzacja</h1>
        <p style={{ color: "#94a3b8", marginBottom: "2rem", fontSize: "0.9rem" }}>Dostęp do panelu dowodzenia jest strzeżony.</p>
        
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input 
              type="text" 
              placeholder="Nazwa użytkownika" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              style={{
                width: "100%", padding: "1rem", borderRadius: "8px", boxSizing: "border-box",
                background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "white", fontSize: "1rem", outline: "none", transition: "border 0.2s"
              }}
            />
            <input 
              type="password" 
              placeholder="Hasło" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{
                width: "100%", padding: "1rem", borderRadius: "8px", boxSizing: "border-box",
                background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "white", fontSize: "1rem", outline: "none", transition: "border 0.2s"
              }}
            />
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: 0, fontWeight: "500" }}>{error}</p>}
          
          <button 
            type="submit"
            disabled={loading}
            style={{
              padding: "1rem", borderRadius: "8px", border: "none", cursor: loading ? "not-allowed" : "pointer",
              background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)", color: "white",
              fontWeight: "bold", fontSize: "1rem", boxShadow: "0 4px 15px rgba(37, 99, 235, 0.4)",
              transition: "transform 0.1s, opacity 0.2s", opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Autoryzacja..." : "Odblokuj dostęp"}
          </button>
        </form>

      </div>
    </div>
  );
}
