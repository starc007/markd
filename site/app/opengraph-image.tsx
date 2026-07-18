import { ImageResponse } from "next/og";

export const alt = "Markd: local-first Markdown notes for macOS and Linux";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The app hash "#" mark, inlined as a data URI (matches icon-source.svg).
const MARK = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024' viewBox='0 0 1024 1024'><rect width='1024' height='1024' rx='224' fill='#191919'/><g stroke='#fbfbfa' stroke-width='84' stroke-linecap='round'><line x1='390' y1='280' x2='390' y2='744'/><line x1='634' y1='280' x2='634' y2='744'/><line x1='280' y1='390' x2='744' y2='390'/><line x1='280' y1='634' x2='744' y2='634'/></g></svg>`,
)}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fcfcfb",
          color: "#191917",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARK} width={64} height={64} alt="" />
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
            Markd
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: -3.5,
              maxWidth: 1000,
            }}
          >
            <span style={{ color: "#191917" }}>The last notes app&nbsp;</span>
            <span style={{ color: "#9c9c95" }}>you&rsquo;ll download.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#6a6a64",
              maxWidth: 860,
            }}
          >
            Local-first Markdown for macOS and Linux, with plain files you own.
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: "#9c9c95",
          }}
        >
          <div style={{ display: "flex" }}>usemarkd.app</div>
          <div style={{ display: "flex" }}>Free · macOS · Linux</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
