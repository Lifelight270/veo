const pad = (n) => String(n).padStart(2, "0");
export const fmt = (s) => {
  if (!isFinite(s)) return "0:00";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = Math.floor(s % 60);
  return `${h ? h + ":" + pad(m) : m}:${pad(x)}`;
};
export const views = (n = 0) =>
  `${Intl.NumberFormat("en", { notation: "compact" }).format(n)} view${n === 1 ? "" : "s"}`;
export const ago = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  for (const [n, v] of [["year", 31536e3], ["month", 2592e3], ["day", 86400], ["hour", 3600], ["minute", 60]])
    if (s >= v) { const k = Math.floor(s / v); return `${k} ${n}${k > 1 ? "s" : ""} ago`; }
  return "just now";
};
export const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
export const getProg = (id) => store.get("p:" + id, 0);
export const setProg = (id, t) => store.set("p:" + id, t);
