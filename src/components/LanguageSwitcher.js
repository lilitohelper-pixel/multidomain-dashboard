"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SUPPORTED_LANGUAGES, t } from "@/lib/i18n";

export default function LanguageSwitcher({ userId, lang }) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function choose(newLang) {
    setOpen(false);
    if (newLang === lang) return;
    setSaving(true);
    await supabase.from("users").update({ language: newLang }).eq("id", userId);
    setSaving(false);
    router.refresh();
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "5px 10px",
          borderRadius: 999,
          border: "1px solid var(--border-strong)",
          background: "var(--surface)",
          color: "var(--text)",
          font: "inherit",
          fontSize: 13,
          lineHeight: 1,
          cursor: "pointer",
        }}
      >
        <span aria-hidden="true">🌐</span>
        <span style={{ color: "var(--text-muted)" }}>{t(lang, "language_switcher_label")}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t(lang, "language_switcher_label")}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            margin: 0,
            padding: 4,
            listStyle: "none",
            width: 160,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
            zIndex: 60,
          }}
        >
          {SUPPORTED_LANGUAGES.map((code) => {
            const selected = code === lang;
            return (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(code)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    width: "100%",
                    padding: "7px 8px",
                    borderRadius: 7,
                    border: "none",
                    background: selected ? "var(--surface-alt)" : "transparent",
                    color: "var(--text)",
                    font: "inherit",
                    fontSize: 13,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ flex: 1 }}>{t(lang, `language_${code}`)}</span>
                  {selected && (
                    <span aria-hidden="true" style={{ color: "var(--action)" }}>
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
