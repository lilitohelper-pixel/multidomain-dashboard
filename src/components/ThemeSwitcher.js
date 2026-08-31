"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "dashboard-theme";

export const THEMES = [
  {
    id: "ember",
    name: "Forest and ember",
    swatches: ["#16281f", "#c0562a", "#e4a33a"],
  },
  {
    id: "sage",
    name: "Sage and ochre",
    swatches: ["#24422f", "#9db0a7", "#d98e2b"],
  },
  {
    id: "umber",
    name: "Umber and fern",
    swatches: ["#5a3520", "#4a5d34", "#c0562a"],
  },
];

export function applyTheme(id) {
  document.documentElement.setAttribute("data-theme", id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Private browsing or storage disabled: the theme still applies for
    // this session, it just will not be remembered.
  }
}

export default function ThemeSwitcher({ inline = false }) {
  const [theme, setTheme] = useState("ember");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const stored = document.documentElement.getAttribute("data-theme");
    if (stored) setTheme(stored);
  }, []);

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

  function choose(id) {
    setTheme(id);
    applyTheme(id);
    setOpen(false);
  }

  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  const wrapStyle = inline
    ? { position: "relative" }
    : { position: "fixed", top: 14, right: 18, zIndex: 60 };

  return (
    <div ref={wrapRef} style={wrapStyle}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Colour scheme: ${active.name}. Change it`}
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
        <Swatches colors={active.swatches} />
        <span style={{ color: "var(--text-muted)" }}>Theme</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Colour scheme"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            margin: 0,
            padding: 4,
            listStyle: "none",
            width: 208,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
          }}
        >
          {THEMES.map((t) => {
            const selected = t.id === theme;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(t.id)}
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
                  <Swatches colors={t.swatches} />
                  <span style={{ flex: 1 }}>{t.name}</span>
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

function Swatches({ colors }) {
  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-flex", gap: 3, flex: "none" }}
    >
      {colors.map((c) => (
        <span
          key={c}
          style={{
            width: 10,
            height: 10,
            borderRadius: 3,
            background: c,
            boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.08)",
          }}
        />
      ))}
    </span>
  );
}
