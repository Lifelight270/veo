import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import { Card, Icon, I } from "./ui";
import Upload from "./Upload";
import Watch from "./Watch";

export default function App() {
  const [videos, setVideos] = useState(null), [err, setErr] = useState(false), [q, setQ] = useState(""), [sort, setSort] = useState("new");
  const [up, setUp] = useState(false), [hash, setHash] = useState(location.hash), search = useRef();

  const load = useCallback(() => api.get("/videos").then((r) => { setVideos(r.data); setErr(false); }).catch(() => setErr(true)), []);
  useEffect(() => {
    load();
    const h = () => { setHash(location.hash); scrollTo(0, 0); };
    const k = (e) => { if (e.key === "/" && !e.target.matches("input,textarea")) { e.preventDefault(); search.current.focus(); } };
    addEventListener("hashchange", h); addEventListener("keydown", k);
    return () => { removeEventListener("hashchange", h); removeEventListener("keydown", k); };
  }, [load]);

  const id = hash.match(/^#\/watch\/(.+)$/)?.[1];
  const list = useMemo(() => (videos || [])
    .filter((v) => (v.title + " " + v.description).toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (sort === "top" ? b.views - a.views : new Date(b.createdAt) - new Date(a.createdAt))), [videos, q, sort]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/95">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-4 md:px-8">
          <a href="#/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-xl bg-acc shadow-[0_0_18px_rgb(94_234_212/0.2)]" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="size-4 text-bg" fill="currentColor"><path d="M8 5.75c0-.58.64-.94 1.14-.64l9.22 5.52a1.6 1.6 0 0 1 0 2.74l-9.22 5.52c-.5.3-1.14-.06-1.14-.64z" /></svg>
            </span>
            Veo
          </a>
          <label className="mx-auto flex h-10 w-full max-w-lg items-center gap-2 rounded-full border border-line bg-s1 px-4 focus-within:border-acc">
            <Icon d={I.search} s={18} />
            <input ref={search} value={q} onChange={(e) => { setQ(e.target.value); if (id) location.hash = "#/"; }} type="search" placeholder="Search" aria-label="Search videos" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-mute" />
            <kbd className="hidden rounded border border-line px-1.5 text-xs text-mute sm:block">/</kbd>
          </label>
          <button onClick={() => setUp(true)} className="flex h-10 items-center gap-2 rounded-full bg-fg px-4 text-sm font-medium text-bg"><Icon d={I.upload} s={16} /><span className="hidden sm:inline">Upload</span></button>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-8">
        {err ? (
          <div className="py-24 text-center"><p className="text-mute">Can’t reach the server. Make sure the backend and MongoDB are running.</p>
            <button onClick={load} className="mt-4 rounded-full bg-s2 px-5 py-2 text-sm hover:bg-line">Try again</button></div>
        ) : id ? (
          <Watch id={id} videos={videos || []} onChanged={load} />
        ) : (
          <>
            <div className="mb-6 flex gap-2" role="tablist">
              {[["new", "Latest"], ["top", "Popular"]].map(([k, l]) => (
                <button key={k} role="tab" aria-selected={sort === k} onClick={() => setSort(k)} className={`rounded-full px-4 py-1.5 text-sm transition ${sort === k ? "bg-fg text-bg" : "bg-s2 text-mute hover:text-fg"}`}>{l}</button>
              ))}
            </div>
            {videos === null ? (
              <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {[...Array(8)].map((_, i) => <div key={i} className="aspect-video animate-pulse rounded-xl bg-s1" />)}</div>
            ) : list.length ? (
              <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{list.map((v) => <Card key={v.id} v={v} />)}</div>
            ) : (
              <div className="py-24 text-center"><p className="text-mute">{q ? `No results for “${q}”.` : "No videos yet."}</p>
                {!q && <button onClick={() => setUp(true)} className="mt-4 rounded-full bg-fg px-5 py-2 text-sm font-medium text-bg">Upload your first video</button>}</div>
            )}
          </>
        )}
      </main>
      {up && <Upload onClose={() => setUp(false)} onDone={(nid) => { setUp(false); load().then(() => (location.hash = `#/watch/${nid}`)); }} />}
    </>
  );
}
