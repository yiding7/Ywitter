import { forwardRef } from "react";
import type { Era } from "../lib/eras";
import {
  DotsIcon,
  HeartIcon,
  ReplyIcon,
  RetweetIcon,
  StarIcon,
  VerifiedIcon,
} from "./icons";

export type CardData = {
  name: string;
  handle: string;
  avatar: string;
  text: string;
  dateLabel: string;
  replies: number;
  retweets: number;
  likes: number;
};

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

// Era-accurate profile photo (stored locally, matched by year).
function Avatar({ era, src }: { era: Era; src: string }) {
  return (
    <img
      src={src}
      alt="avatar"
      crossOrigin="anonymous"
      style={{
        width: 48,
        height: 48,
        borderRadius: era.rounded,
        objectFit: "cover",
        flexShrink: 0,
        background: "#333",
      }}
    />
  );
}

// Neutral "Parody" label baked into the card so exports can't be passed off as real.
function ParodyBadge({ era }: { era: Era }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "1px 7px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 700,
        color: era.subtle,
        border: `1px solid ${era.border}`,
        background: era.id === "dark" ? "#16181c" : "#f2f3f5",
        whiteSpace: "nowrap",
      }}
    >
      Parody
    </span>
  );
}

function Brand({ era }: { era: Era }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 9999,
          background: era.id === "dark" ? "#fff" : era.accent,
          color: era.id === "dark" ? "#000" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: 18,
          fontStyle: "italic",
        }}
      >
        Y
      </div>
      {era.brand !== "Y" && (
        <span
          style={{ fontWeight: 800, fontSize: 15, color: era.subtle }}
        >
          {era.brand}
        </span>
      )}
    </div>
  );
}

type Props = { era: Era; data: CardData; bodyFont: string };

export const YwitterCard = forwardRef<HTMLDivElement, Props>(
  ({ era, data, bodyFont }, ref) => {
    const Like = era.likeIcon === "heart" ? HeartIcon : StarIcon;
    const actionColor = era.subtle;

    return (
      <div
        ref={ref}
        style={{
          width: 520,
          background: era.cardBg,
          color: era.text,
          border: `1px solid ${era.border}`,
          borderRadius: era.id === "early" ? 6 : 16,
          padding: 16,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <Avatar era={era} src={data.avatar} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{data.name}</span>
                {era.verified && <VerifiedIcon color={era.accent} />}
                <span style={{ color: era.subtle, fontSize: 15, marginLeft: 2 }}>
                  {data.handle}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ParodyBadge era={era} />
                <DotsIcon color={era.subtle} />
              </div>
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 20,
                lineHeight: 1.4,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: bodyFont,
              }}
            >
              {data.text}
            </div>

            <div style={{ marginTop: 12, color: era.subtle, fontSize: 14 }}>
              {data.dateLabel}
            </div>

            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px solid ${era.border}`,
                display: "flex",
                justifyContent: "space-between",
                maxWidth: 380,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: actionColor, fontSize: 13 }}>
                <ReplyIcon color={actionColor} /> {fmt(data.replies)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: actionColor, fontSize: 13 }}>
                <RetweetIcon color={actionColor} /> {fmt(data.retweets)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: era.likeColor, fontSize: 13 }}>
                <Like color={era.likeColor} /> {fmt(data.likes)}
              </span>
              <Brand era={era} />
            </div>
          </div>
        </div>
      </div>
    );
  },
);
