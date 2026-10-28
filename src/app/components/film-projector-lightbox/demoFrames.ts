import type { ProjectorImage } from "@/components/projector-lightbox";

/**
 * Demo "photos" for the projector — small lofi landscapes drawn as SVG and
 * embedded as data URIs, so the preview works offline with no image files.
 */

type Scene = {
  sky: [string, string];
  sun: string;
  sunY: number;
  far: string;
  near: string;
  kind: "mountains" | "city" | "sea" | "dunes" | "forest";
  stars?: boolean;
};

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function svg(scene: Scene, seed: number) {
  const r = rng(seed);
  const W = 800;
  const H = 600;
  let body = "";
  if (scene.stars) {
    for (let i = 0; i < 40; i++) body += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H * 0.45).toFixed(0)}" r="${(r() * 1.6 + 0.4).toFixed(1)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
  }
  body += `<circle cx="${W * 0.62}" cy="${scene.sunY}" r="70" fill="${scene.sun}"/>`;
  const ridge = (base: number, amp: number, step: number, color: string) => {
    let d = `M0 ${H} L0 ${base}`;
    for (let x = 0; x <= W; x += step) d += ` L${x} ${(base - r() * amp).toFixed(0)}`;
    return `<path d="${d} L${W} ${H} Z" fill="${color}"/>`;
  };
  switch (scene.kind) {
    case "mountains":
      body += ridge(380, 160, 80, scene.far) + ridge(470, 90, 60, scene.near);
      break;
    case "city": {
      body += ridge(430, 60, 100, scene.far);
      let x = 0;
      while (x < W) {
        const w = 50 + r() * 70;
        const h = 120 + r() * 220;
        body += `<rect x="${x.toFixed(0)}" y="${(H - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${scene.near}"/>`;
        for (let wy = H - h + 14; wy < H - 20; wy += 22)
          for (let wx = x + 8; wx < x + w - 10; wx += 16)
            if (r() > 0.6) body += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="7" height="10" fill="#ffd27a" opacity=".85"/>`;
        x += w + 4;
      }
      break;
    }
    case "sea":
      body += `<rect y="380" width="${W}" height="220" fill="${scene.far}"/>`;
      for (let i = 0; i < 14; i++) body += `<rect x="${(W * 0.62 - 90 + r() * 60).toFixed(0)}" y="${390 + i * 14}" width="${(60 + r() * 80).toFixed(0)}" height="3" fill="${scene.sun}" opacity="${(0.7 - i * 0.04).toFixed(2)}"/>`;
      body += ridge(560, 30, 100, scene.near);
      break;
    case "dunes":
      body += `<path d="M0 420 Q200 340 420 410 T800 380 L800 600 L0 600 Z" fill="${scene.far}"/><path d="M0 500 Q260 420 520 500 T800 470 L800 600 L0 600 Z" fill="${scene.near}"/>`;
      break;
    case "forest":
      body += ridge(400, 80, 90, scene.far);
      for (let i = 0; i < 26; i++) {
        const tx = r() * W;
        const th = 90 + r() * 120;
        body += `<path d="M${tx.toFixed(0)} ${(H - 60 - th).toFixed(0)} L${(tx + 28).toFixed(0)} ${H - 40} L${(tx - 28).toFixed(0)} ${H - 40} Z" fill="${scene.near}"/>`;
      }
      body += `<rect y="${H - 50}" width="${W}" height="50" fill="${scene.near}"/>`;
      break;
  }
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${scene.sky[0]}"/><stop offset="1" stop-color="${scene.sky[1]}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(doc)}`;
}

const SCENES: (Scene & { alt: string; caption: string })[] = [
  { kind: "mountains", sky: ["#351367", "#f08a7e"], sun: "#ffd27a", sunY: 330, far: "#5b2a7a", near: "#2a0f45", alt: "Purple mountains at sunset", caption: "Ridge line, last light" },
  { kind: "city", sky: ["#0d1b3d", "#5a3f8a"], sun: "#f6e7c1", sunY: 170, far: "#2a2350", near: "#141028", stars: true, alt: "City skyline at night with lit windows", caption: "Night shift downtown" },
  { kind: "sea", sky: ["#f4a26b", "#f8d7a8"], sun: "#fff1c9", sunY: 360, far: "#2b5d7a", near: "#163548", alt: "Sun setting over a calm sea", caption: "Low tide, golden hour" },
  { kind: "dunes", sky: ["#f7c59f", "#fbe6c8"], sun: "#ffffff", sunY: 250, far: "#d98b54", near: "#a85a2e", alt: "Desert dunes under a pale sun", caption: "Somewhere south" },
  { kind: "forest", sky: ["#123a3a", "#7fb5a0"], sun: "#f3f0d0", sunY: 260, far: "#2e5a4c", near: "#0f2a24", alt: "Pine forest at dawn", caption: "Pines before breakfast" },
  { kind: "mountains", sky: ["#0b0f2e", "#3b3f8a"], sun: "#e8eaff", sunY: 160, far: "#2a2f6a", near: "#14173a", stars: true, alt: "Snowy peaks under a moonlit sky", caption: "Moon over the pass" },
  { kind: "city", sky: ["#f28c6a", "#ffd3a1"], sun: "#fff3d6", sunY: 300, far: "#c7637a", near: "#5a2440", alt: "City silhouette at dusk", caption: "Commute in pink" },
  { kind: "sea", sky: ["#241047", "#8b4c8f"], sun: "#ffc4a8", sunY: 340, far: "#3d1f5c", near: "#1a0b2e", stars: true, alt: "Violet sea at twilight", caption: "Lofi harbour" },
];

export const DEMO_FRAMES: ProjectorImage[] = SCENES.map((s, i) => ({ src: svg(s, i + 7), alt: s.alt, caption: s.caption }));
