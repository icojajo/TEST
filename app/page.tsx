"use client";
import { useState, useEffect, useRef } from 'react';

// --- Icons ---
const MonitorIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

export default function AdminPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeClientData, setActiveClientData] = useState<any>(null);
  const [msgInput, setMsgInput] = useState("");
  const [loading, setLoading] = useState(true);

  // Poll all clients for the dashboard grid
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch('/api/admin');
        const data = await res.json();
        setClients(data.clients || []);
        setLoading(false);
      } catch (e) {}
    };
    fetchAll();
    const interval = setInterval(fetchAll, 3000); // Slower update for grid
    return () => clearInterval(interval);
  }, []);

  // High-frequency poll for selected client (Live Monitor)
  useEffect(() => {
    if (!selectedClientId) {
      setActiveClientData(null);
      return;
    }

    const fetchSingle = async () => {
      try {
        const res = await fetch(`/api/admin/${selectedClientId}`);
        const data = await res.json();
        setActiveClientData(data);
      } catch (e) {}
    };

    fetchSingle();
    const interval = setInterval(fetchSingle, 100); // 10 FPS polling for UI (20 FPS data available)
    return () => clearInterval(interval);
  }, [selectedClientId]);

  const sendMessage = async (id: string) => {
    if (!msgInput) return;
    await fetch('/api/admin', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, message: msgInput })
    });
    setMsgInput("");
    // Refresh
    const res = await fetch('/api/admin');
    const data = await res.json();
    setClients(data.clients || []);
  };

  const toggleAction = async (id: string, action: string) => {
    await fetch('/api/admin', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, message: action })
    });
  };

  const selectedClient = clients.find(c => c.id === selectedClientId) || activeClientData;

  return (
    <div className="container">
      <style jsx>{`
        .container {
          min-height: 100vh;
          background: radial-gradient(circle at top left, #1e293b, #0f172a);
          color: #f8fafc;
          font-family: 'Outfit', 'Inter', sans-serif;
          padding: 2rem;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }
        .title {
          font-size: 2.2rem;
          font-weight: 800;
          background: linear-gradient(to right, #38bdf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .pc-box {
          aspect-ratio: 1/1;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .pc-box:hover {
          background: rgba(255, 255, 255, 0.07);
          transform: translateY(-5px);
          border-color: #38bdf8;
          box-shadow: 0 10px 30px -10px rgba(56, 189, 248, 0.3);
        }
        .pc-box .icon {
          color: #94a3b8;
          transition: color 0.3s;
          margin-bottom: 1rem;
        }
        .pc-box:hover .icon {
          color: #38bdf8;
        }
        .pc-label {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .status-dot {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 10px #22c55e;
        }

        /* Dashboard View */
        .dashboard {
          max-width: 1400px;
          margin: 0 auto;
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.6rem 1.2rem;
          border-radius: 12px;
          cursor: pointer;
          color: #94a3b8;
          margin-bottom: 2rem;
          transition: 0.2s;
        }
        .back-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        .main-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 2rem;
        }
        .screen-container {
          background: #020617;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          aspect-ratio: 16/9;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .screen-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
        }
        .card-title {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-bottom: 1rem;
          font-weight: 700;
        }
        .btn-primary {
          background: #38bdf8;
          color: #0f172a;
          border: none;
          padding: 0.8rem;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
          width: 100%;
        }
        .btn-primary:hover {
          background: #7dd3fc;
          transform: scale(1.02);
        }
        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.8rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
          width: 100%;
          margin-top: 0.5rem;
        }
        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .input {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.8rem;
          border-radius: 12px;
          color: white;
          width: 100%;
          margin-bottom: 0.8rem;
          outline: none;
        }
        .input:focus {
          border-color: #38bdf8;
        }
        .live-tag {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(239, 68, 68, 0.9);
          padding: 0.3rem 0.8rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 800;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>

      {!selectedClientId ? (
        <div className="home-view">
          <header className="header">
            <div>
              <h1 className="title">Control Center</h1>
              <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Wybierz jednostkę do zarządzania</p>
            </div>
            <div style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", padding: "0.5rem 1rem", borderRadius: "100px", fontSize: "0.9rem", fontWeight: "600" }}>
              {clients.length} Aktywnych
            </div>
          </header>

          {loading ? (
             <div style={{ textAlign: "center", padding: "5rem" }}>Ładowanie systemu...</div>
          ) : (
            <div className="grid">
              {clients.map(client => (
                <div key={client.id} className="pc-box" onClick={() => setSelectedClientId(client.id)}>
                  <div className="status-dot"></div>
                  <div className="icon">
                    <MonitorIcon />
                  </div>
                  <span className="pc-label">{client.id}</span>
                </div>
              ))}
              {clients.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem", background: "rgba(255,255,255,0.02)", borderRadius: "24px" }}>
                   Oczekiwanie na połączenia...
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="dashboard">
          <button className="back-btn" onClick={() => setSelectedClientId(null)}>
            <BackIcon /> Powrót do listy
          </button>

          <div className="main-layout">
            <div className="content-area">
              <div className="screen-container">
                {selectedClient?.isScreenActive ? (
                  <>
                    {selectedClient?.screenData ? (
                      <img src={`data:image/jpeg;base64,${selectedClient.screenData}`} className="screen-img" alt="Screen" />
                    ) : (
                       <div style={{ color: "#475569" }}>Inicjalizacja strumienia...</div>
                    )}
                    <div className="live-tag">LIVE 20 FPS</div>
                  </>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#475569", marginBottom: "1rem" }}>Monitor wyłączony</div>
                    <button className="btn-primary" style={{ width: "auto", padding: "0.8rem 2rem" }} onClick={() => toggleAction(selectedClientId, "SCREEN:START")}>
                       Uruchom Podgląd
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div className="card">
                  <div className="card-title">Kamera Systemowa</div>
                  <div style={{ height: "200px", background: "#020617", borderRadius: "12px", overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                     {selectedClient?.isCameraActive ? (
                       selectedClient?.cameraData ? (
                        <img src={`data:image/jpeg;base64,${selectedClient.cameraData}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Cam" />
                       ) : (
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Oczekiwanie na klatki...</div>
                       )
                     ) : (
                       <button className="btn-outline" style={{ width: "auto" }} onClick={() => toggleAction(selectedClientId, "CAMERA:START")}>Włącz kamerę</button>
                     )}
                     {selectedClient?.isCameraActive && <div className="live-tag" style={{ background: "#a855f7" }}>CAM</div>}
                  </div>
                  {selectedClient?.isCameraActive && (
                    <button className="btn-outline" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }} onClick={() => toggleAction(selectedClientId, "CAMERA:STOP")}>Zatrzymaj kamerę</button>
                  )}
                </div>

                <div className="card">
                  <div className="card-title">Szybkie Dowodzenie</div>
                  <input 
                    className="input" 
                    placeholder="Wpisz komendę..." 
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                  />
                  <button className="btn-primary" onClick={() => sendMessage(selectedClientId)}>Wyślij Komendę</button>
                  <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#64748b" }}>
                    Przydatne: RESTART, WALLPAPER:C:\img.jpg, MKDIR:C:\Test
                  </div>
                </div>
              </div>
            </div>

            <div className="sidebar">
              <div className="card">
                <div className="card-title">Informacje o systemie</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                   <div>
                     <div style={{ fontSize: "0.75rem", color: "#64748b" }}>IDENTYFIKATOR</div>
                     <div style={{ fontWeight: "600" }}>{selectedClient?.id}</div>
                   </div>
                   <div>
                     <div style={{ fontSize: "0.75rem", color: "#64748b" }}>ADRES IP</div>
                     <div style={{ fontWeight: "600", color: "#38bdf8" }}>{selectedClient?.ip || "Ukryty"}</div>
                   </div>
                   <div>
                     <div style={{ fontSize: "0.75rem", color: "#64748b" }}>OSTATNI PING</div>
                     <div style={{ fontWeight: "600" }}>{selectedClient?.lastSeen ? new Date(selectedClient.lastSeen).toLocaleTimeString() : "-"}</div>
                   </div>
                </div>
              </div>

              <div className="card">
                <div className="card-title">Narzędzia</div>
                <button className="btn-outline" onClick={() => window.location.href = `/explorer/${selectedClientId}`}>📂 Menedżer Plików</button>
                <button className="btn-outline" onClick={() => toggleAction(selectedClientId, "SCREEN:STOP")} style={{ color: "#ef4444" }}>⏹ Zatrzymaj Monitor</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
