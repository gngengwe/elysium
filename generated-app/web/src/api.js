const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

async function apiFetch(url, opts) {
  const r = await fetch(API_BASE + url, opts);
  if (!r.ok) throw new Error(`API error ${r.status}: ${url}`);
  return r.json();
}

export const getDemoClient           = ()         => apiFetch("/demo/client");
export const generateRecommendations = (clientId) => apiFetch(`/recommendations/generate?client_id=${clientId}`, { method: "POST" });
export const listRecommendations     = (clientId) => apiFetch(`/recommendations?client_id=${clientId}`);
export const getDocuments            = (clientId) => apiFetch(`/documents?client_id=${clientId}`);
export const getFields               = (clientId) => apiFetch(`/fields?client_id=${clientId}`);
export const getExportPackage        = (clientId) => apiFetch(`/export/package?client_id=${clientId}`);
