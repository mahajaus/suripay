"use client";

import { SP } from "@/lib/ui";

// Herbruikbaar PIN-toetsenbord met cijferbolletjes.
export default function PinPad({
  len = 6,
  value,
  onDigit,
  onDelete,
  disabled,
}: {
  len?: number;
  value: string;
  onDigit: (d: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {Array.from({ length: len }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: value.length > i ? SP.gold : "rgba(255,255,255,.15)",
              transition: "all .2s",
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
          maxWidth: 280,
          margin: "0 auto",
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "⌫"].map((n, i) =>
          n === null ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              disabled={disabled}
              onClick={() => (n === "⌫" ? onDelete() : onDigit(String(n)))}
              style={{
                height: 60,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,.15)",
                background: "rgba(255,255,255,.07)",
                color: "#fff",
                fontSize: n === "⌫" ? 18 : 22,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {n}
            </button>
          )
        )}
      </div>
    </div>
  );
}
