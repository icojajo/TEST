"use client";
import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState<{ [key: string]: string }>({});

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin');
      const data = await res.json();
      setClients(data.clients || []);
    } catch(e) {}
  };

  useEffect(() => {
    fetchClients();
    const interval = setInterval(fetchClients, 3000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (id: string) => {
    const text = msgInput[id];
    if (!text) return;

    await fetch('/api/admin', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, message: text })
    });
    
    setMsgInput(prev => ({ ...prev, [id]: "" }));
    fetchClients();
  };

  return (
    <div style={{ minHeight: "100vh", padding: "3rem", background: "linear-gradient(135deg, #0f172a 0%, #172033 100%)", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        <header style={{ marginBottom: "3rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "800", color: "#e2e8f0", margin: 0, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            Moje komputery <span style={{ color: "#3b82f6" }}>Live</span>
          </h1>
          <p style={{ color: "#94a3b8", marginTop: "0.5rem", fontSize: "1.1rem" }}>
            Monitoruj aktywne maszyny C++ i wysyłaj do nich zadania (Ping: co minutę)
          </p>
        </header>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
          {clients.length === 0 ? (
            <div style={{ padding: "3rem", gridColumn: "1/-1", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
              <div style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ef4444", marginBottom: "1rem", boxShadow: "0 0 10px #ef4444" }}></div>
              <p style={{ color: "#94a3b8", fontSize: "1.2rem", margin: 0 }}>Oczekiwanie na sygnał od jakiegokolwiek komputera...</p>
            </div>
          ) : (
            clients.map(client => (
              <div key={client.id} style={{ 
                background: "rgba(255, 255, 255, 0.05)", 
                backdropFilter: "blur(10px)",
                borderRadius: "16px", 
                border: "1px solid rgba(255,255,255,0.1)", 
                padding: "1.5rem",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                transition: "transform 0.2s"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "1.4rem" }}>{client.id}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", color: "#22c55e", fontWeight: "600" }}>Aktywny</span>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#22c55e", boxShadow: "0 0 8px #22c55e" }}></div>
                  </div>
                </div>

                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#cbd5e1" }}><strong>IP:</strong> <span style={{ color: "#38bdf8" }}>{client.ip}</span></p>
                  <p style={{ margin: 0, color: "#cbd5e1" }}><strong>Ostatni ping:</strong> {new Date(client.lastSeen).toLocaleTimeString()}</p>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  <input 
                    type="text" 
                    placeholder="Wpisz komendę np. RESTART"
                    value={msgInput[client.id] || ""}
                    onChange={(e) => setMsgInput({ ...msgInput, [client.id]: e.target.value })}
                    style={{ 
                      padding: "0.8rem 1rem", 
                      borderRadius: "8px", 
                      border: "1px solid rgba(255,255,255,0.1)", 
                      background: "rgba(0,0,0,0.3)", 
                      color: "white",
                      outline: "none",
                      fontSize: "1rem"
                    }}
                  />
                  <button 
                    onClick={() => sendMessage(client.id)}
                    style={{ 
                      padding: "0.8rem", 
                      borderRadius: "8px", 
                      border: "none",
                      background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "1rem",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(37, 99, 235, 0.4)",
                      transition: "opacity 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                    onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    Wyślij zadanie
                  </button>
                  {client.messages.length > 0 && (
                    <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "rgba(234, 179, 8, 0.1)", border: "1px solid rgba(234, 179, 8, 0.3)", borderRadius: "6px" }}>
                      <p style={{ color: "#eab308", fontSize: "0.85rem", margin: 0, textAlign: "center" }}>
                        Oczekujące zadania w kolejce: <strong>{client.messages.length}</strong>
                      </p>
                    </div>
                  )}

                  {/* File Explorer Section */}
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <h4 style={{ color: "#f8fafc", marginBottom: "0.5rem" }}>Eksplorator Plików</h4>
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1rem" }}>
                        Otwórz menedżera plików dla tego urządzenia aby przeglądać zawartość dysku, podobnie jak w systemie Windows.
                    </p>
                    <button 
                        onClick={() => window.location.href = `/explorer/${client.id}`}
                        style={{ 
                          width: "100%",
                          padding: "0.8rem 1rem", 
                          borderRadius: "4px", 
                          border: "none",
                          background: "#10b981",
                          color: "white",
                          fontWeight: "bold",
                          cursor: "pointer",
                          boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
                          transition: "background 0.2s"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = "#059669"}
                        onMouseOut={(e) => e.currentTarget.style.background = "#10b981"}
                    >
                        📂 Otwórz Menedżer Plików
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
