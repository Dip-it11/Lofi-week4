import Link from "next/link";
import { asset } from "@/lib/asset";
import { componentLabel, type ComponentEntry } from "@/lib/registry";

export function ComponentCard({ entry }: { entry: ComponentEntry }) {
  return (
    <Link
      href={`/components/${entry.slug}/`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#cbbfe3] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand active:translate-y-0"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#f6f2fd]">
        <Thumbnail slug={entry.slug} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs font-semibold tracking-wide text-brand/70 uppercase">{componentLabel(entry)}</p>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground group-hover:text-brand">{entry.name}</h3>
          <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">{entry.category}</span>
        </div>
        <p className="text-sm leading-relaxed text-muted">{entry.summary}</p>
        <span className="mt-auto pt-2 text-sm font-medium text-brand">
          View component <span aria-hidden className="inline-block transition group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}

/** Small static artwork for each component card. */
function Thumbnail({ slug }: { slug: string }) {
  if (slug === "receipt-printer-toasts") {
    return (
      <svg aria-hidden viewBox="0 0 320 180" className="absolute inset-0 h-full w-full">
        <g className="transition-transform duration-500 group-hover:-translate-y-3">
          <path d="M112 30 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 V150 H112 Z" fill="#fbf8f1" stroke="#e7dcc7" />
          <text x="120" y="44" fontSize="7" fontWeight="700" letterSpacing="1.2" fill="#2a2236" fontFamily="ui-monospace, monospace">LOFISTACK</text>
          <text x="210" y="44" fontSize="6" textAnchor="end" fill="#2a2236" opacity=".6" fontFamily="ui-monospace, monospace">#0042</text>
          <line x1="120" x2="210" y1="50" y2="50" stroke="#2a2236" strokeOpacity=".35" strokeDasharray="3 2" />
          <circle cx="125" cy="61" r="5" fill="#1f8a4c" />
          <text x="135" y="64" fontSize="8" fontWeight="800" fill="#2a2236" fontFamily="ui-monospace, monospace">PAYMENT OK</text>
          {[76, 86, 96].map((y, i) => (
            <g key={y}>
              <rect x="120" y={y - 5} width={i === 2 ? 22 : 34} height="4" rx="1" fill="#2a2236" opacity=".45" />
              <line x1={i === 2 ? 146 : 158} x2="190" y1={y - 2} y2={y - 2} stroke="#2a2236" strokeOpacity=".35" strokeDasharray="1 2" />
              <rect x="192" y={y - 5} width="18" height="4" rx="1" fill="#2a2236" opacity=".7" />
            </g>
          ))}
          <g transform="rotate(-14 188 118)">
            <rect x="166" y="108" width="44" height="18" rx="3" fill="none" stroke="#1f8a4c" strokeWidth="2.5" />
            <text x="188" y="121.5" textAnchor="middle" fontSize="10" fontWeight="900" fill="#1f8a4c" letterSpacing="1">DONE</text>
          </g>
        </g>
        <rect x="92" y="142" width="136" height="30" rx="9" fill="#351367" />
        <rect x="100" y="146" width="120" height="4" rx="2" fill="#0b0414" />
        <circle cx="106" cy="161" r="3" fill="#34d399" />
        <rect x="114" y="159" width="38" height="4" rx="2" fill="#fff" opacity=".7" />
      </svg>
    );
  }
  if (slug === "filing-cabinet-faq") {
    return (
      <svg aria-hidden viewBox="0 0 320 180" className="absolute inset-0 h-full w-full">
        <rect x="96" y="10" width="128" height="164" rx="8" fill="#3d2d5c" />
        <rect x="104" y="16" width="40" height="10" rx="2" fill="#d9b26f" />
        {[34, 116, 146].map((y, i) => (
          <g key={y}>
            <rect x="102" y={y} width="116" height="24" rx="3" fill="#4d3b70" stroke="#000" strokeOpacity=".3" />
            <rect x="108" y={y + 5} width="70" height="14" rx="2" fill="#d9b26f" />
            <rect x="110" y={y + 7} width="66" height="10" rx="1" fill="#fdf8ee" />
            <rect x="113" y={y + 10} width={[44, 52, 38][i]} height="3" rx="1" fill="#2b2238" opacity=".5" />
            <rect x="188" y={y + 10} width="22" height="5" rx="2.5" fill="#d9b26f" />
          </g>
        ))}
        <g className="transition-transform duration-500 group-hover:translate-y-1">
          <rect x="106" y="62" width="108" height="50" fill="#140c1f" />
          <rect x="116" y="70" width="20" height="6" rx="1.5" fill="#ecd39c" />
          <rect x="112" y="75" width="96" height="37" rx="2" fill="#ecd39c" />
          {[84, 92, 100].map((y, i) => (
            <rect key={y} x="118" y={y} width={[80, 70, 50][i]} height="3" rx="1" fill="#2b2238" opacity=".45" />
          ))}
          <rect x="102" y="88" width="116" height="24" rx="3" fill="#4d3b70" stroke="#000" strokeOpacity=".3" />
          <rect x="108" y="93" width="70" height="14" rx="2" fill="#d9b26f" />
          <rect x="110" y="95" width="66" height="10" rx="1" fill="#fdf8ee" />
          <rect x="113" y="98" width="48" height="3" rx="1" fill="#2b2238" opacity=".5" />
          <rect x="188" y="98" width="22" height="5" rx="2.5" fill="#d9b26f" />
        </g>
      </svg>
    );
  }
  if (slug === "elevator-panel-navbar") {
    return (
      <svg aria-hidden viewBox="0 0 320 180" className="absolute inset-0 h-full w-full">
        <rect x="24" y="34" width="272" height="52" rx="10" fill="#24103f" stroke="#d9b26f" strokeWidth="2" />
        {[
          [30, 40],
          [290, 40],
          [30, 80],
          [290, 80],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="#d9b26f" opacity=".7" />
        ))}
        <path d="M40 76 A22 22 0 0 1 84 76 Z" fill="#170828" stroke="#d9b26f" strokeWidth="1.5" />
        <line x1="62" y1="76" x2="78" y2="66" stroke="#ffb347" strokeWidth="2" strokeLinecap="round" className="origin-[62px_76px] transition-transform duration-500 group-hover:rotate-[40deg]" />
        <circle cx="62" cy="76" r="2.5" fill="#d9b26f" />
        <path d="M94 54 l5 -7 l5 7 Z" fill="#ffb347" />
        <path d="M94 66 l5 7 l5 -7 Z" fill="#5a4570" />
        {["L", "1", "2", "3", "4"].map((b, i) => (
          <g key={b}>
            <circle cx={140 + i * 34} cy="56" r="11" fill={i === 2 ? "#ffb347" : "#d9b26f"} stroke="#24103f" strokeWidth="2" opacity={i === 2 ? 1 : 0.85} />
            <text x={140 + i * 34} y="60" textAnchor="middle" fontSize="10" fontWeight="800" fill="#24103f" fontFamily="ui-sans-serif, system-ui">
              {b}
            </text>
            <rect x={130 + i * 34} y="72" width="20" height="3" rx="1.5" fill="#f3e6ff" opacity=".35" />
          </g>
        ))}
        <g>
          <rect x="92" y="98" width="136" height="70" fill="#e9ddfb" />
          <rect x="92" y="98" width="68" height="70" fill="#a9a6b2" className="transition-transform duration-500 group-hover:-translate-x-[60px]" />
          <rect x="160" y="98" width="68" height="70" fill="#8d8a96" className="transition-transform duration-500 group-hover:translate-x-[60px]" />
          <rect x="92" y="98" width="136" height="70" fill="none" stroke="#d9b26f" strokeWidth="2" />
        </g>
      </svg>
    );
  }
  if (slug === "film-projector-lightbox") {
    return (
      <svg aria-hidden viewBox="0 0 320 180" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="thumb-beam" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#ffd89a" stopOpacity=".8" />
            <stop offset="1" stopColor="#ffd89a" stopOpacity=".05" />
          </linearGradient>
          <linearGradient id="thumb-screen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#351367" />
            <stop offset="1" stopColor="#f08a7e" />
          </linearGradient>
        </defs>
        <rect width="320" height="180" fill="#120a1c" />
        <path d="M70 128 L150 24 L290 24 L290 128 Z" fill="url(#thumb-beam)" className="opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
        <rect x="150" y="24" width="140" height="104" fill="#16110c" />
        <rect x="160" y="32" width="120" height="88" fill="url(#thumb-screen)" />
        <circle cx="240" cy="84" r="14" fill="#ffd27a" />
        <path d="M160 96 L188 78 L210 92 L236 72 L280 98 L280 120 L160 120 Z" fill="#2a0f45" />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="152" y={30 + i * 12} width="5" height="6" rx="1" fill="#f0e6d2" opacity=".8" />
        ))}
        {[44, 84].map((cx) => (
          <g key={cx} className="transition-transform duration-700 group-hover:rotate-180" style={{ transformOrigin: `${cx}px 98px` }}>
            <circle cx={cx} cy="98" r="18" fill="#2a2430" stroke="#8d8799" strokeWidth="2" />
            {[0, 120, 240].map((a) => (
              <circle key={a} cx={cx + 9 * Math.cos((a * Math.PI) / 180)} cy={98 + 9 * Math.sin((a * Math.PI) / 180)} r="4.5" fill="#0e0b12" />
            ))}
          </g>
        ))}
        <rect x="30" y="116" width="76" height="30" rx="6" fill="#3a3342" />
        <rect x="104" y="122" width="10" height="16" rx="2" fill="#2a2430" />
        <circle cx="115" cy="130" r="4" fill="#ffd89a" />
      </svg>
    );
  }
  if (slug === "radio-tuner-pricing") {
    return (
      <svg aria-hidden viewBox="0 0 320 180" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="thumb-dial" cx="55%" cy="110%" r="90%">
            <stop offset="0" stopColor="#ffb347" />
            <stop offset="0.6" stopColor="#5a3412" />
            <stop offset="1" stopColor="#140903" />
          </radialGradient>
        </defs>
        <rect x="108" y="22" width="104" height="10" rx="5" fill="none" stroke="#d9b26f" strokeWidth="4" />
        <rect x="52" y="30" width="216" height="126" rx="18" fill="#351367" />
        <rect x="60" y="38" width="200" height="110" rx="13" fill="#1d0838" />
        <rect x="70" y="48" width="36" height="90" rx="8" fill="#2a1048" stroke="#d9b26f" strokeOpacity=".6" strokeWidth="2" />
        <rect x="114" y="48" width="96" height="34" rx="6" fill="url(#thumb-dial)" stroke="#d9b26f" strokeWidth="1.5" />
        {Array.from({ length: 15 }, (_, i) => (
          <line key={i} x1={120 + i * 6} x2={120 + i * 6} y1={i % 4 === 0 ? 66 : 70} y2="74" stroke="#ffe7c2" strokeOpacity=".6" />
        ))}
        <line x1="166" x2="166" y1="51" y2="79" stroke="#ff5a4e" strokeWidth="2.5" className="transition-transform duration-500 group-hover:translate-x-[24px]" />
        <rect x="114" y="88" width="96" height="50" rx="6" fill="#0f0619" />
        <text x="122" y="108" fill="#fff" fontSize="12" fontWeight="700" fontFamily="ui-sans-serif, system-ui">Pro</text>
        <text x="122" y="128" fill="#ffb347" fontSize="16" fontWeight="800" fontFamily="ui-sans-serif, system-ui">$12</text>
        <circle cx="236" cy="78" r="18" fill="#d9b26f" />
        <circle cx="236" cy="78" r="13" fill="#4a2380" />
        <line x1="236" y1="78" x2="236" y2="67" stroke="#ffb347" strokeWidth="3" strokeLinecap="round" className="origin-[236px_78px] transition-transform duration-500 group-hover:rotate-[70deg]" />
        <rect x="222" y="106" width="28" height="10" rx="3" fill="#ffb347" />
        <rect x="222" y="122" width="28" height="10" rx="5" fill="#d9b26f" opacity=".6" />
      </svg>
    );
  }
  if (slug === "typewriter-contact-form") {
    return (
      <svg aria-hidden viewBox="0 0 320 180" className="absolute inset-0 h-full w-full">
        <g className="transition-transform duration-500 group-hover:-translate-y-2">
          <rect x="102" y="14" width="116" height="104" rx="2" fill="#fdf8ee" stroke="#e7dcc7" />
          <text x="112" y="34" fontSize="9" fill="#1f1a2e" style={{ fontFamily: "var(--font-typewriter), Courier New, monospace" }}>
            Dear Lofistack,
          </text>
          {[50, 64, 78].map((y, i) => (
            <line key={y} x1="112" x2={i === 2 ? 180 : 206} y1={y} y2={y} stroke="#1f1a2e" strokeOpacity=".25" strokeDasharray="2 3" />
          ))}
          <text x="112" y="62" fontSize="8" fill="#1f1a2e" style={{ fontFamily: "var(--font-typewriter), Courier New, monospace" }}>
            Hello there!
          </text>
          <g transform="rotate(-8 186 72)">
            <rect x="160" y="64" width="50" height="14" rx="2" fill="none" stroke="#c8322b" strokeWidth="1.6" />
            <text x="185" y="74" textAnchor="middle" fontSize="7" fontWeight="700" fill="#c8322b" letterSpacing="1">REQUIRED</text>
          </g>
        </g>
        <rect x="84" y="96" width="152" height="12" rx="6" fill="#1a1420" />
        <circle cx="84" cy="102" r="8" fill="#cfcad8" />
        <circle cx="236" cy="102" r="8" fill="#cfcad8" />
        <path d="M66 110 H254 Q262 110 262 120 V156 Q262 166 250 166 H70 Q58 166 58 156 V120 Q58 110 66 110 Z" fill="#351367" />
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={`a${i}`} cx={98 + i * 15} cy="126" r="5" fill="#f4ecd8" />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={`b${i}`} cx={105 + i * 15} cy="140" r="5" fill="#f4ecd8" />
        ))}
        <rect x="98" y="150" width="88" height="7" rx="3.5" fill="#f4ecd8" />
        <rect x="194" y="148" width="50" height="11" rx="4" fill="#c8322b" />
      </svg>
    );
  }
  if (slug === "vinyl-player-card") {
    return (
      <svg aria-hidden viewBox="0 0 320 180" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="thumb-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#351367" />
            <stop offset="1" stopColor="#c86b98" />
          </linearGradient>
          <clipPath id="thumb-sleeve">
            <rect x="72" y="30" width="120" height="120" rx="4" />
          </clipPath>
        </defs>
        <g className="origin-[132px_90px] transition-transform duration-500 group-hover:translate-x-[34px]">
          <circle cx="166" cy="90" r="56" fill="#0d0a13" />
          {[22, 30, 38, 46].map((r) => (
            <circle key={r} cx="166" cy="90" r={r} fill="none" stroke="#fff" strokeOpacity="0.08" />
          ))}
          <circle cx="166" cy="90" r="18" fill="#ffc37a" />
          <circle cx="166" cy="90" r="2.5" fill="#f6f2fd" />
        </g>
        <g clipPath="url(#thumb-sleeve)">
          <rect x="72" y="30" width="120" height="120" fill="url(#thumb-sky)" />
          <circle cx="132" cy="104" r="28" fill="#ffc37a" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x="72" y={104 + i * 6} width="120" height={1.5 + i * 0.6} fill="#9a5287" />
          ))}
          <path d="M72 126 C92 118 108 124 124 125 C142 127 156 116 192 118 L192 150 L72 150 Z" fill="#1f0a3d" />
          <text x="82" y="48" fill="#fff" fontSize="11" letterSpacing="0.8" style={{ fontFamily: "var(--font-display), Impact, sans-serif" }}>
            MIDNIGHT COMMIT
          </text>
        </g>
        <rect x="72" y="30" width="120" height="120" rx="4" fill="none" stroke="#000" strokeOpacity="0.08" />
      </svg>
    );
  }
  return (
    <div className="absolute inset-0 flex items-end justify-center gap-[2%] px-[8%] pb-[17%]">
      <span aria-hidden className="font-display text-[clamp(2.4rem,7.5vw,4.25rem)] leading-[0.72] tracking-[0.06em] text-brand">
        LOFISTACK
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset("/thumbs/cat-reveal-hero-sitter.webp")}
        alt=""
        width={380}
        height={432}
        className="h-[calc(clamp(2.4rem,7.5vw,4.25rem)*0.8)] w-auto origin-bottom transition-transform duration-500 group-hover:-rotate-3"
      />
    </div>
  );
}
