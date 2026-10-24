import { useEffect, useRef, useState } from "react";
import { api, src } from "./api";
import { fmt, views, ago, store, getProg, setProg } from "./lib";
import { Icon, I, Card } from "./ui";

const RATES = [1, 1.25, 1.5, 2, 0.5, 0.75];
const Btn = ({ d, fill, label, on, ...p }) => (
  <button {...p} aria-label={label} title={label} className={`grid size-9 place-items-center rounded-lg transition hover:bg-white/15 ${on ? "text-acc" : ""}`}><Icon d={d} fill={fill} /></button>
);

function Player({ v, theater, setTheater }) {
  const el = useRef(), box = useRef(), idleT = useRef(), last = useRef(0);
  const [playing, setPlaying] = useState(false), [t, setT] = useState(0), [d, setD] = useState(0);
  const [vol, setVol] = useState(store.get("vol", 1)), [muted, setMuted] = useState(false), [ri, setRi] = useState(0), [idle, setIdle] = useState(false);

  const toggle = () => (el.current.paused ? el.current.play() : el.current.pause());
  const fullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : box.current.requestFullscreen());
  const wake = () => { setIdle(false); clearTimeout(idleT.current); idleT.current = setTimeout(() => setIdle(true), 2500); };

  useEffect(() => { el.current.volume = vol; store.set("vol", vol); }, [vol]);
  useEffect(() => { el.current.muted = muted; }, [muted]);
  useEffect(() => {
    const key = (e) => {
      if (e.target.matches("textarea,input[type=text]") || e.ctrlKey || e.metaKey) return;
      const k = e.key.toLowerCase(), p = el.current;
      const map = { " ": toggle, k: toggle, arrowright: () => (p.currentTime += 5), arrowleft: () => (p.currentTime -= 5),
        l: () => (p.currentTime += 10), j: () => (p.currentTime -= 10), m: () => setMuted((x) => !x), f: fullscreen, t: () => setTheater((x) => !x) };
      if (map[k]) { e.preventDefault(); map[k](); wake(); }
    };
    addEventListener("keydown", key);
    return () => { removeEventListener("keydown", key); clearTimeout(idleT.current); if (el.current?.currentTime) setProg(v.id, el.current.currentTime); };
  }, []);

  return (
    <div ref={box} onMouseMove={wake} className={`relative aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-line ${idle && playing ? "cursor-none" : ""}`}>
      <video ref={el} src={src(v.id)} autoPlay playsInline onClick={toggle} className="size-full"
        onPlay={() => { setPlaying(true); wake(); }} onPause={() => { setPlaying(false); setIdle(false); }}
        onLoadedMetadata={(e) => { setD(e.target.duration); const s = getProg(v.id); if (s > 3 && s < e.target.duration - 5) e.target.currentTime = s; }}
        onTimeUpdate={(e) => { const c = e.target.currentTime; setT(c); if (Math.abs(c - last.current) > 3) { setProg(v.id, c); last.current = c; } }}
        onEnded={() => setProg(v.id, 0)} />
      {!playing && <button onClick={toggle} aria-label="Play" className="absolute inset-0 m-auto grid size-16 place-items-center rounded-full bg-black/60"><Icon d={I.play} fill s={28} /></button>}
      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-12 transition-opacity ${idle && playing ? "pointer-events-none opacity-0" : ""}`}>
        <input type="range" className="rng" min={0} max={d || 1} step={0.1} value={t} aria-label="Seek" style={{ "--p": `${(t / (d || 1)) * 100}%` }}
          onChange={(e) => { el.current.currentTime = +e.target.value; }} />
        <div className="mt-1 flex items-center gap-0.5">
          <Btn d={playing ? I.pause : I.play} fill label={playing ? "Pause (k)" : "Play (k)"} onClick={toggle} />
          <Btn d={muted || !vol ? I.mute : I.vol} label="Mute (m)" onClick={() => setMuted((x) => !x)} />
          <input type="range" className="rng w-20" min={0} max={1} step={0.05} value={muted ? 0 : vol} aria-label="Volume" style={{ "--p": `${(muted ? 0 : vol) * 100}%` }}
            onChange={(e) => { setVol(+e.target.value); setMuted(false); }} />
          <span className="ml-3 text-xs tabular-nums text-white/80">{fmt(t)} / {fmt(d)}</span>
          <span className="flex-1" />
          <button onClick={() => { const n = (ri + 1) % RATES.length; setRi(n); el.current.playbackRate = RATES[n]; }} className="h-9 min-w-10 rounded-lg px-2 text-sm hover:bg-white/15" title="Playback speed">{RATES[ri]}×</button>
          {document.pictureInPictureEnabled && <Btn d={I.pip} label="Picture in picture" onClick={() => el.current.requestPictureInPicture()} />}
          <Btn d={I.theater} label="Theater mode (t)" on={theater} onClick={() => setTheater((x) => !x)} />
          <Btn d={I.full} label="Fullscreen (f)" onClick={fullscreen} />
        </div>
      </div>
    </div>
  );
}

export default function Watch({ id, videos, onChanged }) {
  const [v, setV] = useState(null), [bad, setBad] = useState(false), [more, setMore] = useState(false), [copied, setCopied] = useState(false);
  const [theater, setTheater] = useState(store.get("theater", false)), [liked, setLiked] = useState(() => store.get("liked", []).includes(id));
  useEffect(() => store.set("theater", theater), [theater]);
  useEffect(() => {
    api.get(`/videos/${id}`).then((r) => {
      setV(r.data);
      if (!sessionStorage.getItem("v" + id)) { sessionStorage.setItem("v" + id, 1); api.post(`/videos/${id}/view`).catch(() => {}); setV((x) => ({ ...x, views: x.views + 1 })); }
    }).catch(() => setBad(true));
  }, [id]);

  if (bad) return <p className="py-24 text-center text-mute">This video isn’t available. <a href="#/" className="text-acc">Back home</a></p>;
  if (!v) return <div className="aspect-video animate-pulse rounded-2xl bg-s1" />;

  const like = () => {
    const all = store.get("liked", []), on = !liked;
    store.set("liked", on ? [...all, id] : all.filter((x) => x !== id));
    setLiked(on); setV((x) => ({ ...x, likes: Math.max(0, x.likes + (on ? 1 : -1)) }));
    api.post(`/videos/${id}/like`, { delta: on ? 1 : -1 }).catch(() => {});
  };
  const share = async () => { try { await navigator.clipboard.writeText(location.href); } catch {} setCopied(true); setTimeout(() => setCopied(false), 1600); };
  const del = async () => { if (!confirm("Delete this video permanently?")) return; await api.delete(`/videos/${id}`); onChanged(); location.hash = "#/"; };
  const pill = "flex h-10 items-center gap-2 rounded-full bg-s2 px-4 text-sm transition hover:bg-line";

  return (
    <div className="grid gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className={theater ? "lg:col-span-2" : ""}><Player key={id} v={v} theater={theater} setTheater={setTheater} /></div>
      <section>
        <h1 className="text-xl font-semibold leading-snug md:text-2xl">{v.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-auto text-sm text-mute">{views(v.views)} · {ago(v.createdAt)}</span>
          <button onClick={like} aria-pressed={liked} className={`${pill} ${liked ? "text-acc" : ""}`}><Icon d={I.like} fill={liked} s={18} />{v.likes || "Like"}</button>
          <button onClick={share} className={pill}><Icon d={I.share} s={18} />{copied ? "Link copied" : "Share"}</button>
          <button onClick={del} className={pill + " hover:text-red-400"} aria-label="Delete video"><Icon d={I.trash} s={18} /></button>
        </div>
        {v.description && (
          <div className="mt-5 rounded-xl bg-s1 p-4 text-sm leading-relaxed text-fg/85">
            <p className={`whitespace-pre-line ${more ? "" : "line-clamp-3"}`}>{v.description}</p>
            {v.description.length > 160 && <button onClick={() => setMore(!more)} className="mt-2 font-medium text-fg">{more ? "Show less" : "Show more"}</button>}
          </div>
        )}
      </section>
      <aside className={theater ? "" : "lg:row-span-2 lg:col-start-2 lg:row-start-1"}>
        <h2 className="mb-4 text-sm font-medium text-mute">Up next</h2>
        <div className="space-y-4">{videos.filter((x) => x.id !== id).map((x) => <Card key={x.id} v={x} compact />)}
          {videos.length < 2 && <p className="text-sm text-mute">Nothing else yet. Upload more videos.</p>}</div>
      </aside>
    </div>
  );
}
