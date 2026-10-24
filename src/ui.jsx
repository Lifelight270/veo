import { useState } from "react";
import { src } from "./api";
import { fmt, views, ago, getProg } from "./lib";

export const I = {
  play: "M8 5v14l11-7z", pause: "M6 5h4v14H6zm8 0h4v14h-4z",
  vol: "M11 5 6 9H3v6h3l5 4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12",
  mute: "M11 5 6 9H3v6h3l5 4zM22 9l-6 6m0-6 6 6",
  full: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  pip: "M3 5h18v14H3zM12 12h6v4h-6z", theater: "M3 7h18v10H3z",
  like: "M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.7A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z",
  share: "M12 3v12M7 8l5-5 5 5M5 14v6h14v-6", trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4-4", upload: "M12 16V4M7 9l5-5 5 5M5 20h14",
  close: "M6 6l12 12M18 6 6 18",
};
export const Icon = ({ d, fill, s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

export function Card({ v, compact }) {
  const [dur, setDur] = useState(0);
  const prog = getProg(v.id);
  return (
    <a href={`#/watch/${v.id}`} className={`group ${compact ? "flex gap-3" : "block"}`}>
      <div className={`relative aspect-video overflow-hidden rounded-xl bg-s1 ring-1 ring-line transition group-hover:ring-white/25 ${compact ? "w-40 shrink-0" : ""}`}>
        <video src={`${src(v.id)}#t=1`} preload="metadata" muted playsInline onLoadedMetadata={(e) => setDur(e.target.duration)} className="size-full object-cover" />
        {dur > 0 && <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs tabular-nums">{fmt(dur)}</span>}
        {prog > 3 && dur > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20"><div className="h-full bg-acc" style={{ width: `${Math.min(100, (prog / dur) * 100)}%` }} /></div>
        )}
      </div>
      <div className={compact ? "min-w-0" : "mt-3"}>
        <h3 className={`line-clamp-2 font-medium leading-snug ${compact ? "text-sm" : ""}`}>{v.title}</h3>
        <p className="mt-1 text-sm text-mute">{views(v.views)} · {ago(v.createdAt)}</p>
      </div>
    </a>
  );
}
