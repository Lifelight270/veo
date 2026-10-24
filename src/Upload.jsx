import { useEffect, useState } from "react";
import { api } from "./api";
import { Icon, I } from "./ui";

export default function Upload({ onClose, onDone }) {
  const [file, setFile] = useState(null), [title, setTitle] = useState(""), [desc, setDesc] = useState("");
  const [pct, setPct] = useState(0), [busy, setBusy] = useState(false), [err, setErr] = useState(""), [drag, setDrag] = useState(false);
  useEffect(() => { const k = (e) => e.key === "Escape" && !busy && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [busy, onClose]);

  const pick = (f) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) return setErr("Please choose a video file.");
    setErr(""); setFile(f); setTitle((t) => t || f.name.replace(/\.[^.]+$/, ""));
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setErr("Choose a video first.");
    const fd = new FormData();
    fd.append("title", title); fd.append("description", desc); fd.append("file", file);
    setBusy(true); setErr("");
    try {
      const r = await api.post("/upload", fd, { onUploadProgress: (p) => setPct(Math.round((p.loaded / (p.total || file.size)) * 100)) });
      onDone(r.data.id);
    } catch (x) { setErr(x.response?.data?.error || "Upload failed. Is the server running?"); setBusy(false); }
  };
  const field = "w-full rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-acc";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form onSubmit={submit} role="dialog" aria-label="Upload video" className="w-full max-w-lg rounded-2xl border border-line bg-s1 p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload video</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="rounded-lg p-1.5 text-mute hover:bg-white/10 hover:text-fg"><Icon d={I.close} /></button>
        </div>
        <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
          className={`mb-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition ${drag ? "border-acc bg-acc/5" : "border-line hover:border-mute"}`}>
          <Icon d={I.upload} s={26} />
          <span className="text-sm">{file ? file.name : "Drop a video here or click to browse"}</span>
          <span className="text-xs text-mute">{file ? `${(file.size / 1048576).toFixed(1)} MB` : "MP4 or WebM, up to 2 GB"}</span>
          <input type="file" accept="video/*" hidden onChange={(e) => pick(e.target.files[0])} />
        </label>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Title" className={field} aria-label="Title" />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Description (optional)" className={field + " resize-none"} aria-label="Description" />
        </div>
        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        {busy && <div className="mt-4"><div className="h-1.5 overflow-hidden rounded bg-line"><div className="h-full bg-acc transition-[width]" style={{ width: pct + "%" }} /></div>
          <p className="mt-1.5 text-xs text-mute">{pct < 100 ? `Uploading ${pct}%` : "Processing…"}</p></div>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full px-4 py-2 text-sm text-mute hover:text-fg">Cancel</button>
          <button disabled={busy || !file} className="rounded-full bg-fg px-5 py-2 text-sm font-medium text-bg disabled:opacity-40">{busy ? "Uploading…" : "Publish"}</button>
        </div>
      </form>
    </div>
  );
}
