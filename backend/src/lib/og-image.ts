import satori, { init } from "satori";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
// @ts-expect-error -- WASM modules imported as ES modules in Cloudflare Workers
import yogaWasm from "../../node_modules/satori/yoga.wasm";
// @ts-expect-error -- WASM modules imported as ES modules in Cloudflare Workers
import resvgWasm from "../../node_modules/@resvg/resvg-wasm/index_bg.wasm";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// Google Fonts CDN URLs for Noto Sans (Latin subset, wght 400 and 700)
const FONT_URL_REGULAR =
  "https://fonts.gstatic.com/s/notosans/v39/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A-9a6Vc.ttf";
const FONT_URL_BOLD =
  "https://fonts.gstatic.com/s/notosans/v39/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyAeBu9a6Vc.ttf";

let wasmInitialized = false;

// --- Helpers to build React-like element trees for Satori ---

type SatoriChild = SatoriElement | string;

interface SatoriElement {
  type: string;
  props: Record<string, unknown> & {
    children?: SatoriChild | SatoriChild[];
    style?: Record<string, unknown>;
  };
  key?: string | number | null;
}

function h(
  type: string,
  props: Record<string, unknown> | null,
  ...children: SatoriChild[]
): SatoriElement {
  const flatChildren = children.flat();
  return {
    type,
    props: {
      ...(props ?? {}),
      children:
        flatChildren.length === 0
          ? undefined
          : flatChildren.length === 1
            ? flatChildren[0]
            : flatChildren,
    },
  };
}

// --- Score tone logic ---

function getScoreTone(score: number): { color: string; label: string } {
  if (score >= 90) return { color: "#FF4444", label: "FIRE" };
  if (score >= 70) return { color: "#FF9800", label: "STRONG" };
  if (score >= 50) return { color: "#4CAF50", label: "CALM" };
  return { color: "#2196F3", label: "REST" };
}

// --- Font fetching with KV cache ---

async function fetchFont(
  kv: KVNamespace,
  url: string,
  cacheKey: string
): Promise<ArrayBuffer> {
  const cached = await kv.get(cacheKey, "arrayBuffer");
  if (cached) return cached;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font from ${url}: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();

  // Cache for 30 days
  await kv.put(cacheKey, buffer, { expirationTtl: 60 * 60 * 24 * 30 });
  return buffer;
}

// --- WASM initialization ---

async function ensureWasmInitialized(): Promise<void> {
  if (wasmInitialized) return;

  await init(yogaWasm);
  await initWasm(resvgWasm);
  wasmInitialized = true;
}

// --- Share card element tree builder ---

export interface ShareCardData {
  score: number;
  date: string;
  focusIndex?: number;
  stabilityIndex?: number;
  growthIndex?: number;
  streakDays?: number;
}

function buildShareCardElement(data: ShareCardData): SatoriElement {
  const { score, date, focusIndex, stabilityIndex, growthIndex, streakDays } =
    data;
  const { color: toneColor, label: toneLabel } = getScoreTone(score);

  const statItems: { label: string; value: string }[] = [];
  if (focusIndex != null)
    statItems.push({ label: "Focus", value: String(focusIndex) });
  if (stabilityIndex != null)
    statItems.push({ label: "Stability", value: String(stabilityIndex) });
  if (growthIndex != null)
    statItems.push({ label: "Growth", value: String(growthIndex) });
  if (streakDays != null)
    statItems.push({ label: "Streak", value: `${streakDays}d` });

  // Build stat items row
  const statElements = statItems.map((item) =>
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            fontSize: "32px",
            fontWeight: 700,
            color: "#E0E0FF",
          },
        },
        item.value
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            fontSize: "16px",
            color: "#8888AA",
            marginTop: "4px",
          },
        },
        item.label
      )
    )
  );

  // Root container
  const children: SatoriChild[] = [
    // Header: icon + title
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          marginBottom: "10px",
        },
      },
      // Colored dot
      h("div", {
        style: {
          display: "flex",
          width: "44px",
          height: "44px",
          borderRadius: "22px",
          backgroundColor: toneColor,
          marginRight: "16px",
          opacity: 0.9,
        },
      }),
      // Title
      h(
        "div",
        {
          style: {
            display: "flex",
            fontSize: "40px",
            fontWeight: 700,
            color: "#E0E0FF",
            letterSpacing: "-0.02em",
          },
        },
        "BrainPulse"
      )
    ),

    // Date
    h(
      "div",
      {
        style: {
          display: "flex",
          fontSize: "20px",
          color: "#8888AA",
          marginBottom: "36px",
        },
      },
      date
    ),

    // Score circle
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "220px",
          height: "220px",
          borderRadius: "110px",
          border: `6px solid ${toneColor}`,
          marginBottom: "16px",
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            fontSize: "80px",
            fontWeight: 700,
            color: toneColor,
            lineHeight: 1,
          },
        },
        String(score)
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            fontSize: "20px",
            color: "#AAAACC",
            marginTop: "4px",
          },
        },
        "/ 100"
      )
    ),

    // Tone label
    h(
      "div",
      {
        style: {
          display: "flex",
          fontSize: "28px",
          fontWeight: 700,
          color: toneColor,
          marginBottom: "36px",
          letterSpacing: "0.05em",
        },
      },
      toneLabel
    ),
  ];

  // Stats row (only if there are stats)
  if (statElements.length > 0) {
    children.push(
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "row",
            gap: "40px",
          },
        },
        ...statElements
      )
    );
  }

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: `${OG_WIDTH}px`,
        height: `${OG_HEIGHT}px`,
        backgroundColor: "#1A1B2E",
        color: "#FFFFFF",
        fontFamily: "Noto Sans",
        padding: "60px",
      },
    },
    ...children
  );
}

// --- Public API ---

/**
 * Generate an OG share card as a PNG buffer.
 */
export async function generateShareCardPng(
  kv: KVNamespace,
  data: ShareCardData
): Promise<Uint8Array> {
  await ensureWasmInitialized();

  const [regularFont, boldFont] = await Promise.all([
    fetchFont(kv, FONT_URL_REGULAR, "font:noto-sans:regular"),
    fetchFont(kv, FONT_URL_BOLD, "font:noto-sans:bold"),
  ]);

  const element = buildShareCardElement(data);

  const svg = await satori(element as unknown as React.ReactNode, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: [
      { name: "Noto Sans", data: regularFont, weight: 400, style: "normal" },
      { name: "Noto Sans", data: boldFont, weight: 700, style: "normal" },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: OG_WIDTH },
  });

  const rendered = resvg.render();
  const png = rendered.asPng();
  rendered.free();
  resvg.free();

  return png;
}

/**
 * Generate an OG share card as an SVG string (fallback if PNG conversion fails).
 */
export async function generateShareCardSvg(
  kv: KVNamespace,
  data: ShareCardData
): Promise<string> {
  await ensureWasmInitialized();

  const [regularFont, boldFont] = await Promise.all([
    fetchFont(kv, FONT_URL_REGULAR, "font:noto-sans:regular"),
    fetchFont(kv, FONT_URL_BOLD, "font:noto-sans:bold"),
  ]);

  const element = buildShareCardElement(data);

  return satori(element as unknown as React.ReactNode, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: [
      { name: "Noto Sans", data: regularFont, weight: 400, style: "normal" },
      { name: "Noto Sans", data: boldFont, weight: 700, style: "normal" },
    ],
  });
}
