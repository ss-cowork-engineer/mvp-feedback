"use client";

import { useState } from "react";

// Self-styled (Inline-Styles) → keine CSS-Abhängigkeit, läuft in jedem Projekt.
// Der Consumer reicht die Server-Action rein (bekommt FormData: kind, text).
export interface FeedbackWidgetProps {
  action: (formData: FormData) => void | Promise<void>;
  brandColor?: string;
  label?: string;
}

export function FeedbackWidget({ action, brandColor = "#e20074", label = "Feedback" }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"bug" | "feature">("feature");
  const [sent, setSent] = useState(false);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "8px 12px",
    fontSize: 13,
    borderRadius: 8,
    border: "1px solid " + (active ? brandColor : "rgba(128,128,128,0.35)"),
    background: active ? brandColor : "transparent",
    color: active ? "#fff" : "inherit",
    cursor: "pointer",
    fontWeight: 500,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setSent(false); }}
        style={{
          position: "fixed", right: 20, bottom: 20, zIndex: 50,
          padding: "10px 16px", borderRadius: 999, border: "none",
          background: brandColor, color: "#fff", fontWeight: 600, fontSize: 14,
          cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
        }}
      >
        {label}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 420, borderRadius: 16, padding: 20,
              background: "#1a1d24", color: "#e8eaed", border: "1px solid #2e333d",
            }}
          >
            {sent ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Danke! 🙌</div>
                <div style={{ fontSize: 13, color: "#9aa0aa", marginTop: 4 }}>
                  Deine Meldung ist eingegangen.
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{ marginTop: 14, padding: "8px 16px", borderRadius: 8, border: "1px solid #2e333d", background: "transparent", color: "inherit", cursor: "pointer" }}
                >
                  Schließen
                </button>
              </div>
            ) : (
              <form
                action={async (fd) => { await action(fd); setSent(true); }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Feedback geben</div>
                <input type="hidden" name="kind" value={kind} />
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button type="button" onClick={() => setKind("feature")} style={tabStyle(kind === "feature")}>
                    💡 Idee / Feature
                  </button>
                  <button type="button" onClick={() => setKind("bug")} style={tabStyle(kind === "bug")}>
                    🐞 Bug
                  </button>
                </div>
                <textarea
                  name="text"
                  required
                  rows={5}
                  placeholder={kind === "bug" ? "Was ist passiert? Was hast du erwartet?" : "Was würde dir helfen?"}
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8,
                    border: "1px solid #2e333d", background: "#232730", color: "inherit",
                    fontSize: 14, resize: "vertical", outline: "none",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
                  <button type="button" onClick={() => setOpen(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #2e333d", background: "transparent", color: "#9aa0aa", cursor: "pointer" }}>
                    Abbrechen
                  </button>
                  <button type="submit" style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: brandColor, color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                    Absenden
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
