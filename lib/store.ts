// lib/store.ts
// Hack aby globalny stan przetrwał przeładowania w trakcie dewelopmentu
const globalForStore = global as unknown as {
  clients: Map<string, { id: string, ip: string, lastSeen: number, messages: string[], explorerData: any, downloadData: any, cameraData: string | null, isCameraActive: boolean }>
};

export const clients = globalForStore.clients || new Map();
if (process.env.NODE_ENV !== 'production') globalForStore.clients = clients;
